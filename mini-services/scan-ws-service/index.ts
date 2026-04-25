import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import { Database } from 'bun:sqlite'

// ─── Database Setup ────────────────────────────────────────────────
const db = new Database('/home/z/my-project/db/custom.db')

// Enable WAL mode for better concurrent read performance
db.exec('PRAGMA journal_mode=WAL;')
db.exec('PRAGMA foreign_keys=ON;')

// ─── Types ─────────────────────────────────────────────────────────
interface ScanRow {
  id: string
  projectId: string
  name: string
  status: string
  progress: number
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

interface ScanStageRow {
  id: string
  scanId: string
  stageName: string
  displayName: string
  status: string
  progress: number
  resultsCount: number
  startedAt: string | null
  completedAt: string | null
  order: number
  createdAt: string
}

interface ScanLogRow {
  id: string
  scanId: string
  level: string
  message: string
  timestamp: string
}

interface FindingRow {
  id: string
  scanId: string
  category: string
  severity: string
  url: string
  title: string
  data: string
  verified: number
  createdAt: string
}

interface ScanState {
  scan: ScanRow
  stages: ScanStageRow[]
  findingCount: number
  logCount: number
}

// ─── State Tracking ────────────────────────────────────────────────
// Track the last known state for each scan that has active subscribers
const scanStates = new Map<string, ScanState>()

// Track which scan rooms have active subscribers
const scanSubscribers = new Map<string, Set<string>>() // scanId -> Set of socket IDs

// ─── Helper: Safe Query ────────────────────────────────────────────
function queryOne<T>(sql: string, params: Record<string, string | number | null>): T | null {
  try {
    const stmt = db.prepare(sql)
    const result = stmt.get(params) as unknown as T | undefined
    return result ?? null
  } catch (err) {
    console.error('[DB] queryOne error:', err)
    return null
  }
}

function queryAll<T>(sql: string, params: Record<string, string | number | null> = {}): T[] {
  try {
    const stmt = db.prepare(sql)
    return stmt.all(params) as unknown as T[]
  } catch (err) {
    console.error('[DB] queryAll error:', err)
    return []
  }
}

// ─── Socket.io Server Setup ────────────────────────────────────────
const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// ─── Event Handlers ────────────────────────────────────────────────
io.on('connection', (socket: Socket) => {
  console.log(`[WS] Client connected: ${socket.id}`)

  // ── join-scan ──
  socket.on('join-scan', (data: { scanId: string }) => {
    const { scanId } = data

    if (!scanId || typeof scanId !== 'string') {
      socket.emit('error', { message: 'Invalid scanId provided' })
      return
    }

    // Join the socket.io room for this scan
    socket.join(`scan:${scanId}`)

    // Track subscriber
    if (!scanSubscribers.has(scanId)) {
      scanSubscribers.set(scanId, new Set())
    }
    scanSubscribers.get(scanId)!.add(socket.id)

    // Also track on the socket for cleanup on disconnect
    ;(socket as any)._subscribedScans = (
      (socket as any)._subscribedScans || new Set<string>()
    )
    ;(socket as any)._subscribedScans.add(scanId)

    // Initialize scan state if not already tracked
    if (!scanStates.has(scanId)) {
      const scan = queryOne<ScanRow>(
        'SELECT * FROM Scan WHERE id = $id',
        { $id: scanId }
      )
      if (scan) {
        const stages = queryAll<ScanStageRow>(
          'SELECT * FROM ScanStage WHERE scanId = $scanId ORDER BY "order" ASC',
          { $scanId: scanId }
        )
        const findingResult = queryOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM Finding WHERE scanId = $scanId',
          { $scanId: scanId }
        )
        const logResult = queryOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM ScanLog WHERE scanId = $scanId',
          { $scanId: scanId }
        )

        scanStates.set(scanId, {
          scan,
          stages,
          findingCount: findingResult?.count ?? 0,
          logCount: logResult?.count ?? 0,
        })
      }
    }

    // Send current scan state to the joining client
    const currentState = scanStates.get(scanId)
    if (currentState) {
      socket.emit('scan-update', {
        scanId,
        status: currentState.scan.status,
        progress: currentState.scan.progress,
        name: currentState.scan.name,
        startedAt: currentState.scan.startedAt,
        completedAt: currentState.scan.completedAt,
      })

      // Send all current stages
      for (const stage of currentState.stages) {
        socket.emit('stage-update', {
          scanId,
          stageId: stage.id,
          stageName: stage.stageName,
          displayName: stage.displayName,
          status: stage.status,
          progress: stage.progress,
          resultsCount: stage.resultsCount,
        })
      }
    }

    console.log(`[WS] Client ${socket.id} joined scan: ${scanId}`)
  })

