import type {
  Project,
  CreateProjectInput,
  Scan,
  StartScanInput,
  Subdomain,
  SubdomainFilters,
  Endpoint,
  EndpointFilters,
  Vulnerability,
  VulnerabilityFilters,
  Finding,
  DashboardStats,
  Report,
  LogEntry,
} from './types';

const API_BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ---- Projects / Targets ----
export async function fetchProjects(): Promise<Project[]> {
  return fetchJSON<Project[]>('/projects');
}

export async function createProject(data: CreateProjectInput): Promise<Project> {
  return fetchJSON<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await fetchJSON(`/projects/${id}`, { method: 'DELETE' });
}

// ---- Scans ----
export async function fetchScans(projectId?: string): Promise<Scan[]> {
  const params = projectId ? `?projectId=${projectId}` : '';
  return fetchJSON<Scan[]>(`/scans${params}`);
}

export async function startScan(data: StartScanInput): Promise<Scan> {
  return fetchJSON<Scan>('/scans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchScanDetails(id: string): Promise<Scan> {
  return fetchJSON<Scan>(`/scans/${id}`);
}

// ---- Subdomains ----
export async function fetchSubdomains(
  projectId: string,
  filters?: SubdomainFilters
): Promise<Subdomain[]> {
  const params = new URLSearchParams({ projectId });
  if (filters?.search) params.set('search', filters.search);
  if (filters?.alive !== undefined) params.set('alive', String(filters.alive));
  if (filters?.statusCode) params.set('statusCode', String(filters.statusCode));
  return fetchJSON<Subdomain[]>(`/subdomains?${params}`);
}

// ---- Endpoints ----
export async function fetchEndpoints(
  projectId: string,
  filters?: EndpointFilters
): Promise<Endpoint[]> {
  const params = new URLSearchParams({ projectId });
  if (filters?.search) params.set('search', filters.search);
  if (filters?.category) params.set('category', filters.category);
  if (filters?.statusCode) params.set('statusCode', String(filters.statusCode));
  if (filters?.method) params.set('method', filters.method);
  return fetchJSON<Endpoint[]>(`/endpoints?${params}`);
}

// ---- Vulnerabilities ----
export async function fetchVulnerabilities(
  projectId: string,
  filters?: VulnerabilityFilters
): Promise<Vulnerability[]> {
  const params = new URLSearchParams({ projectId });
  if (filters?.search) params.set('search', filters.search);
  if (filters?.severity) params.set('severity', filters.severity);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.type) params.set('type', filters.type);
  return fetchJSON<Vulnerability[]>(`/vulnerabilities?${params}`);
}

// ---- Findings ----
export async function fetchFindings(projectId: string): Promise<Finding[]> {
  return fetchJSON<Finding[]>(`/findings?projectId=${projectId}`);
}

// ---- Reports ----
export async function fetchReports(projectId: string): Promise<Report> {
  return fetchJSON<Report>(`/reports?projectId=${projectId}`);
}

// ---- Dashboard Stats ----
export async function fetchDashboardStats(): Promise<DashboardStats> {
  return fetchJSON<DashboardStats>('/stats');
}

// ---- Logs ----
export async function fetchScanLogs(scanId: string): Promise<LogEntry[]> {
  return fetchJSON<LogEntry[]>(`/scans/${scanId}/logs`);
}

// ---- Seed Database ----
export async function seedDatabase(): Promise<void> {
  await fetchJSON('/seed', { method: 'POST' });
}

// ============================================================
// Mock Data Generators - used when API is not available
// ============================================================

