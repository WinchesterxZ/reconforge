import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/seed — Seed the database with comprehensive demo data
export async function POST() {
  try {
    // Clean existing data
    await db.scanLog.deleteMany();
    await db.scanStage.deleteMany();
    await db.finding.deleteMany();
    await db.vulnerability.deleteMany();
    await db.endpoint.deleteMany();
    await db.subdomain.deleteMany();
    await db.scan.deleteMany();
    await db.project.deleteMany();

    // ─── Create Projects ─────────────────────────────────────────────────
    const project1 = await db.project.create({
      data: {
        name: 'Acme Corp Bug Bounty',
        domains: 'acme.com,acme-corp.com',
        headers: JSON.stringify({ 'X-Custom-Auth': 'bearer-token-123' }),
        description: 'Main bug bounty program for Acme Corporation web assets',
        status: 'active',
      },
    });

    const project2 = await db.project.create({
      data: {
        name: 'TechStart SaaS Platform',
        domains: 'techstart.io,app.techstart.io',
        headers: JSON.stringify({}),
        description: 'Security assessment of TechStart SaaS platform and APIs',
        status: 'active',
      },
    });

    const project3 = await db.project.create({
      data: {
        name: 'GlobalNet Infrastructure',
        domains: 'globalnet.org,portal.globalnet.org',
        headers: JSON.stringify({ 'Authorization': 'Basic dGVzdDp0ZXN0' }),
        description: 'Infrastructure security testing for GlobalNet organization',
        status: 'paused',
      },
    });

    // ─── Create Scans ────────────────────────────────────────────────────
    const completedScan1 = await db.scan.create({
      data: {
        projectId: project1.id,
        name: 'Full Recon - Q1 2025',
        status: 'completed',
        progress: 100,
        startedAt: new Date('2025-01-15T10:00:00Z'),
        completedAt: new Date('2025-01-15T10:45:00Z'),
      },
    });

    const completedScan2 = await db.scan.create({
      data: {
        projectId: project2.id,
        name: 'Full Recon - Initial',
        status: 'completed',
        progress: 100,
        startedAt: new Date('2025-02-01T08:00:00Z'),
        completedAt: new Date('2025-02-01T08:52:00Z'),
      },
    });

    const runningScan = await db.scan.create({
      data: {
        projectId: project1.id,
        name: 'Full Recon - Q2 2025',
        status: 'running',
        progress: 65,
        startedAt: new Date(),
      },
    });

    const pendingScan = await db.scan.create({
      data: {
        projectId: project3.id,
        name: 'Full Recon - Scheduled',
        status: 'pending',
        progress: 0,
      },
    });

    // ─── Create Scan Stages ──────────────────────────────────────────────
    const stageNames = [
      { stageName: 'passive_subdomain_enum', displayName: 'Passive Subdomain Enumeration' },
      { stageName: 'active_subdomain_enum', displayName: 'Active Subdomain Enumeration' },
      { stageName: 'subdomain_fuzzing', displayName: 'Subdomain Fuzzing' },
      { stageName: 'vhost_enum', displayName: 'Virtual Host Enumeration' },
      { stageName: 'infra_discovery', displayName: 'Infrastructure Discovery' },
      { stageName: 'cert_transparency', displayName: 'Certificate Transparency' },
      { stageName: 'merge_dedup', displayName: 'Merge & Deduplicate' },
      { stageName: 'alive_detection', displayName: 'Alive Host Detection' },
      { stageName: 'url_discovery', displayName: 'URL Discovery' },
      { stageName: 'param_extraction', displayName: 'Parameter Extraction' },
      { stageName: 'js_discovery', displayName: 'JavaScript Discovery' },
      { stageName: 'api_discovery', displayName: 'API Discovery' },
      { stageName: 'sensitive_file_discovery', displayName: 'Sensitive File Discovery' },
      { stageName: 'login_admin_detect', displayName: 'Login/Admin Panel Detection' },
      { stageName: 'idor_detect', displayName: 'IDOR Target Detection' },
      { stageName: 'js_secret_discovery', displayName: 'JavaScript Secret Discovery' },
      { stageName: 'hidden_params', displayName: 'Hidden Parameters' },
      { stageName: 'port_scanning', displayName: 'Port Scanning' },
      { stageName: 'directory_fuzzing', displayName: 'Directory Fuzzing' },
      { stageName: 'api_fuzzing', displayName: 'API Endpoint Fuzzing' },
      { stageName: 'vuln_scanning', displayName: 'Vulnerability Scanning' },
      { stageName: 'bypass_403', displayName: '403 Bypass Detection' },
      { stageName: 'report_generation', displayName: 'Report Generation' },
    ];

    // Stages for completed scan 1
    for (let i = 0; i < stageNames.length; i++) {
      const resultsCounts = [15, 8, 5, 2, 3, 12, 25, 20, 45, 18, 12, 8, 6, 4, 3, 2, 5, 20, 30, 10, 7, 1, 1];
      await db.scanStage.create({
        data: {
          scanId: completedScan1.id,
          stageName: stageNames[i].stageName,
          displayName: stageNames[i].displayName,
          status: 'completed',
          progress: 100,
          resultsCount: resultsCounts[i],
          startedAt: new Date(`2025-01-15T10:${String(i * 2).padStart(2, '0')}:00Z`),
          completedAt: new Date(`2025-01-15T10:${String(i * 2 + 1).padStart(2, '0')}:00Z`),
          order: i,
        },
      });
    }

    // Stages for completed scan 2
    for (let i = 0; i < stageNames.length; i++) {
      const resultsCounts = [20, 12, 6, 3, 2, 15, 30, 25, 60, 22, 15, 10, 8, 5, 4, 3, 7, 25, 35, 12, 9, 2, 1];
      await db.scanStage.create({
        data: {
          scanId: completedScan2.id,
          stageName: stageNames[i].stageName,
          displayName: stageNames[i].displayName,
          status: 'completed',
          progress: 100,
          resultsCount: resultsCounts[i],
          startedAt: new Date(`2025-02-01T08:${String(i * 2).padStart(2, '0')}:00Z`),
          completedAt: new Date(`2025-02-01T08:${String(i * 2 + 1).padStart(2, '0')}:00Z`),
          order: i,
        },
      });
    }

    // Stages for running scan (some completed, some running, rest pending)
    for (let i = 0; i < stageNames.length; i++) {
      let status = 'pending';
      let progress = 0;
      let resultsCount = 0;
      let startedAt = null as Date | null;
      let completedAt = null as Date | null;

      if (i < 14) {
        status = 'completed';
        progress = 100;
        resultsCount = Math.floor(Math.random() * 20) + 3;
        startedAt = new Date();
        completedAt = new Date();
      } else if (i === 14) {
        status = 'running';
        progress = 55;
        resultsCount = 2;
        startedAt = new Date();
      }

      await db.scanStage.create({
        data: {
          scanId: runningScan.id,
          stageName: stageNames[i].stageName,
          displayName: stageNames[i].displayName,
          status,
          progress,
          resultsCount,
          startedAt,
          completedAt,
          order: i,
        },
      });
    }

    // ─── Create Subdomains ───────────────────────────────────────────────
    const subdomainData = [
      { domain: 'api.acme.com', ip: '104.21.35.120', statusCode: 200, alive: true, webServer: 'nginx', title: 'API Gateway - Acme', contentLength: 12450, techStack: '["Express","Node.js"]', source: 'subfinder', projectId: project1.id },
      { domain: 'admin.acme.com', ip: '104.21.35.121', statusCode: 200, alive: true, webServer: 'Apache/2.4.52', title: 'Admin Panel - Acme', contentLength: 28900, techStack: '["React","Next.js"]', source: 'amass', projectId: project1.id },
      { domain: 'staging.acme.com', ip: '172.67.180.45', statusCode: 200, alive: true, webServer: 'cloudflare', title: 'Staging Environment', contentLength: 34200, techStack: '["Vue.js","Nuxt"]', source: 'crt.sh', projectId: project1.id },
      { domain: 'dev.acme.com', ip: '172.67.180.46', statusCode: 403, alive: true, webServer: 'nginx', title: '403 Forbidden', contentLength: 548, techStack: '["Nginx"]', source: 'assetfinder', projectId: project1.id },
      { domain: 'cdn.acme.com', ip: '104.21.35.122', statusCode: 200, alive: true, webServer: 'cloudflare', title: 'CDN', contentLength: 0, techStack: '["Cloudflare"]', source: 'dnsx', projectId: project1.id },
      { domain: 'mail.acme.com', ip: '198.51.100.10', statusCode: 0, alive: false, webServer: '', title: '', contentLength: 0, techStack: '[]', source: 'subfinder', projectId: project1.id },
      { domain: 'docs.acme.com', ip: '104.21.35.123', statusCode: 200, alive: true, webServer: 'Express', title: 'API Documentation', contentLength: 45600, techStack: '["React","Docusaurus"]', source: 'chaos', projectId: project1.id },
      { domain: 'auth.acme.com', ip: '104.21.35.124', statusCode: 200, alive: true, webServer: 'nginx', title: 'Authentication Service', contentLength: 8200, techStack: '["Go","Gin"]', source: 'puredns', projectId: project1.id },
      { domain: 'grafana.acme.com', ip: '10.0.1.50', statusCode: 200, alive: true, webServer: 'nginx', title: 'Grafana', contentLength: 22100, techStack: '["Grafana","Go"]', source: 'ffuf', projectId: project1.id },
      { domain: 'jenkins.acme.com', ip: '10.0.1.51', statusCode: 200, alive: true, webServer: 'Jetty', title: 'Jenkins', contentLength: 15300, techStack: '["Jenkins","Java"]', source: 'dnsx', projectId: project1.id },
      { domain: 'store.acme-corp.com', ip: '104.21.35.130', statusCode: 200, alive: true, webServer: 'nginx', title: 'Online Store', contentLength: 67800, techStack: '["Next.js","Stripe"]', source: 'subfinder', projectId: project1.id },
      { domain: 'pay.acme-corp.com', ip: '104.21.35.131', statusCode: 200, alive: true, webServer: 'nginx', title: 'Payment Gateway', contentLength: 9400, techStack: '["Express","Stripe"]', source: 'amass', projectId: project1.id },
      { domain: 'app.techstart.io', ip: '35.180.45.90', statusCode: 200, alive: true, webServer: 'nginx', title: 'TechStart Dashboard', contentLength: 89500, techStack: '["React","Next.js","AWS"]', source: 'subfinder', projectId: project2.id },
      { domain: 'api.techstart.io', ip: '35.180.45.91', statusCode: 200, alive: true, webServer: 'Express', title: 'TechStart API', contentLength: 3400, techStack: '["Express","Node.js","MongoDB"]', source: 'crt.sh', projectId: project2.id },
      { domain: 'admin.techstart.io', ip: '35.180.45.92', statusCode: 302, alive: true, webServer: 'Express', title: 'Redirect', contentLength: 0, techStack: '["Express"]', source: 'amass', projectId: project2.id },
      { domain: 'staging.techstart.io', ip: '35.180.45.93', statusCode: 200, alive: true, webServer: 'nginx', title: 'Staging - TechStart', contentLength: 89200, techStack: '["React","Vite"]', source: 'assetfinder', projectId: project2.id },
      { domain: 'beta.techstart.io', ip: '35.180.45.94', statusCode: 200, alive: true, webServer: 'cloudflare', title: 'Beta Program', contentLength: 56700, techStack: '["Vue.js","Firebase"]', source: 'chaos', projectId: project2.id },
      { domain: 'graphql.techstart.io', ip: '35.180.45.95', statusCode: 200, alive: true, webServer: 'Express', title: 'GraphQL Playground', contentLength: 7800, techStack: '["Apollo","GraphQL"]', source: 'dnsx', projectId: project2.id },
      { domain: 'portal.globalnet.org', ip: '203.0.113.10', statusCode: 200, alive: true, webServer: 'Microsoft-IIS/10.0', title: 'GlobalNet Portal', contentLength: 45600, techStack: '["Angular","ASP.NET"]', source: 'subfinder', projectId: project3.id },
      { domain: 'vpn.globalnet.org', ip: '203.0.113.11', statusCode: 403, alive: true, webServer: 'nginx', title: 'VPN Portal', contentLength: 548, techStack: '["OpenVPN"]', source: 'amass', projectId: project3.id },
      { domain: 'wiki.globalnet.org', ip: '203.0.113.12', statusCode: 200, alive: true, webServer: 'Apache/2.4.52', title: 'Internal Wiki', contentLength: 124500, techStack: '["Confluence","Java"]', source: 'crt.sh', projectId: project3.id },
    ];

    for (const sub of subdomainData) {
      await db.subdomain.create({ data: sub });
    }

    // ─── Create Endpoints ────────────────────────────────────────────────
    const endpointData = [
      // Project 1 - Acme
      { url: 'https://api.acme.com/v1/users', method: 'GET', statusCode: 200, contentType: 'application/json', contentLength: 2340, category: 'api', parameters: '["page","limit","sort"]', responseTime: 145, projectId: project1.id },
      { url: 'https://api.acme.com/v1/auth/login', method: 'POST', statusCode: 200, contentType: 'application/json', contentLength: 890, category: 'api', parameters: '["email","password"]', responseTime: 230, projectId: project1.id },
      { url: 'https://api.acme.com/v1/admin/users', method: 'GET', statusCode: 403, contentType: 'application/json', contentLength: 120, category: 'admin', parameters: '[]', responseTime: 45, projectId: project1.id },
      { url: 'https://admin.acme.com/dashboard', method: 'GET', statusCode: 200, contentType: 'text/html', contentLength: 28900, category: 'admin', parameters: '[]', responseTime: 340, projectId: project1.id },
      { url: 'https://staging.acme.com/.env', method: 'GET', statusCode: 200, contentType: 'text/plain', contentLength: 2400, category: 'sensitive', parameters: '[]', responseTime: 22, projectId: project1.id },
      { url: 'https://staging.acme.com/.git/config', method: 'GET', statusCode: 200, contentType: 'text/plain', contentLength: 320, category: 'sensitive', parameters: '[]', responseTime: 18, projectId: project1.id },
      { url: 'https://acme.com/static/js/app.js', method: 'GET', statusCode: 200, contentType: 'application/javascript', contentLength: 245000, category: 'js', parameters: '[]', responseTime: 89, projectId: project1.id },
      { url: 'https://acme.com/static/js/config.js', method: 'GET', statusCode: 200, contentType: 'application/javascript', contentLength: 3200, category: 'js', parameters: '[]', responseTime: 12, projectId: project1.id },
      { url: 'https://acme.com/login', method: 'GET', statusCode: 200, contentType: 'text/html', contentLength: 15600, category: 'login', parameters: '[]', responseTime: 180, projectId: project1.id },
      { url: 'https://acme.com/api/v1/search', method: 'GET', statusCode: 200, contentType: 'application/json', contentLength: 4500, category: 'api', parameters: '["q","type","page"]', responseTime: 320, projectId: project1.id },
      { url: 'https://acme.com/robots.txt', method: 'GET', statusCode: 200, contentType: 'text/plain', contentLength: 450, category: 'sensitive', parameters: '[]', responseTime: 8, projectId: project1.id },
      { url: 'https://docs.acme.com/api-docs', method: 'GET', statusCode: 200, contentType: 'text/html', contentLength: 45600, category: 'api', parameters: '[]', responseTime: 210, projectId: project1.id },
      { url: 'https://grafana.acme.com/api/admin/settings', method: 'GET', statusCode: 200, contentType: 'application/json', contentLength: 1800, category: 'admin', parameters: '[]', responseTime: 56, projectId: project1.id },
      { url: 'https://api.acme.com/v1/upload', method: 'POST', statusCode: 200, contentType: 'application/json', contentLength: 450, category: 'upload', parameters: '["file","type"]', responseTime: 560, projectId: project1.id },
      { url: 'https://acme.com/.well-known/security.txt', method: 'GET', statusCode: 200, contentType: 'text/plain', contentLength: 890, category: 'sensitive', parameters: '[]', responseTime: 15, projectId: project1.id },
      { url: 'https://pay.acme-corp.com/checkout', method: 'GET', statusCode: 200, contentType: 'text/html', contentLength: 32100, category: 'api', parameters: '["session_id","amount"]', responseTime: 280, projectId: project1.id },
      { url: 'https://api.acme.com/v1/users/{id}/profile', method: 'GET', statusCode: 200, contentType: 'application/json', contentLength: 1200, category: 'idor', parameters: '["id"]', responseTime: 95, projectId: project1.id },
      { url: 'https://acme.com/api/graphql', method: 'POST', statusCode: 200, contentType: 'application/json', contentLength: 5600, category: 'api', parameters: '["query","variables"]', responseTime: 180, projectId: project1.id },
      // Project 2 - TechStart
      { url: 'https://app.techstart.io/api/v2/users', method: 'GET', statusCode: 200, contentType: 'application/json', contentLength: 5600, category: 'api', parameters: '["page","per_page"]', responseTime: 120, projectId: project2.id },
      { url: 'https://app.techstart.io/api/v2/auth/token', method: 'POST', statusCode: 200, contentType: 'application/json', contentLength: 780, category: 'api', parameters: '["client_id","client_secret"]', responseTime: 190, projectId: project2.id },
      { url: 'https://api.techstart.io/docs', method: 'GET', statusCode: 200, contentType: 'text/html', contentLength: 67800, category: 'api', parameters: '[]', responseTime: 250, projectId: project2.id },
      { url: 'https://app.techstart.io/static/js/main.js', method: 'GET', statusCode: 200, contentType: 'application/javascript', contentLength: 456000, category: 'js', parameters: '[]', responseTime: 340, projectId: project2.id },
      { url: 'https://app.techstart.io/admin', method: 'GET', statusCode: 302, contentType: 'text/html', contentLength: 0, category: 'admin', parameters: '[]', responseTime: 15, projectId: project2.id },
      { url: 'https://graphql.techstart.io/graphql', method: 'POST', statusCode: 200, contentType: 'application/json', contentLength: 3400, category: 'api', parameters: '["query","operationName"]', responseTime: 210, projectId: project2.id },
      { url: 'https://app.techstart.io/login', method: 'GET', statusCode: 200, contentType: 'text/html', contentLength: 12300, category: 'login', parameters: '[]', responseTime: 150, projectId: project2.id },
      { url: 'https://app.techstart.io/.env.bak', method: 'GET', statusCode: 200, contentType: 'text/plain', contentLength: 3100, category: 'sensitive', parameters: '[]', responseTime: 20, projectId: project2.id },
      { url: 'https://beta.techstart.io/api/v1/config', method: 'GET', statusCode: 200, contentType: 'application/json', contentLength: 890, category: 'api', parameters: '[]', responseTime: 65, projectId: project2.id },
      { url: 'https://app.techstart.io/swagger-ui/', method: 'GET', statusCode: 200, contentType: 'text/html', contentLength: 23400, category: 'interesting', parameters: '[]', responseTime: 180, projectId: project2.id },
      { url: 'https://api.techstart.io/v1/webhooks', method: 'POST', statusCode: 200, contentType: 'application/json', contentLength: 230, category: 'api', parameters: '["url","events"]', responseTime: 110, projectId: project2.id },
      // Project 3 - GlobalNet
      { url: 'https://portal.globalnet.org/Home/Dashboard', method: 'GET', statusCode: 200, contentType: 'text/html', contentLength: 56700, category: 'general', parameters: '[]', responseTime: 450, projectId: project3.id },
      { url: 'https://portal.globalnet.org/Admin/Users', method: 'GET', statusCode: 403, contentType: 'text/html', contentLength: 3400, category: 'admin', parameters: '[]', responseTime: 35, projectId: project3.id },
      { url: 'https://wiki.globalnet.org/rest/api/content', method: 'GET', statusCode: 200, contentType: 'application/json', contentLength: 8900, category: 'api', parameters: '["space","title"]', responseTime: 230, projectId: project3.id },
      { url: 'https://portal.globalnet.org/Account/Login', method: 'GET', statusCode: 200, contentType: 'text/html', contentLength: 18900, category: 'login', parameters: '[]', responseTime: 320, projectId: project3.id },
    ];

    for (const ep of endpointData) {
      await db.endpoint.create({ data: ep });
    }

    // ─── Create Vulnerabilities ──────────────────────────────────────────
    const vulnerabilityData = [
      // Project 1
      { title: 'Exposed .env File on Staging', severity: 'critical', description: 'A .env file containing database credentials, API keys, and application secrets is publicly accessible on the staging environment.', url: 'https://staging.acme.com/.env', template: 'exposure/env-file', type: 'exposure', data: JSON.stringify({ statusCode: 200, size: '2.4KB', contains: ['DB_PASSWORD', 'AWS_SECRET_KEY', 'JWT_SECRET'] }), status: 'open', projectId: project1.id },
      { title: 'Exposed Git Repository', severity: 'critical', description: 'The .git directory is publicly accessible, potentially exposing the entire source code repository including commit history and credentials.', url: 'https://staging.acme.com/.git/config', template: 'exposure/git-directory', type: 'exposure', data: JSON.stringify({ statusCode: 200, repository: true }), status: 'confirmed', projectId: project1.id },
      { title: 'CORS Misconfiguration on API', severity: 'high', description: 'The API returns a wildcard Access-Control-Allow-Origin header, allowing any origin to make cross-origin requests and potentially steal user data.', url: 'https://api.acme.com/v1/users', template: 'misconfig/cors-wildcard', type: 'misconfig', data: JSON.stringify({ header: 'Access-Control-Allow-Origin: *', allowsCredentials: true }), status: 'open', projectId: project1.id },
      { title: 'SQL Injection in Search API', severity: 'critical', description: 'The search endpoint is vulnerable to error-based SQL injection through the q parameter, allowing database enumeration.', url: 'https://acme.com/api/v1/search?q=', template: 'vuln/sql-injection', type: 'injection', data: JSON.stringify({ parameter: 'q', payload: "' OR 1=1--", dbms: 'PostgreSQL' }), status: 'open', projectId: project1.id },
      { title: 'Grafana Default Credentials', severity: 'high', description: 'The Grafana instance is using default credentials (admin:admin), allowing unauthorized access to dashboards and metrics.', url: 'https://grafana.acme.com/', template: 'auth/default-credentials', type: 'auth', data: JSON.stringify({ username: 'admin', password: 'admin', version: '9.2.0' }), status: 'confirmed', projectId: project1.id },
      { title: 'Open Redirect in Auth Flow', severity: 'medium', description: 'The authentication callback accepts arbitrary redirect URLs, allowing phishing attacks through crafted URLs.', url: 'https://acme.com/auth/callback?redirect=https://evil.com', template: 'vuln/open-redirect', type: 'injection', data: JSON.stringify({ parameter: 'redirect', payload: 'https://evil.com' }), status: 'open', projectId: project1.id },
      { title: 'Missing Security Headers', severity: 'low', description: 'The main application is missing X-Frame-Options, X-Content-Type-Options, and Content-Security-Policy headers.', url: 'https://acme.com/', template: 'misconfig/missing-security-headers', type: 'misconfig', data: JSON.stringify({ missing: ['X-Frame-Options', 'X-Content-Type-Options', 'Content-Security-Policy'] }), status: 'open', projectId: project1.id },
      { title: 'JWT Secret Weakness', severity: 'high', description: 'JWT tokens appear to be signed with a weak secret key that can be cracked offline, allowing token forgery.', url: 'https://api.acme.com/v1/auth/login', template: 'auth/jwt-weak-secret', type: 'auth', data: JSON.stringify({ algorithm: 'HS256', crackable: true }), status: 'open', projectId: project1.id },
      { title: 'Rate Limiting Absent on Auth', severity: 'medium', description: 'No rate limiting on the login endpoint allows brute force attacks against user accounts.', url: 'https://api.acme.com/v1/auth/login', template: 'misconfig/no-rate-limit', type: 'misconfig', data: JSON.stringify({ requestsPerSecond: 100 }), status: 'open', projectId: project1.id },
      { title: 'IDOR in User Profile API', severity: 'high', description: 'The user profile endpoint allows accessing other users\' profiles by changing the user ID parameter without authorization checks.', url: 'https://api.acme.com/v1/users/2/profile', template: 'vuln/idor', type: 'auth', data: JSON.stringify({ parameter: 'id', sequential: true }), status: 'confirmed', projectId: project1.id },
      // Project 2
      { title: 'Exposed .env.bak File', severity: 'critical', description: 'A backup .env file is publicly accessible, containing database connection strings and API keys.', url: 'https://app.techstart.io/.env.bak', template: 'exposure/env-file', type: 'exposure', data: JSON.stringify({ statusCode: 200, size: '3.1KB' }), status: 'confirmed', projectId: project2.id },
      { title: 'GraphQL Introspection Enabled', severity: 'medium', description: 'GraphQL introspection is enabled on the production API, exposing the complete schema including admin-only types and mutations.', url: 'https://graphql.techstart.io/graphql', template: 'misconfig/graphql-introspection', type: 'misconfig', data: JSON.stringify({ schemaTypes: 42, mutations: 15 }), status: 'open', projectId: project2.id },
      { title: 'Client Secret in OAuth Flow', severity: 'high', description: 'The OAuth client_secret is exposed in the token endpoint response, potentially allowing unauthorized token generation.', url: 'https://app.techstart.io/api/v2/auth/token', template: 'auth/oauth-secret-exposure', type: 'auth', data: JSON.stringify({ client_secret_exposed: true }), status: 'open', projectId: project2.id },
      { title: 'Swagger UI on Production', severity: 'low', description: 'Swagger UI is accessible on the production environment, exposing API documentation and allowing interactive testing.', url: 'https://app.techstart.io/swagger-ui/', template: 'exposure/swagger-ui', type: 'exposure', data: JSON.stringify({ version: '4.15.0', apiCount: 45 }), status: 'false_positive', projectId: project2.id },
      { title: 'SSRF in Webhook Endpoint', severity: 'high', description: 'The webhook endpoint allows specifying arbitrary URLs, enabling SSRF attacks to access internal services and cloud metadata.', url: 'https://api.techstart.io/v1/webhooks', template: 'vuln/ssrf', type: 'injection', data: JSON.stringify({ parameter: 'url', internalAccess: true }), status: 'open', projectId: project2.id },
      // Project 3
      { title: 'IIS Detailed Error Pages', severity: 'low', description: 'IIS detailed error pages are enabled, revealing internal paths and .NET version information.', url: 'https://portal.globalnet.org/NonExistentPage', template: 'exposure/iis-errors', type: 'exposure', data: JSON.stringify({ statusCode: 404, framework: 'ASP.NET 4.8' }), status: 'open', projectId: project3.id },
      { title: 'Confluence API Exposed', severity: 'medium', description: 'The Confluence REST API is accessible without authentication, potentially exposing internal documentation and spaces.', url: 'https://wiki.globalnet.org/rest/api/content', template: 'auth/confluence-api', type: 'auth', data: JSON.stringify({ publicSpaces: 5 }), status: 'open', projectId: project3.id },
    ];

    for (const vuln of vulnerabilityData) {
      await db.vulnerability.create({ data: vuln });
    }

    // ─── Create Findings ─────────────────────────────────────────────────
    const findingData = [
      // For completed scan 1
      { scanId: completedScan1.id, category: 'subdomain', severity: 'info', url: 'https://staging.acme.com', title: 'Staging Environment Detected', data: JSON.stringify({ source: 'crt.sh', alive: true }), verified: true },
      { scanId: completedScan1.id, category: 'subdomain', severity: 'info', url: 'https://dev.acme.com', title: 'Development Subdomain Found', data: JSON.stringify({ source: 'subfinder', alive: true }), verified: true },
      { scanId: completedScan1.id, category: 'js_file', severity: 'low', url: 'https://acme.com/static/js/config.js', title: 'Configuration File in JavaScript', data: JSON.stringify({ size: '3.2KB', contains: 'API_URL' }), verified: true },
      { scanId: completedScan1.id, category: 'sensitive_file', severity: 'high', url: 'https://staging.acme.com/.env', title: 'Environment File Accessible', data: JSON.stringify({ size: '2.4KB', contains: 'DB_PASSWORD' }), verified: true },
      { scanId: completedScan1.id, category: 'admin', severity: 'medium', url: 'https://grafana.acme.com/', title: 'Grafana Dashboard Exposed', data: JSON.stringify({ version: '9.2.0', defaultCreds: true }), verified: true },
      { scanId: completedScan1.id, category: 'api', severity: 'info', url: 'https://acme.com/api/graphql', title: 'GraphQL Endpoint Discovered', data: JSON.stringify({ introspection: true }), verified: true },
      { scanId: completedScan1.id, category: 'secret', severity: 'critical', url: 'https://acme.com/static/js/app.js', title: 'AWS Access Key in JavaScript', data: JSON.stringify({ provider: 'AWS', keyPrefix: 'AKIA' }), verified: false },
      { scanId: completedScan1.id, category: 'idor', severity: 'high', url: 'https://api.acme.com/v1/users/1/profile', title: 'Potential IDOR in User API', data: JSON.stringify({ parameter: 'id', sequential: true }), verified: true },
      // For completed scan 2
      { scanId: completedScan2.id, category: 'subdomain', severity: 'info', url: 'https://staging.techstart.io', title: 'Staging Subdomain Found', data: JSON.stringify({ source: 'assetfinder' }), verified: true },
      { scanId: completedScan2.id, category: 'subdomain', severity: 'info', url: 'https://beta.techstart.io', title: 'Beta Environment Detected', data: JSON.stringify({ source: 'chaos' }), verified: true },
      { scanId: completedScan2.id, category: 'sensitive_file', severity: 'critical', url: 'https://app.techstart.io/.env.bak', title: 'Backup Env File Exposed', data: JSON.stringify({ size: '3.1KB' }), verified: true },
      { scanId: completedScan2.id, category: 'api', severity: 'medium', url: 'https://graphql.techstart.io/graphql', title: 'GraphQL with Introspection', data: JSON.stringify({ schemaTypes: 42 }), verified: true },
      { scanId: completedScan2.id, category: 'js_file', severity: 'medium', url: 'https://app.techstart.io/static/js/main.js', title: 'OAuth Secret in JS Bundle', data: JSON.stringify({ keyType: 'client_secret' }), verified: true },
      { scanId: completedScan2.id, category: 'admin', severity: 'info', url: 'https://app.techstart.io/admin', title: 'Admin Panel Detected', data: JSON.stringify({ authRequired: true }), verified: true },
      { scanId: completedScan2.id, category: 'cloud_leak', severity: 'critical', url: 'https://s3.amazonaws.com/techstart-assets/', title: 'Public S3 Bucket', data: JSON.stringify({ provider: 'AWS', service: 'S3' }), verified: false },
      { scanId: completedScan2.id, category: 'secret', severity: 'high', url: 'https://app.techstart.io/static/js/main.js', title: 'Stripe Secret Key in JS', data: JSON.stringify({ keyType: 'sk_live' }), verified: true },
      // For running scan
      { scanId: runningScan.id, category: 'subdomain', severity: 'info', url: 'https://api.acme.com', title: 'API Subdomain Resolved', data: JSON.stringify({ source: 'subfinder' }), verified: true },
      { scanId: runningScan.id, category: 'subdomain', severity: 'info', url: 'https://auth.acme.com', title: 'Auth Service Discovered', data: JSON.stringify({ source: 'amass' }), verified: true },
      { scanId: runningScan.id, category: 'api', severity: 'info', url: 'https://api.acme.com/v1/auth/token', title: 'OAuth Token Endpoint', data: JSON.stringify({ grantTypes: ['authorization_code', 'refresh_token'] }), verified: true },
    ];

    for (const finding of findingData) {
      await db.finding.create({ data: finding });
    }

    // ─── Create Scan Logs ────────────────────────────────────────────────
    const logData = [
      { scanId: completedScan1.id, level: 'info', message: 'Scan started for domain(s): acme.com, acme-corp.com' },
      { scanId: completedScan1.id, level: 'info', message: '[Passive Subdomain Enumeration] Starting with tools: subfinder, assetfinder, amass, findomain, chaos, crt.sh' },
      { scanId: completedScan1.id, level: 'info', message: 'Running subfinder against acme.com...' },
      { scanId: completedScan1.id, level: 'success', message: '[Passive Subdomain Enumeration] Found 15 subdomains' },
      { scanId: completedScan1.id, level: 'success', message: '[Active Subdomain Enumeration] Found 8 subdomains' },
      { scanId: completedScan1.id, level: 'success', message: '[Alive Host Detection] 20 hosts are alive' },
      { scanId: completedScan1.id, level: 'warn', message: '[JavaScript Secret Discovery] Found 2 potential secrets in JavaScript!' },
      { scanId: completedScan1.id, level: 'warn', message: '[Vulnerability Scanning] Found 7 vulnerabilities!' },
      { scanId: completedScan1.id, level: 'success', message: '[Report Generation] Report generated successfully' },
      { scanId: completedScan1.id, level: 'success', message: 'Scan completed successfully! 🎉' },
      { scanId: completedScan2.id, level: 'info', message: 'Scan started for domain(s): techstart.io, app.techstart.io' },
      { scanId: completedScan2.id, level: 'success', message: '[Passive Subdomain Enumeration] Found 20 subdomains' },
      { scanId: completedScan2.id, level: 'warn', message: '[Sensitive File Discovery] Found 3 sensitive files!' },
      { scanId: completedScan2.id, level: 'warn', message: '[Vulnerability Scanning] Found 9 vulnerabilities!' },
      { scanId: completedScan2.id, level: 'success', message: 'Scan completed successfully! 🎉' },
      { scanId: runningScan.id, level: 'info', message: 'Scan started for domain(s): acme.com, acme-corp.com' },
      { scanId: runningScan.id, level: 'success', message: '[Passive Subdomain Enumeration] Found 12 subdomains' },
      { scanId: runningScan.id, level: 'success', message: '[Alive Host Detection] 18 hosts are alive' },
      { scanId: runningScan.id, level: 'info', message: '[IDOR Target Detection] Running nuclei templates...' },
    ];

    for (const log of logData) {
      await db.scanLog.create({
        data: {
          ...log,
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)),
        },
      });
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      stats: {
        projects: 3,
        scans: 4,
        subdomains: subdomainData.length,
        endpoints: endpointData.length,
        vulnerabilities: vulnerabilityData.length,
        findings: findingData.length,
        scanStages: stageNames.length * 3,
        logs: logData.length,
      },
    });
  } catch (error) {
    console.error('Failed to seed database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