  // ── leave-scan ──
  socket.on('leave-scan', (data: { scanId: string }) => {
    const { scanId } = data

    if (!scanId) return

    socket.leave(`scan:${scanId}`)

    // Remove subscriber
    const subs = scanSubscribers.get(scanId)
    if (subs) {
      subs.delete(socket.id)
      // Clean up empty rooms
      if (subs.size === 0) {
        scanSubscribers.delete(scanId)
        scanStates.delete(scanId)
      }
    }

    // Remove from socket tracking
    const subscribed = (socket as any)._subscribedScans as Set<string> | undefined
    if (subscribed) {
      subscribed.delete(scanId)
    }

    console.log(`[WS] Client ${socket.id} left scan: ${scanId}`)
  })

  // ── get-scan-status ──
  socket.on('get-scan-status', (data: { scanId: string }) => {
    const { scanId } = data

    if (!scanId) {
      socket.emit('error', { message: 'Invalid scanId provided' })
      return
    }

    const scan = queryOne<ScanRow>(
      'SELECT * FROM Scan WHERE id = $id',
      { $id: scanId }
    )

    if (!scan) {
      socket.emit('error', { message: `Scan not found: ${scanId}` })
      return
    }

    const stages = queryAll<ScanStageRow>(
      'SELECT * FROM ScanStage WHERE scanId = $scanId ORDER BY "order" ASC',
      { $scanId: scanId }
    )

    const findingCount = queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM Finding WHERE scanId = $scanId',
      { $scanId: scanId }
    )

    const logCount = queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM ScanLog WHERE scanId = $scanId',
      { $scanId: scanId }
    )