export function getMockProjects(): Project[] {
  return [
    {
      id: 'proj-1',
      name: 'Acme Corp',
      domains: ['acme.com', 'api.acme.com', 'admin.acme.com'],
      description: 'Main bug bounty target - Acme Corporation web infrastructure',
      customHeaders: {},
      status: 'active',
      subdomainCount: 247,
      endpointCount: 1893,
      vulnerabilityCount: 12,
      lastScanDate: '2024-01-15T10:30:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
    },
    {
      id: 'proj-2',
      name: 'FinTech Global',
      domains: ['fintech.io', 'app.fintech.io', 'dashboard.fintech.io'],
      description: 'Financial technology platform with payment processing',
      customHeaders: { 'X-Auth-Token': '***' },
      status: 'active',
      subdomainCount: 89,
      endpointCount: 567,
      vulnerabilityCount: 5,
      lastScanDate: '2024-01-14T08:00:00Z',
      createdAt: '2024-01-05T00:00:00Z',
      updatedAt: '2024-01-14T08:00:00Z',
    },
    {
      id: 'proj-3',
      name: 'CloudSync',
      domains: ['cloudsync.dev', 'api.cloudsync.dev'],
      description: 'Cloud storage and file synchronization service',
      customHeaders: {},
      status: 'paused',
      subdomainCount: 156,
      endpointCount: 924,
      vulnerabilityCount: 8,
      lastScanDate: '2024-01-10T14:20:00Z',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-10T14:20:00Z',
    },
  ];
}

export function getMockScans(): Scan[] {
  const stageNames = [
    { name: 'subdomain_enum', displayName: 'Subdomain Enumeration' },
    { name: 'dns_resolution', displayName: 'DNS Resolution' },
    { name: 'http_probing', displayName: 'HTTP Probing' },
    { name: 'web_screenshot', displayName: 'Web Screenshot' },
    { name: 'port_scan', displayName: 'Port Scanning' },
    { name: 'service_detect', displayName: 'Service Detection' },
    { name: 'waf_detect', displayName: 'WAF Detection' },
    { name: 'tech_detect', displayName: 'Technology Detection' },
    { name: 'crawler', displayName: 'Web Crawling' },
    { name: 'link_finding', displayName: 'Link Finding' },
    { name: 'js_analysis', displayName: 'JS Analysis' },
    { name: 'api_discovery', displayName: 'API Discovery' },
    { name: 'dir_fuzz', displayName: 'Directory Fuzzing' },
    { name: 'param_mining', displayName: 'Parameter Mining' },
    { name: 'fuzz_params', displayName: 'Parameter Fuzzing' },
    { name: 'sensitive_check', displayName: 'Sensitive Data Check' },
    { name: 'login_detect', displayName: 'Login Detection' },
    { name: 'idor_check', displayName: 'IDOR Check' },
    { name: 'xss_scan', displayName: 'XSS Scanning' },
    { name: 'sqli_scan', displayName: 'SQLi Scanning' },
    { name: 'ssrf_check', displayName: 'SSRF Check' },
    { name: 'vuln_scan', displayName: 'Vulnerability Scanning' },
    { name: 'report_gen', displayName: 'Report Generation' },
  ];

  function makeStages(completedUpTo: number, running: boolean): Scan['stages'] {
    return stageNames.map((s, i) => {
      let status: Scan['stages'][0]['status'] = 'pending';
      let progress = 0;
      if (i < completedUpTo) {
        status = 'completed';
        progress = 100;
      } else if (i === completedUpTo && running) {
        status = 'running';
        progress = Math.floor(Math.random() * 80) + 10;
      }
      return {
        id: `stage-${i}`,
        name: s.name,
        displayName: s.displayName,
        status,
        progress,
        startedAt: i <= completedUpTo ? '2024-01-15T10:00:00Z' : null,
        completedAt: i < completedUpTo ? '2024-01-15T10:05:00Z' : null,
        findingsCount: status === 'completed' ? Math.floor(Math.random() * 50) : 0,
        error: null,
      };
    });
  }

  return [
    {
      id: 'scan-1',
      projectId: 'proj-1',
      projectName: 'Acme Corp',
      status: 'running',
      progress: 52,
      currentStage: 'js_analysis',
      startedAt: '2024-01-15T10:00:00Z',
      completedAt: null,
      createdAt: '2024-01-15T10:00:00Z',
      stages: makeStages(10, true),
    },
    {
      id: 'scan-2',
      projectId: 'proj-2',
      projectName: 'FinTech Global',
      status: 'running',
      progress: 22,
      currentStage: 'http_probing',
      startedAt: '2024-01-15T09:30:00Z',
      completedAt: null,
      createdAt: '2024-01-15T09:30:00Z',
      stages: makeStages(2, true),
    },
    {
      id: 'scan-3',
      projectId: 'proj-1',
      projectName: 'Acme Corp',
      status: 'completed',
      progress: 100,
      currentStage: 'report_gen',
      startedAt: '2024-01-14T08:00:00Z',
      completedAt: '2024-01-14T12:00:00Z',
      createdAt: '2024-01-14T08:00:00Z',
      stages: makeStages(23, false),
    },
    {
      id: 'scan-4',
      projectId: 'proj-3',
      projectName: 'CloudSync',
      status: 'failed',
      progress: 35,
      currentStage: 'port_scan',
      startedAt: '2024-01-10T14:00:00Z',
      completedAt: null,
      createdAt: '2024-01-10T14:00:00Z',
      stages: makeStages(4, false).map((s, i) =>
        i === 4 ? { ...s, status: 'failed' as const, error: 'Connection timeout' } : s
      ),
    },
  ];
}

