// ============================================================
// ReconForge - Bug Bounty Automation Platform - Type Definitions
// ============================================================

// ---- Projects / Targets ----
export interface Project {
  id: string;
  name: string;
  domains: string[];
  description: string;
  customHeaders: Record<string, string>;
  status: 'active' | 'paused' | 'completed';
  subdomainCount: number;
  endpointCount: number;
  vulnerabilityCount: number;
  lastScanDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  domains: string[];
  description?: string;
  customHeaders?: Record<string, string>;
}

// ---- Scans ----
export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type StageStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface Scan {
  id: string;
  projectId: string;
  projectName: string;
  status: ScanStatus;
  progress: number;
  currentStage: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  stages: ScanStage[];
}

export interface ScanStage {
  id: string;
  name: string;
  displayName: string;
  status: StageStatus;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  findingsCount: number;
  error: string | null;
}

export interface StartScanInput {
  projectId: string;
  stages?: string[];
  options?: Record<string, unknown>;
}

// ---- Subdomains ----
export interface Subdomain {
  id: string;
  projectId: string;
  domain: string;
  ip: string | null;
  status: number | null;
  alive: boolean;
  webServer: string | null;
  title: string | null;
  technologies: string[];
  ports: number[];
  statusCode: number | null;
  contentLength: number | null;
  responseTime: number | null;
  discoveredAt: string;
}

// ---- Endpoints ----
export interface Endpoint {
  id: string;
  projectId: string;
  url: string;
  method: string;
  statusCode: number | null;
  contentType: string | null;
  contentLength: number | null;
  category: EndpointCategory;
  subdomain: string | null;
  discoveredAt: string;
}

export type EndpointCategory =
  | 'api'
  | 'js'
  | 'sensitive'
  | 'login'
  | 'admin'
  | 'idor'
  | 'upload'
  | 'parameter'
  | 'other';

// ---- Vulnerabilities ----
export type VulnSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type VulnStatus = 'open' | 'confirmed' | 'false_positive' | 'fixed' | 'accepted';

export interface Vulnerability {
  id: string;
  projectId: string;
  title: string;
  severity: VulnSeverity;
  url: string;
  type: string;
  status: VulnStatus;
  description: string;
  evidence: string;
  remediation: string;
  cwe: string | null;
  cvss: number | null;
  discoveredAt: string;
  updatedAt: string;
}

// ---- Findings ----
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type FindingType = 'subdomain' | 'endpoint' | 'vulnerability' | 'info' | 'sensitive' | 'technology';

export interface Finding {
  id: string;
  scanId: string;
  stageName: string;
  type: FindingType;
  severity: FindingSeverity;
  title: string;
  description: string;
  url: string | null;
  data: Record<string, unknown>;
  discoveredAt: string;
}

// ---- Reports ----
export interface Report {
  id: string;
  projectId: string;
  projectName: string;
  generatedAt: string;
  sections: ReportSection[];
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'executive_summary' | 'attack_surface' | 'subdomain_inventory' | 'endpoint_categories' | 'vulnerability_summary' | 'high_risk_findings' | 'recommendations';
  content: string;
  data?: Record<string, unknown>;
}

// ---- Logs ----
export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  stage: string;
  message: string;
}

// ---- Stats ----
export interface DashboardStats {
  totalTargets: number;
  subdomainsFound: number;
  vulnerabilities: number;
  activeScans: number;
}

// ---- Filters ----
export interface SubdomainFilters {
  search?: string;
  alive?: boolean;
  statusCode?: number;
}

export interface EndpointFilters {
  search?: string;
  category?: EndpointCategory;
  statusCode?: number;
  method?: string;
}

export interface VulnerabilityFilters {
  search?: string;
  severity?: VulnSeverity;
  status?: VulnStatus;
  type?: string;
}

// ---- App State ----
export type AppView = 'dashboard' | 'targets' | 'scans' | 'results' | 'vulnerabilities' | 'reports';

export interface ResultTab {
  key: string;
  label: string;
}