    socket.emit('scan-update', {
      scanId,
      status: scan.status,
      progress: scan.progress,
      name: scan.name,
      startedAt: scan.startedAt,
      completedAt: scan.completedAt,
      stages: stages.map((s) => ({
        stageId: s.id,
        stageName: s.stageName,
        displayName: s.displayName,
        status: s.status,
        progress: s.progress,
        resultsCount: s.resultsCount,
      })),
      findingCount: findingCount?.count ?? 0,
      logCount: logCount?.count ?? 0,
    })
  })

  // ── disconnect ──
  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`)

    // Clean up all scan subscriptions for this socket
    const subscribed = (socket as any)._subscribedScans as Set<string> | undefined
    if (subscribed) {
      for (const scanId of subscribed) {
        const subs = scanSubscribers.get(scanId)
        if (subs) {
          subs.delete(socket.id)
          if (subs.size === 0) {
            scanSubscribers.delete(scanId)
            scanStates.delete(scanId)
          }
        }
      }
      subscribed.clear()
    }
  })

  // ── error ──
  socket.on('error', (error: Error) => {
    console.error(`[WS] Socket error (${socket.id}):`, error)
  })
})

// ─── Polling Mechanism ─────────────────────────────────────────────
// Every 2 seconds, check for scan changes and emit events
const POLL_INTERVAL = 2000

function pollScanChanges() {
  // Only poll scans that have active subscribers
  for (const [scanId, subscribers] of scanSubscribers) {
    if (subscribers.size === 0) continue

    const previousState = scanStates.get(scanId)
    if (!previousState) continue

    // ── Check scan status/progress changes ──
    const currentScan = queryOne<ScanRow>(
      'SELECT * FROM Scan WHERE id = $id',
      { $id: scanId }
    )

    if (!currentScan) {
      // Scan was deleted
      scanStates.delete(scanId)
      scanSubscribers.delete(scanId)
      continue
    }

    if (
      currentScan.status !== previousState.scan.status ||
      currentScan.progress !== previousState.scan.progress
    ) {
      // Emit scan-update to the room
      io.to(`scan:${scanId}`).emit('scan-update', {
        scanId,
        status: currentScan.status,
        progress: currentScan.progress,
        name: currentScan.name,
        startedAt: currentScan.startedAt,
        completedAt: currentScan.completedAt,
      })

      // Check if scan completed
      if (
        currentScan.status === 'completed' &&
        previousState.scan.status !== 'completed'
      ) {
        io.to(`scan:${scanId}`).emit('scan-complete', {
          scanId,
          status: currentScan.status,
          completedAt: currentScan.completedAt,
        })
      }

      // Check if scan failed
      if (
        currentScan.status === 'failed' &&
        previousState.scan.status !== 'failed'
      ) {
        io.to(`scan:${scanId}`).emit('scan-complete', {
          scanId,
          status: currentScan.status,
          completedAt: currentScan.completedAt,
        })
      }

      // Update tracked state
      previousState.scan = currentScan
    }

    // ── Check stage changes ──
    const currentStages = queryAll<ScanStageRow>(
      'SELECT * FROM ScanStage WHERE scanId = $scanId ORDER BY "order" ASC',
      { $scanId: scanId }
    )

    for (const currentStage of currentStages) {
      const previousStage = previousState.stages.find(
        (s) => s.id === currentStage.id
      )

      if (
        !previousStage ||
        currentStage.status !== previousStage.status ||
        currentStage.progress !== previousStage.progress ||
        currentStage.resultsCount !== previousStage.resultsCount
      ) {
        io.to(`scan:${scanId}`).emit('stage-update', {
          scanId,
          stageId: currentStage.id,
          stageName: currentStage.stageName,
          displayName: currentStage.displayName,
          status: currentStage.status,
          progress: currentStage.progress,
          resultsCount: currentStage.resultsCount,
        })
      }
    }

    // Update tracked stages
    previousState.stages = currentStages

    // ── Check for new findings ──
    const findingResult = queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM Finding WHERE scanId = $scanId',
      { $scanId: scanId }
    )
    const currentFindingCount = findingResult?.count ?? 0

    if (currentFindingCount > previousState.findingCount) {
      const newCount = currentFindingCount - previousState.findingCount
      // Get the newest findings that were added
      const newFindings = queryAll<FindingRow>(
        'SELECT * FROM Finding WHERE scanId = $scanId ORDER BY createdAt DESC LIMIT $limit',
        { $scanId: scanId, $limit: newCount }
      )

      // Emit in chronological order (reverse of DESC query)
      for (const finding of newFindings.reverse()) {
        io.to(`scan:${scanId}`).emit('new-finding', {
          scanId,
          finding: {
            id: finding.id,
            category: finding.category,
            severity: finding.severity,
            url: finding.url,
            title: finding.title,
            data: finding.data,
            verified: Boolean(finding.verified),
            createdAt: finding.createdAt,
          },
        })
      }

      previousState.findingCount = currentFindingCount
    }

    // ── Check for new log entries ──
    const logResult = queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM ScanLog WHERE scanId = $scanId',
      { $scanId: scanId }
    )
    const currentLogCount = logResult?.count ?? 0

    if (currentLogCount > previousState.logCount) {
      const newCount = currentLogCount - previousState.logCount
      // Get the newest log entries that were added
      const newLogs = queryAll<ScanLogRow>(
        'SELECT * FROM ScanLog WHERE scanId = $scanId ORDER BY timestamp DESC LIMIT $limit',
        { $scanId: scanId, $limit: newCount }
      )

      // Emit in chronological order (reverse of DESC query)
      for (const log of newLogs.reverse()) {
        io.to(`scan:${scanId}`).emit('scan-log', {
          scanId,
          log: {
            id: log.id,
            level: log.level,
            message: log.message,
            timestamp: log.timestamp,
          },
        })
      }

      previousState.logCount = currentLogCount
    }
  }
}

// Start polling
const pollTimer = setInterval(pollScanChanges, POLL_INTERVAL)

// ─── Start Server ──────────────────────────────────────────────────
const PORT = 3003

httpServer.listen(PORT, () => {
  console.log(`[Scan WS Service] WebSocket server running on port ${PORT}`)
  console.log(`[Scan WS Service] DB polling interval: ${POLL_INTERVAL}ms`)
})

// ─── Graceful Shutdown ─────────────────────────────────────────────
function shutdown(signal: string) {
  console.log(`[Scan WS Service] Received ${signal}, shutting down...`)

  clearInterval(pollTimer)

  io.disconnectSockets(true)

  httpServer.close(() => {
    console.log('[Scan WS Service] Server closed')
    db.close()
    process.exit(0)
  })

  // Force exit after 5 seconds
  setTimeout(() => {
    console.error('[Scan WS Service] Forced shutdown after timeout')
    db.close()
    process.exit(1)
  }, 5000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