export function getMockSubdomains(): Subdomain[] {
  const subdomains = [
    'www.acme.com', 'api.acme.com', 'admin.acme.com', 'staging.acme.com',
    'dev.acme.com', 'mail.acme.com', 'ftp.acme.com', 'cdn.acme.com',
    'static.acme.com', 'app.acme.com', 'dashboard.acme.com', 'login.acme.com',
    'auth.acme.com', 'docs.acme.com', 'status.acme.com', 'blog.acme.com',
    'shop.acme.com', 'store.acme.com', 'payments.acme.com', 'checkout.acme.com',
  ];

  const webservers = ['nginx/1.24.0', 'Apache/2.4.57', 'cloudflare', 'Express', 'gunicorn', 'Caddy'];
  const techs = [
    ['React', 'Next.js', 'Tailwind'],
    ['Vue.js', 'Nuxt'],
    ['Express', 'MongoDB'],
    ['Django', 'PostgreSQL'],
    ['WordPress', 'PHP'],
    ['Angular', 'Node.js'],
  ];

  return subdomains.map((domain, i) => ({
    id: `sub-${i}`,
    projectId: 'proj-1',
    domain,
    ip: `192.168.${Math.floor(i / 10)}.${(i % 254) + 1}`,
    status: i % 7 === 0 ? null : (i % 3 === 0 ? 403 : 200),
    alive: i % 5 !== 0,
    webServer: i % 4 === 0 ? null : webservers[i % webservers.length],
    title: i % 3 === 0 ? null : `${domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)} - ${['Home', 'Dashboard', 'Login', 'API', 'Admin'][i % 5]}`,
    technologies: i % 3 === 0 ? [] : techs[i % techs.length],
    ports: [80, 443, ...(i % 4 === 0 ? [8080, 8443] : [])],
    statusCode: i % 7 === 0 ? null : (i % 3 === 0 ? 403 : 200),
    contentLength: i % 2 === 0 ? Math.floor(Math.random() * 50000) + 1000 : null,
    responseTime: Math.floor(Math.random() * 500) + 50,
    discoveredAt: '2024-01-15T10:30:00Z',
  }));
}

export function getMockEndpoints(): Endpoint[] {
  const categories: Endpoint['category'][] = ['api', 'js', 'sensitive', 'login', 'admin', 'idor', 'upload', 'parameter', 'other'];
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  const paths = [
    '/api/v1/users', '/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/admin/dashboard',
    '/api/v1/payments/process', '/api/v1/files/upload', '/static/app.js', '/static/vendor.js',
    '/api/v1/users/{id}/profile', '/admin/config', '/admin/users', '/.env', '/.git/config',
    '/api/v1/search', '/login', '/register', '/dashboard', '/api/v1/tokens',
    '/api/v1/orders', '/api/v1/products', '/graphql', '/api/v1/webhooks',
    '/wp-admin', '/phpmyadmin', '/api/v1/reports/export', '/api/v1/documents/{id}',
  ];

  return paths.map((path, i) => ({
    id: `ep-${i}`,
    projectId: 'proj-1',
    url: `https://api.acme.com${path}`,
    method: methods[i % methods.length],
    statusCode: i % 8 === 0 ? 404 : i % 5 === 0 ? 403 : (i % 3 === 0 ? 201 : 200),
    contentType: ['application/json', 'text/html', 'application/javascript', 'application/xml'][i % 4],
    contentLength: Math.floor(Math.random() * 10000) + 100,
    category: categories[i % categories.length],
    subdomain: 'api.acme.com',
    discoveredAt: '2024-01-15T10:30:00Z',
  }));
}

export function getMockVulnerabilities(): Vulnerability[] {
  return [
    {
      id: 'vuln-1',
      projectId: 'proj-1',
      title: 'SQL Injection in Login Form',
      severity: 'critical',
      url: 'https://login.acme.com/auth/login',
      type: 'SQLi',
      status: 'open',
      description: 'The login form parameter "username" is vulnerable to SQL injection. An attacker can bypass authentication using payload: \' OR 1=1 --',
      evidence: "Response contains SQL error: 'You have an error in your SQL syntax'",
      remediation: 'Use parameterized queries or prepared statements. Implement input validation and WAF rules.',
      cwe: 'CWE-89',
      cvss: 9.8,
      discoveredAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
    },
    {
      id: 'vuln-2',
      projectId: 'proj-1',
      title: 'Stored XSS in User Profile',
      severity: 'high',
      url: 'https://app.acme.com/profile/edit',
      type: 'XSS',
      status: 'confirmed',
      description: 'The "bio" field in user profile is not properly sanitized, allowing stored XSS attacks.',
      evidence: 'Payload <script>alert(1)</script> persisted and executed on profile view',
      remediation: 'Implement output encoding and Content Security Policy headers. Sanitize all user inputs.',
      cwe: 'CWE-79',
      cvss: 7.5,
      discoveredAt: '2024-01-14T12:00:00Z',
      updatedAt: '2024-01-14T15:00:00Z',
    },
    {
      id: 'vuln-3',
      projectId: 'proj-1',
      title: 'IDOR in User API Endpoint',
      severity: 'high',
      url: 'https://api.acme.com/api/v1/users/{id}/profile',
      type: 'IDOR',
      status: 'open',
      description: 'User profile endpoint allows accessing other users data by changing the ID parameter without authorization checks.',
      evidence: 'Accessed user ID 2 data while authenticated as user ID 1',
      remediation: 'Implement proper authorization checks. Validate that the requesting user has access to the requested resource.',
      cwe: 'CWE-639',
      cvss: 8.1,
      discoveredAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T09:00:00Z',
    },
    {
      id: 'vuln-4',
      projectId: 'proj-1',
      title: 'Sensitive Data Exposure in .env File',
      severity: 'critical',
      url: 'https://acme.com/.env',
      type: 'Info Disclosure',
      status: 'open',
      description: 'The .env file is publicly accessible, containing database credentials, API keys, and other sensitive configuration.',
      evidence: 'File contains DB_PASSWORD, AWS_SECRET_KEY, JWT_SECRET values',
      remediation: 'Restrict access to .env files via server configuration. Move secrets to environment variables or a secrets manager.',
      cwe: 'CWE-200',
      cvss: 9.1,
      discoveredAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'vuln-5',
      projectId: 'proj-1',
      title: 'Missing Rate Limiting on Login',
      severity: 'medium',
      url: 'https://login.acme.com/auth/login',
      type: 'Rate Limit',
      status: 'open',
      description: 'No rate limiting is enforced on the login endpoint, allowing brute-force attacks.',
      evidence: 'Successfully sent 1000 login attempts without being blocked',
      remediation: 'Implement rate limiting with exponential backoff. Add CAPTCHA after failed attempts.',
      cwe: 'CWE-307',
      cvss: 5.3,
      discoveredAt: '2024-01-14T16:00:00Z',
      updatedAt: '2024-01-14T16:00:00Z',
    },
    {
      id: 'vuln-6',
      projectId: 'proj-2',
      title: 'CORS Misconfiguration',
      severity: 'medium',
      url: 'https://api.fintech.io/api/v1/',
      type: 'CORS',
      status: 'confirmed',
      description: 'The API returns Access-Control-Allow-Origin: * header, allowing cross-origin requests from any domain.',
      evidence: 'Response header includes: Access-Control-Allow-Origin: *',
      remediation: 'Restrict CORS to trusted origins only. Avoid using wildcard for sensitive APIs.',
      cwe: 'CWE-942',
      cvss: 6.1,
      discoveredAt: '2024-01-13T11:00:00Z',
      updatedAt: '2024-01-14T09:00:00Z',
    },
    {
      id: 'vuln-7',
      projectId: 'proj-1',
      title: 'Outdated SSL/TLS Configuration',
      severity: 'low',
      url: 'https://mail.acme.com',
      type: 'SSL/TLS',
      status: 'open',
      description: 'The server supports TLS 1.0 and TLS 1.1 which are deprecated and known to have vulnerabilities.',
      evidence: 'TLS 1.0 and TLS 1.1 protocols are supported',
      remediation: 'Disable TLS 1.0 and 1.1. Configure server to use only TLS 1.2 and above.',
      cwe: 'CWE-326',
      cvss: 3.7,
      discoveredAt: '2024-01-12T14:00:00Z',
      updatedAt: '2024-01-12T14:00:00Z',
    },
    {
      id: 'vuln-8',
      projectId: 'proj-1',
      title: 'Information Disclosure in Error Messages',
      severity: 'low',
      url: 'https://api.acme.com/api/v1/debug',
      type: 'Info Disclosure',
      status: 'false_positive',
      description: 'Verbose error messages reveal internal paths and stack traces.',
      evidence: 'Error response contains full stack trace with file paths',
      remediation: 'Implement custom error pages. Disable debug mode in production.',
      cwe: 'CWE-209',
      cvss: 3.1,
      discoveredAt: '2024-01-11T10:00:00Z',
      updatedAt: '2024-01-13T08:00:00Z',
    },
    {
      id: 'vuln-9',
      projectId: 'proj-3',
      title: 'Missing Content Security Policy',
      severity: 'info',
      url: 'https://cloudsync.dev',
      type: 'Headers',
      status: 'open',
      description: 'No Content-Security-Policy header is set, increasing XSS attack surface.',
      evidence: 'CSP header not present in HTTP response',
      remediation: 'Implement a strict Content Security Policy header.',
      cwe: 'CWE-693',
      cvss: 0,
      discoveredAt: '2024-01-10T16:00:00Z',
      updatedAt: '2024-01-10T16:00:00Z',
    },
    {
      id: 'vuln-10',
      projectId: 'proj-1',
      title: 'JWT Token Not Validated',
      severity: 'high',
      url: 'https://api.acme.com/api/v1/tokens',
      type: 'Auth Bypass',
      status: 'open',
      description: 'The JWT token is accepted without proper signature validation. Modifying the algorithm to "none" bypasses authentication.',
      evidence: 'Modified JWT with alg:none was accepted by the server',
      remediation: 'Validate JWT signatures properly. Reject tokens with "none" algorithm. Use a strong signing key.',
      cwe: 'CWE-327',
      cvss: 8.6,
      discoveredAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-15T08:00:00Z',
    },
  ];
}

export function getMockFindings(): Finding[] {
  return [
    { id: 'f-1', scanId: 'scan-1', stageName: 'subdomain_enum', type: 'subdomain', severity: 'info', title: 'New subdomain: staging.acme.com', description: 'Discovered new subdomain via certificate transparency', url: 'https://staging.acme.com', data: {}, discoveredAt: '2024-01-15T10:05:00Z' },
    { id: 'f-2', scanId: 'scan-1', stageName: 'http_probing', type: 'info', title: 'HTTP service on port 8080', description: 'Found HTTP service running on non-standard port', url: 'http://dev.acme.com:8080', data: {}, discoveredAt: '2024-01-15T10:10:00Z' },
    { id: 'f-3', scanId: 'scan-1', stageName: 'js_analysis', type: 'sensitive', title: 'API key found in JavaScript', description: 'Found hardcoded API key in main.js bundle', url: 'https://app.acme.com/static/main.js', data: { key: 'AKIA...' }, discoveredAt: '2024-01-15T10:15:00Z' },
    { id: 'f-4', scanId: 'scan-1', stageName: 'api_discovery', type: 'endpoint', severity: 'medium', title: 'Undocumented admin API endpoint', description: 'Discovered /api/v1/admin/users endpoint not in API docs', url: 'https://api.acme.com/api/v1/admin/users', data: {}, discoveredAt: '2024-01-15T10:20:00Z' },
    { id: 'f-5', scanId: 'scan-1', stageName: 'vuln_scan', type: 'vulnerability', severity: 'critical', title: 'SQL Injection in search parameter', description: 'The search parameter is vulnerable to SQL injection', url: 'https://app.acme.com/search?q=test', data: { payload: "' OR 1=1--" }, discoveredAt: '2024-01-15T10:25:00Z' },
    { id: 'f-6', scanId: 'scan-1', stageName: 'sensitive_check', type: 'sensitive', severity: 'high', title: '.env file publicly accessible', description: 'Environment file contains sensitive credentials', url: 'https://acme.com/.env', data: {}, discoveredAt: '2024-01-15T10:28:00Z' },
    { id: 'f-7', scanId: 'scan-1', stageName: 'tech_detect', type: 'technology', severity: 'info', title: 'WordPress detected on blog.acme.com', description: 'WordPress 6.4 with multiple plugins detected', url: 'https://blog.acme.com', data: { version: '6.4' }, discoveredAt: '2024-01-15T10:12:00Z' },
    { id: 'f-8', scanId: 'scan-1', stageName: 'login_detect', type: 'endpoint', severity: 'low', title: 'Login form without CSRF protection', description: 'Login form at /auth/login missing CSRF token', url: 'https://login.acme.com/auth/login', data: {}, discoveredAt: '2024-01-15T10:22:00Z' },
    { id: 'f-9', scanId: 'scan-1', stageName: 'idor_check', type: 'vulnerability', severity: 'high', title: 'IDOR in user profile API', description: 'Can access other users profiles by changing ID', url: 'https://api.acme.com/api/v1/users/2/profile', data: {}, discoveredAt: '2024-01-15T10:26:00Z' },
    { id: 'f-10', scanId: 'scan-1', stageName: 'crawler', type: 'endpoint', severity: 'info', title: '547 endpoints crawled', description: 'Crawled 547 unique endpoints from seed URLs', url: null, data: { count: 547 }, discoveredAt: '2024-01-15T10:18:00Z' },
  ];
}

export function getMockDashboardStats(): DashboardStats {
  return {
    totalTargets: 3,
    subdomainsFound: 492,
    vulnerabilities: 25,
    activeScans: 2,
  };
}

export function getMockLogs(): LogEntry[] {
  return [
    { id: 'l-1', timestamp: '2024-01-15T10:00:00Z', level: 'info', stage: 'subdomain_enum', message: 'Starting subdomain enumeration for acme.com...' },
    { id: 'l-2', timestamp: '2024-01-15T10:00:05Z', level: 'success', stage: 'subdomain_enum', message: 'Found 247 subdomains via certificate transparency' },
    { id: 'l-3', timestamp: '2024-01-15T10:01:00Z', level: 'info', stage: 'dns_resolution', message: 'Resolving DNS for 247 subdomains...' },
    { id: 'l-4', timestamp: '2024-01-15T10:02:30Z', level: 'success', stage: 'dns_resolution', message: 'Resolved 198 subdomains successfully' },
    { id: 'l-5', timestamp: '2024-01-15T10:02:35Z', level: 'warn', stage: 'dns_resolution', message: '49 subdomains failed to resolve' },
    { id: 'l-6', timestamp: '2024-01-15T10:03:00Z', level: 'info', stage: 'http_probing', message: 'Probing HTTP services on 198 resolved hosts...' },
    { id: 'l-7', timestamp: '2024-01-15T10:05:00Z', level: 'success', stage: 'http_probing', message: '156 hosts responded to HTTP/HTTPS probes' },
    { id: 'l-8', timestamp: '2024-01-15T10:05:01Z', level: 'info', stage: 'crawler', message: 'Starting web crawler with 156 seed URLs...' },
    { id: 'l-9', timestamp: '2024-01-15T10:08:00Z', level: 'success', stage: 'crawler', message: 'Crawled 547 unique endpoints' },
    { id: 'l-10', timestamp: '2024-01-15T10:08:01Z', level: 'info', stage: 'js_analysis', message: 'Analyzing JavaScript files...' },
    { id: 'l-11', timestamp: '2024-01-15T10:10:00Z', level: 'warn', stage: 'js_analysis', message: 'Found hardcoded API key in main.js' },
    { id: 'l-12', timestamp: '2024-01-15T10:10:05Z', level: 'info', stage: 'js_analysis', message: 'Analyzing 23 JavaScript files...' },
    { id: 'l-13', timestamp: '2024-01-15T10:12:00Z', level: 'error', stage: 'port_scan', message: 'Connection timeout for ftp.acme.com:8080' },
    { id: 'l-14', timestamp: '2024-01-15T10:12:05Z', level: 'info', stage: 'port_scan', message: 'Port scanning 156 hosts on top 1000 ports...' },
    { id: 'l-15', timestamp: '2024-01-15T10:15:00Z', level: 'success', stage: 'port_scan', message: 'Found 423 open ports across all hosts' },
  ];
}

export function getMockReport(): Report {
  return {
    id: 'report-1',
    projectId: 'proj-1',
    projectName: 'Acme Corp',
    generatedAt: '2024-01-15T12:00:00Z',
    sections: [
      {
        id: 'rs-1',
        title: 'Executive Summary',
        type: 'executive_summary',
        content: 'A comprehensive security assessment was performed on Acme Corporation\'s web infrastructure between January 1-15, 2024. The assessment identified 247 subdomains, 1,893 endpoints, and 12 vulnerabilities across the target scope. Of the vulnerabilities found, 2 are rated Critical, 4 are High, 3 are Medium, 2 are Low, and 1 is Informational. Immediate attention is required for the critical findings involving SQL Injection and sensitive data exposure.',
      },
      {
        id: 'rs-2',
        title: 'Attack Surface Overview',
        type: 'attack_surface',
        content: 'The attack surface comprises 247 discovered subdomains spanning multiple environments including production, staging, and development. Key entry points include the main web application (www.acme.com), API gateway (api.acme.com), authentication service (login.acme.com), and admin panel (admin.acme.com). 156 hosts are alive and responding to HTTP/HTTPS requests. 423 open ports were detected across all hosts.',
      },
      {
        id: 'rs-3',
        title: 'Subdomain Inventory',
        type: 'subdomain_inventory',
        content: '247 subdomains were discovered through certificate transparency logs, DNS brute-forcing, and search engine enumeration. Key findings include several staging and development environments that appear to have weaker security controls than production systems. Notable subdomains include staging.acme.com, dev.acme.com, and test.acme.com which expose debug information.',
      },
      {
        id: 'rs-4',
        title: 'Endpoint Categories',
        type: 'endpoint_categories',
        content: '1,893 endpoints were discovered and categorized: API endpoints (342), JavaScript files (287), Sensitive paths (23), Login/Admin pages (18), IDOR-susceptible endpoints (45), Upload endpoints (7), and Other (1,171). 342 API endpoints were identified including 23 undocumented admin APIs that are not present in the official API documentation.',
      },
      {
        id: 'rs-5',
        title: 'Vulnerability Summary',
        type: 'vulnerability_summary',
        content: '12 vulnerabilities were identified: 2 Critical (SQL Injection, .env file exposure), 4 High (Stored XSS, IDOR, JWT bypass, CORS misconfiguration), 3 Medium (Missing rate limiting, CORS wildcard, Debug mode), 2 Low (Outdated TLS, Info in errors), 1 Info (Missing CSP). The most critical finding is an unauthenticated SQL Injection in the login form that could allow complete database compromise.',
      },
      {
        id: 'rs-6',
        title: 'High-Risk Findings Detail',
        type: 'high_risk_findings',
        content: 'CRITICAL-1: SQL Injection in login form at https://login.acme.com/auth/login. The username parameter is vulnerable to union-based SQL injection. An attacker can extract the entire database including user credentials and payment information.\n\nCRITICAL-2: .env file publicly accessible at https://acme.com/.env. Contains database passwords, AWS secret keys, and JWT signing secrets.\n\nHIGH-1: Stored XSS in user profile bio field at https://app.acme.com/profile/edit. Allows session hijacking and data theft.\n\nHIGH-2: IDOR in user API allowing unauthorized access to other users\' profiles and data.',
      },
      {
        id: 'rs-7',
        title: 'Recommendations',
        type: 'recommendations',
        content: '1. IMMEDIATE: Patch SQL Injection in login endpoint - use parameterized queries\n2. IMMEDIATE: Restrict access to .env file and rotate all exposed credentials\n3. HIGH: Implement proper authorization checks on API endpoints to prevent IDOR\n4. HIGH: Sanitize all user inputs and implement CSP headers to prevent XSS\n5. HIGH: Validate JWT signatures and reject "none" algorithm\n6. MEDIUM: Implement rate limiting on authentication endpoints\n7. MEDIUM: Configure CORS to only allow trusted origins\n8. LOW: Disable TLS 1.0/1.1 and enforce TLS 1.2+\n9. LOW: Implement custom error pages without stack traces\n10. INFO: Deploy Content Security Policy headers across all web applications',
      },
    ],
  };
}

export function getActivityChartData() {
  return [
    { date: 'Jan 1', subdomains: 12, endpoints: 45, vulnerabilities: 0 },
    { date: 'Jan 2', subdomains: 28, endpoints: 89, vulnerabilities: 1 },
    { date: 'Jan 3', subdomains: 45, endpoints: 156, vulnerabilities: 2 },
    { date: 'Jan 4', subdomains: 67, endpoints: 234, vulnerabilities: 2 },
    { date: 'Jan 5', subdomains: 89, endpoints: 312, vulnerabilities: 3 },
    { date: 'Jan 6', subdomains: 112, endpoints: 445, vulnerabilities: 4 },
    { date: 'Jan 7', subdomains: 134, endpoints: 567, vulnerabilities: 5 },
    { date: 'Jan 8', subdomains: 156, endpoints: 678, vulnerabilities: 5 },
    { date: 'Jan 9', subdomains: 178, endpoints: 789, vulnerabilities: 7 },
    { date: 'Jan 10', subdomains: 198, endpoints: 890, vulnerabilities: 8 },
    { date: 'Jan 11', subdomains: 212, endpoints: 1023, vulnerabilities: 9 },
    { date: 'Jan 12', subdomains: 223, endpoints: 1156, vulnerabilities: 10 },
    { date: 'Jan 13', subdomains: 234, endpoints: 1345, vulnerabilities: 10 },
    { date: 'Jan 14', subdomains: 241, endpoints: 1567, vulnerabilities: 11 },
    { date: 'Jan 15', subdomains: 247, endpoints: 1893, vulnerabilities: 12 },
  ];
}
