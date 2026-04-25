import { db } from '@/lib/db';

// ─── Stage definitions ────────────────────────────────────────────────────────
export interface StageDefinition {
  stageName: string;
  displayName: string;
  tools: string[];
  delay: number; // simulated seconds
}

export const SCAN_STAGES: StageDefinition[] = [
  { stageName: 'passive_subdomain_enum', displayName: 'Passive Subdomain Enumeration', tools: ['subfinder', 'assetfinder', 'amass', 'findomain', 'chaos', 'crt.sh'], delay: 3 },
  { stageName: 'active_subdomain_enum', displayName: 'Active Subdomain Enumeration', tools: ['dnscan', 'puredns', 'dnsx'], delay: 4 },
  { stageName: 'subdomain_fuzzing', displayName: 'Subdomain Fuzzing', tools: ['ffuf'], delay: 3 },
  { stageName: 'vhost_enum', displayName: 'Virtual Host Enumeration', tools: ['ffuf vhost'], delay: 2 },
  { stageName: 'infra_discovery', displayName: 'Infrastructure Discovery', tools: ['ASN lookup', 'IP ranges', 'PTR records'], delay: 2 },
  { stageName: 'cert_transparency', displayName: 'Certificate Transparency', tools: ['crt.sh'], delay: 1 },
  { stageName: 'merge_dedup', displayName: 'Merge & Deduplicate', tools: ['sort', 'uniq'], delay: 1 },
  { stageName: 'alive_detection', displayName: 'Alive Host Detection', tools: ['httpx'], delay: 3 },
  { stageName: 'url_discovery', displayName: 'URL Discovery', tools: ['waybackurls', 'gau', 'katana', 'gospider', 'paramspider'], delay: 4 },
  { stageName: 'param_extraction', displayName: 'Parameter Extraction', tools: ['paramspider', 'dalfox'], delay: 2 },
  { stageName: 'js_discovery', displayName: 'JavaScript Discovery', tools: ['katana', 'gospider', 'LinkFinder'], delay: 2 },
  { stageName: 'api_discovery', displayName: 'API Discovery', tools: ['katana', 'kiterunner'], delay: 2 },
  { stageName: 'sensitive_file_discovery', displayName: 'Sensitive File Discovery', tools: ['nuclei', 'ffuf'], delay: 3 },
  { stageName: 'login_admin_detect', displayName: 'Login/Admin Panel Detection', tools: ['nuclei', 'httpx'], delay: 2 },
  { stageName: 'idor_detect', displayName: 'IDOR Target Detection', tools: ['nuclei', 'manual'], delay: 2 },
  { stageName: 'js_secret_discovery', displayName: 'JavaScript Secret Discovery', tools: ['mantra', 'jsecret', 'jsleak'], delay: 3 },
  { stageName: 'hidden_params', displayName: 'Hidden Parameters', tools: ['arjun', 'paraminer'], delay: 3 },
  { stageName: 'port_scanning', displayName: 'Port Scanning', tools: ['naabu', 'nmap'], delay: 4 },
  { stageName: 'dir_fuzzing', displayName: 'Directory Fuzzing', tools: ['feroxbuster', 'ffuf', 'dirsearch'], delay: 4 },
  { stageName: 'api_fuzzing', displayName: 'API Endpoint Fuzzing', tools: ['kiterunner'], delay: 3 },
  { stageName: 'vuln_scanning', displayName: 'Vulnerability Scanning', tools: ['nuclei'], delay: 5 },
  { stageName: '403_bypass', displayName: '403 Bypass Detection', tools: ['nuclei', 'byp4xx'], delay: 2 },
  { stageName: 'report_generation', displayName: 'Report Generation', tools: ['internal'], delay: 1 },
];

// ─── Mock data generators ─────────────────────────────────────────────────────

const SUBDOMAIN_PREFIXES = [
  'api', 'admin', 'staging', 'dev', 'test', 'app', 'dashboard', 'portal',
  'mail', 'cdn', 'static', 'assets', 'media', 'upload', 'download', 'docs',
  'blog', 'shop', 'store', 'pay', 'billing', 'auth', 'login', 'sso',
  'internal', 'vpn', 'remote', 'git', 'ci', 'jenkins', 'deploy',
  'preview', 'demo', 'sandbox', 'beta', 'alpha', 'old', 'backup',
  'db', 'redis', 'elastic', 'grafana', 'prometheus', 'kibana',
  'status', 'monitor', 'health', 'ping', 'trace',
];

const WEB_SERVERS = ['nginx', 'Apache/2.4.52', 'cloudflare', 'Express', 'gws', 'Microsoft-IIS/10.0', 'Caddy', 'LiteSpeed'];
const TECH_STACKS = [
  ['React', 'Next.js', 'Vercel'], ['WordPress', 'PHP', 'MySQL'], ['Django', 'Python', 'PostgreSQL'],
  ['Express', 'Node.js', 'MongoDB'], ['Vue.js', 'Nuxt', 'Firebase'], ['Laravel', 'PHP', 'Redis'],
  ['Spring Boot', 'Java', 'PostgreSQL'], ['Rails', 'Ruby', 'PostgreSQL'], ['Gin', 'Go', 'CockroachDB'],
  ['Flask', 'Python', 'SQLite'], ['Angular', 'Node.js', 'AWS'], ['Svelte', 'Vite', 'Cloudflare Workers'],
];

// ─── Soft 404 Detection Patterns ───────────────────────────────────────────────
// These patterns simulate the response body analysis that a real scanner would perform
// to detect pages that return HTTP 200 but are actually error/404 pages.

const SOFT_404_PATTERNS: Array<{ pattern: string; framework: string }> = [
  { pattern: '__next_error__', framework: 'Next.js' },
  { pattern: '404: This page could not be found', framework: 'Next.js' },
  { pattern: '<title>404 Not Found</title>', framework: 'Generic' },
  { pattern: 'The page you were looking for doesn\'t exist', framework: 'Generic' },
  { pattern: 'Page Not Found', framework: 'Generic' },
  { pattern: 'Error 404', framework: 'Generic' },
  { pattern: 'Oops! That page can\'t be found', framework: 'WordPress' },
  { pattern: 'Nothing found for this request', framework: 'WordPress' },
  { pattern: 'noscript>404', framework: 'Cloudflare' },
  { pattern: 'nginx/0.0.0 404', framework: 'Nginx' },
  { pattern: '<h1>404</h1>', framework: 'Generic' },
  { pattern: 'Application error: a client-side exception has occurred', framework: 'Next.js' },
];

const SOFT_404_RESPONSE_SNIPPETS: Record<string, string[]> = {
  'Next.js': [
    '<!DOCTYPE html><html><head><style>...</style><script id="__next_error__">self.__next_f.push(...)</script><noscript>404: This page could not be found</noscript></head><body><div id="__next"></div></body></html>',
  ],
  'WordPress': [
    '<!DOCTYPE html><html><head><title>Page not found &#8211; WordPress</title></head><body><div class="wp-block-query-no-results">Oops! That page can&#8217;t be found.</div></body></html>',
  ],
  'Cloudflare': [
    '<!DOCTYPE html><html><head><title>404 Not Found</title><noscript><center>404</center></noscript></head></html>',
  ],
  'Generic': [
    '<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404</h1><p>The page you were looking for doesn\'t exist.</p></body></html>',
  ],
  'Nginx': [
    '<html><head><title>404 Not Found</title></head><body><center><h1>404 Not Found</h1></center><hr><center>nginx</center></body></html>',
  ],
};

/**
 * Simulates soft 404 detection.
 * In a real scanner, this would analyze the actual HTTP response body.
 * Here we simulate the probability of a 200 response being a soft 404
 * based on the endpoint category and path patterns.
 *
 * Returns { isSoft404, responseBody } where:
 * - isSoft404: true if the endpoint is likely a soft 404
 * - responseBody: a snippet of the response body containing the detection pattern
 */
function simulateSoft404Check(url: string, category: string, statusCode: number): { isSoft404: boolean; responseBody: string } {
  // Only check 200 responses — other status codes are already correctly categorized
  if (statusCode !== 200) {
    return { isSoft404: false, responseBody: '' };
  }

  // Soft 404 probability varies by category:
  // - Sensitive files, admin, and login paths have HIGH probability (40-60%)
  // - Interesting paths have MODERATE probability (25-40%)
  // - API endpoints have LOW probability (5-10%)
  // - JS files have VERY LOW probability (2-5%)
  const soft404Probabilities: Record<string, [number, number]> = {
    sensitive: [0.40, 0.60],
    admin: [0.35, 0.55],
    login: [0.30, 0.50],
    interesting: [0.25, 0.40],
    api: [0.05, 0.10],
    js: [0.02, 0.05],
    general: [0.15, 0.30],
    other: [0.10, 0.20],
  };

  const [minProb, maxProb] = soft404Probabilities[category] || [0.10, 0.20];
  const probability = minProb + Math.random() * (maxProb - minProb);

  // Additional boost for paths that commonly trigger soft 404s
  const soft404HotPaths = ['.env', '.env.bak', '.git/config', '.htaccess', 'web.config',
    'package.json', 'composer.json', 'wp-config.php.bak', 'backup.sql', 'dump.sql',
    '/wp-admin', '/phpinfo.php', '/info.php', '/server-status', '/server-info',
    '/.github/workflows/', '/jenkins/', '/debug/', '/elmah.axd'];
  const isHotPath = soft404HotPaths.some(p => url.toLowerCase().includes(p.toLowerCase()));

  const finalProbability = isHotPath ? Math.min(probability * 1.5, 0.85) : probability;

  if (Math.random() < finalProbability) {
    // Pick a random soft 404 pattern
    const match = pick(SOFT_404_PATTERNS);
    const snippet = pick(SOFT_404_RESPONSE_SNIPPETS[match.framework] || SOFT_404_RESPONSE_SNIPPETS['Generic']);
    return { isSoft404: true, responseBody: snippet };
  }

  return { isSoft404: false, responseBody: '' };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], min: number, max: number): T[] {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomIp(): string {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

function randomPort(): number {
  const common = [80, 443, 8080, 8443, 3000, 5000, 8000, 9000, 22, 21, 3306, 5432, 6379, 27017];
  return Math.random() > 0.5 ? pick(common) : Math.floor(Math.random() * 65535) + 1;
}

function randomStatusCode(): number {
  const codes = [200, 200, 200, 200, 301, 302, 403, 404, 500];
  return pick(codes);
}

// ─── Stage-specific data generators ───────────────────────────────────────────

function generateSubdomains(domain: string): Array<{
  domain: string; ip: string; statusCode: number; alive: boolean;
  webServer: string; title: string; contentLength: number; techStack: string; source: string;
}> {
  // Reduced from 8-20 to 5-12 subdomains
  const prefixes = pickN(SUBDOMAIN_PREFIXES, 5, 12);
  return prefixes.map(prefix => ({
    domain: `${prefix}.${domain}`,
    ip: randomIp(),
    statusCode: Math.random() > 0.2 ? 200 : randomStatusCode(),
    // 60% alive probability (was 85%)
    alive: Math.random() < 0.6,
    webServer: pick(WEB_SERVERS),
    title: `${prefix} - ${domain}`,
    contentLength: Math.floor(Math.random() * 50000),
    techStack: JSON.stringify(pickN(pick(TECH_STACKS), 1, 3)),
    source: pick(['subfinder', 'amass', 'crt.sh', 'assetfinder', 'dnsx', 'chaos', 'puredns', 'ffuf']),
  }));
}

function generateEndpoints(domain: string): Array<{
  url: string; method: string; statusCode: number; contentType: string;
  contentLength: number; category: string; parameters: string; responseTime: number;
  isSoft404: boolean; responseBody: string;
}> {
  const endpoints: Array<{
    url: string; method: string; statusCode: number; contentType: string;
    contentLength: number; category: string; parameters: string; responseTime: number;
    isSoft404: boolean; responseBody: string;
  }> = [];

  // JS files — reduced count
  const jsFiles = ['app.js', 'main.js', 'vendor.js', 'chunk.js', 'runtime.js', 'analytics.js', 'tracking.js', 'config.js', 'api.js', 'utils.js', 'bundle.min.js', 'polyfills.js'];
  for (const file of pickN(jsFiles, 2, 4)) {
    const url = `https://${domain}/static/js/${file}`;
    const soft404 = simulateSoft404Check(url, 'js', 200);
    endpoints.push({
      url,
      method: 'GET', statusCode: 200, contentType: 'application/javascript',
      contentLength: Math.floor(Math.random() * 200000), category: 'js',
      parameters: '[]', responseTime: Math.floor(Math.random() * 300) + 20,
      isSoft404: soft404.isSoft404, responseBody: soft404.responseBody,
    });
  }

  // API endpoints — reduced count, more realistic status codes
  const apiPaths = ['/api/v1/users', '/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/profile',
    '/api/v1/admin/users', '/api/v1/config', '/api/v1/upload', '/api/v1/search',
    '/api/v1/tokens', '/api/v1/webhooks', '/api/v1/payments', '/api/v1/notifications',
    '/api/graphql', '/api/rest/docs', '/api/v2/health'];
  for (const path of pickN(apiPaths, 3, 6)) {
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const params = path.includes('users') || path.includes('search') ? JSON.stringify(['id', 'page', 'limit']) :
      path.includes('upload') ? JSON.stringify(['file', 'type']) : JSON.stringify([]);
    // Most API endpoints return 200 or 404; 403/500 are less common
    const apiStatusRoll = Math.random();
    const apiStatus = apiStatusRoll < 0.45 ? 200 : apiStatusRoll < 0.70 ? 404 : apiStatusRoll < 0.85 ? 403 : randomStatusCode();
    const url = `https://${domain}${path}`;
    const soft404 = simulateSoft404Check(url, 'api', apiStatus);
    endpoints.push({
      url,
      method: pick(methods), statusCode: apiStatus, contentType: 'application/json',
      contentLength: Math.floor(Math.random() * 10000), category: 'api',
      parameters: params, responseTime: Math.floor(Math.random() * 500) + 30,
      isSoft404: soft404.isSoft404, responseBody: soft404.responseBody,
    });
  }

  // Login/Admin pages — mostly return 200 or 302 (redirect), rarely 403
  const authPaths = ['/login', '/admin', '/admin/dashboard', '/wp-admin', '/console',
    '/manager/html', '/dashboard', '/panel', '/control', '/cms/admin'];
  for (const path of pickN(authPaths, 1, 3)) {
    // Login pages mostly return 200 or 302; 403 is possible but less common; 404 is most common for non-existent panels
    const authRoll = Math.random();
    const authStatus = authRoll < 0.35 ? 200 : authRoll < 0.55 ? 302 : authRoll < 0.80 ? 404 : 403;
    const epCategory = path.includes('admin') || path.includes('panel') || path.includes('control') ? 'admin' : 'login';
    const url = `https://${domain}${path}`;
    const soft404 = simulateSoft404Check(url, epCategory, authStatus);
    endpoints.push({
      url,
      method: 'GET', statusCode: authStatus, contentType: 'text/html',
      contentLength: Math.floor(Math.random() * 30000), category: epCategory,
      parameters: '[]', responseTime: Math.floor(Math.random() * 400) + 50,
      isSoft404: soft404.isSoft404, responseBody: soft404.responseBody,
    });
  }

  // Sensitive files — MOST should get 404/403 (realistic: these are usually protected or non-existent)
  const sensitiveFiles = ['.env', '.env.bak', '.env.local', '.git/config', '.DS_Store',
    'robots.txt', 'sitemap.xml', '.htaccess', 'web.config', 'package.json',
    'composer.json', 'wp-config.php.bak', '.svn/entries', 'backup.sql',
    'dump.sql', 'database.sql', '.well-known/security.txt', 'crossdomain.xml'];
  for (const file of pickN(sensitiveFiles, 2, 4)) {
    // 70% chance 404, 20% chance 403, 10% chance 200 (very rare to actually be exposed)
    const sensitiveRoll = Math.random();
    let sensitiveStatus: number;
    let sensitiveContentType: string;
    if (sensitiveRoll < 0.70) {
      sensitiveStatus = 404;
      sensitiveContentType = 'text/html';
    } else if (sensitiveRoll < 0.90) {
      sensitiveStatus = 403;
      sensitiveContentType = 'text/html';
    } else {
      sensitiveStatus = 200;
      sensitiveContentType = pick(['text/plain', 'application/json', 'text/xml', 'application/octet-stream']);
    }
    const url = `https://${domain}/${file}`;
    const soft404 = simulateSoft404Check(url, 'sensitive', sensitiveStatus);
    // If soft 404 detected on a sensitive file, override status to 200 but mark it as soft 404
    // This simulates the real scenario where servers return 200 for missing sensitive files
    const finalStatus = soft404.isSoft404 && sensitiveStatus === 404 ? 200 : sensitiveStatus;
    const finalContentType = soft404.isSoft404 && finalStatus === 200 ? 'text/html' : sensitiveContentType;
    endpoints.push({
      url,
      method: 'GET', statusCode: finalStatus, contentType: finalContentType,
      contentLength: Math.floor(Math.random() * 5000), category: 'sensitive',
      parameters: '[]', responseTime: Math.floor(Math.random() * 200) + 10,
      isSoft404: soft404.isSoft404, responseBody: soft404.responseBody,
    });
  }

  // Interesting paths — reduced count
  const interestingPaths = ['/swagger-ui/', '/api-docs', '/phpinfo.php', '/info.php',
    '/server-status', '/server-info', '/.github/workflows/', '/jenkins/',
    '/debug/', '/trace', '/actuator/health', '/actuator/env',
    '/graphql', '/graphiql', '/elmah.axd', '/elmah'];
  for (const path of pickN(interestingPaths, 1, 3)) {
    const url = `https://${domain}${path}`;
    const status = randomStatusCode();
    const soft404 = simulateSoft404Check(url, 'interesting', status);
    endpoints.push({
      url,
      method: 'GET', statusCode: status, contentType: pick(['text/html', 'application/json']),
      contentLength: Math.floor(Math.random() * 15000), category: 'interesting',
      parameters: '[]', responseTime: Math.floor(Math.random() * 300) + 20,
      isSoft404: soft404.isSoft404, responseBody: soft404.responseBody,
    });
  }

  return endpoints;
}

function generateVulnerabilities(domain: string): Array<{
  title: string; severity: string; description: string; url: string;
  template: string; type: string; data: string;
}> {
  const vulns: Array<{
    title: string; severity: string; description: string; url: string;
    template: string; type: string; data: string;
  }> = [];

  // Realistic vulnerability pool — NO critical, only low/medium with rare high
  // Removed: "Exposed .env File" (critical), "Default Credentials Detected" (critical),
  // "SSRF" (high, too specific), "SQL Injection" (critical), "Exposed Git Repository" (critical)
  const lowVulns = [
    {
      title: 'Missing Security Headers',
      severity: 'low',
      description: 'The server is missing important security headers including X-Frame-Options, X-Content-Type-Options, and Content-Security-Policy.',
      url: `https://${domain}/`,
      template: 'misconfig/missing-security-headers',
      type: 'misconfig',
      data: JSON.stringify({ missing: ['X-Frame-Options', 'X-Content-Type-Options', 'Content-Security-Policy'] }),
    },
    {
      title: 'Cookie Without Secure Flag',
      severity: 'low',
      description: 'Session cookies are set without the Secure flag, allowing them to be transmitted over unencrypted connections.',
      url: `https://${domain}/`,
      template: 'misconfig/insecure-cookie',
      type: 'misconfig',
      data: JSON.stringify({ cookie: 'sessionid', secure: false, httpOnly: true }),
    },
    {
      title: 'Directory Listing Enabled',
      severity: 'low',
      description: 'Directory listing is enabled on the /static/ directory, exposing file structure and potentially sensitive files.',
      url: `https://${domain}/static/`,
      template: 'misconfig/directory-listing',
      type: 'misconfig',
      data: JSON.stringify({ statusCode: 200, fileCount: 47 }),
    },
  ];

  const mediumVulns = [
    {
      title: 'CORS Misconfiguration',
      severity: 'medium',
      description: 'The server returns a wildcard Access-Control-Allow-Origin header, allowing any origin to access the API.',
      url: `https://${domain}/api/v1/users`,
      template: 'misconfig/cors-wildcard',
      type: 'misconfig',
      data: JSON.stringify({ header: 'Access-Control-Allow-Origin: *', statusCode: 200 }),
    },
    {
      title: 'Information Disclosure - Stack Trace',
      severity: 'medium',
      description: 'The application exposes detailed stack trace information in error responses, revealing internal paths and technology stack.',
      url: `https://${domain}/api/v1/error`,
      template: 'exposure/stack-trace',
      type: 'exposure',
      data: JSON.stringify({ framework: 'Express.js', statusCode: 500 }),
    },
    {
      title: 'Missing Rate Limiting',
      severity: 'medium',
      description: 'No rate limiting is implemented on the authentication endpoint, allowing brute force attacks.',
      url: `https://${domain}/api/v1/auth/login`,
      template: 'misconfig/no-rate-limit',
      type: 'misconfig',
      data: JSON.stringify({ requestsPerSecond: 100, endpoint: '/api/v1/auth/login' }),
    },
    {
      title: 'GraphQL Introspection Enabled',
      severity: 'medium',
      description: 'GraphQL introspection is enabled on the production API, exposing the entire schema and potential sensitive types.',
      url: `https://${domain}/api/graphql`,
      template: 'misconfig/graphql-introspection',
      type: 'misconfig',
      data: JSON.stringify({ schemaTypes: 42, mutations: 15 }),
    },
    {
      title: 'Open Redirect',
      severity: 'medium',
      description: 'An open redirect vulnerability allows redirection to arbitrary external URLs via the redirect parameter.',
      url: `https://${domain}/auth/callback?redirect=https://evil.com`,
      template: 'vuln/open-redirect',
      type: 'injection',
      data: JSON.stringify({ parameter: 'redirect', payload: 'https://evil.com' }),
    },
  ];

  // High severity — very rare, only two types
  const highVulns = [
    {
      title: 'Reflected XSS',
      severity: 'high',
      description: 'A reflected cross-site scripting vulnerability was found in the search parameter. User input is reflected without proper sanitization.',
      url: `https://${domain}/search?q=%3Cscript%3Ealert(1)%3C/script%3E`,
      template: 'vuln/reflected-xss',
      type: 'injection',
      data: JSON.stringify({ parameter: 'q', payload: '<script>alert(1)</script>' }),
    },
    {
      title: 'JWT Secret Weakness',
      severity: 'high',
      description: 'JWT tokens appear to be signed with a weak secret key. This could allow token forgery and authentication bypass.',
      url: `https://${domain}/api/v1/auth/login`,
      template: 'auth/jwt-weak-secret',
      type: 'auth',
      data: JSON.stringify({ algorithm: 'HS256', crackable: true }),
    },
  ];

  // Weighted selection: 60% chance of 0-1 vulns, 30% chance of 2 vulns, 10% chance of 3 vulns
  const roll = Math.random();
  let vulnCount: number;
  if (roll < 0.60) {
    vulnCount = Math.random() < 0.5 ? 0 : 1; // 60% → 0 or 1
  } else if (roll < 0.90) {
    vulnCount = 2; // 30% → 2
  } else {
    vulnCount = 3; // 10% → 3
  }

  // Weight towards low/medium severity: 50% low, 35% medium, 15% high
  for (let i = 0; i < vulnCount; i++) {
    const severityRoll = Math.random();
    if (severityRoll < 0.50) {
      vulns.push(pick(lowVulns));
    } else if (severityRoll < 0.85) {
      vulns.push(pick(mediumVulns));
    } else {
      vulns.push(pick(highVulns));
    }
  }

  // Deduplicate by title
  const seen = new Set<string>();
  return vulns.filter(v => {
    if (seen.has(v.title)) return false;
    seen.add(v.title);
    return true;
  });
}

function generateFindings(domain: string): Array<{
  category: string; severity: string; url: string; title: string; data: string;
}> {
  const findings: Array<{
    category: string; severity: string; url: string; title: string; data: string;
  }> = [];

  // Realistic findings only — removed fake/unrealistic ones
  // Removed: "cloud_leak" (Public S3 Bucket), "AWS Access Key in JavaScript",
  // "Private API Key Exposed", "Environment File Accessible" (.env), "WordPress Admin Panel" (defaultCreds)
  const findingTemplates = [
    { category: 'subdomain', severity: 'info', url: `https://staging.${domain}`, title: 'Staging Environment Detected', data: JSON.stringify({ source: 'crt.sh' }) },
    { category: 'subdomain', severity: 'info', url: `https://dev.${domain}`, title: 'Development Subdomain Found', data: JSON.stringify({ source: 'subfinder' }) },
    { category: 'js_file', severity: 'low', url: `https://${domain}/static/js/config.js`, title: 'Configuration File in JavaScript', data: JSON.stringify({ size: '12KB' }) },
    { category: 'api', severity: 'info', url: `https://${domain}/api/v1/docs`, title: 'API Documentation Exposed', data: JSON.stringify({ framework: 'Swagger' }) },
    { category: 'api', severity: 'info', url: `https://${domain}/api/graphql`, title: 'GraphQL Endpoint Discovered', data: JSON.stringify({ introspection: false }) },
    { category: 'sensitive_file', severity: 'info', url: `https://${domain}/robots.txt`, title: 'Interesting Disallow Entries', data: JSON.stringify({ disallowed: ['/admin', '/backup', '/api/v2'] }) },
    { category: 'login', severity: 'info', url: `https://${domain}/login`, title: 'Login Page Detected', data: JSON.stringify({ method: 'form' }) },
    { category: 'admin', severity: 'info', url: `https://${domain}/admin`, title: 'Admin Panel Discovered', data: JSON.stringify({ authRequired: true }) },
    { category: 'idor', severity: 'medium', url: `https://${domain}/api/v1/users/1`, title: 'Potential IDOR in User API', data: JSON.stringify({ parameter: 'id', sequential: true }) },
  ];

  // Reduced from 5-10 to 2-5 findings
  const selected = pickN(findingTemplates, 2, 5);
  findings.push(...selected);
  return findings;
}

// ─── Scan log helper ──────────────────────────────────────────────────────────

async function addLog(scanId: string, level: string, message: string) {
  try {
    await db.scanLog.create({
      data: { scanId, level, message },
    });
  } catch {
    // Log creation failure should not break the scan
  }
}

// ─── Main scan simulation ─────────────────────────────────────────────────────

export async function startScanSimulation(scanId: string, projectId: string, domains: string) {
  const domainList = domains.split(',').map(d => d.trim()).filter(Boolean);
  const primaryDomain = domainList[0] || 'example.com';

  // Mark scan as running
  await db.scan.update({
    where: { id: scanId },
    data: { status: 'running', startedAt: new Date() },
  });

  await addLog(scanId, 'info', `Scan started for domain(s): ${domainList.join(', ')}`);

  // Process stages sequentially
  for (let i = 0; i < SCAN_STAGES.length; i++) {
    const stage = SCAN_STAGES[i];

    try {
      // Set stage to running
      await db.scanStage.update({
        where: { id: (await db.scanStage.findFirst({ where: { scanId, order: i } }))!.id },
        data: { status: 'running', startedAt: new Date(), progress: 10 },
      });

      await addLog(scanId, 'info', `[${stage.displayName}] Starting with tools: ${stage.tools.join(', ')}`);

      // Simulate tool execution logs
      for (const tool of stage.tools) {
        await addLog(scanId, 'info', `Running ${tool} against ${primaryDomain}...`);
      }

      // Simulate delay (shortened for demo)
      const delayMs = stage.delay * 500; // Half of declared delay for faster simulation
      await new Promise(resolve => setTimeout(resolve, delayMs));

      // Update stage progress
      await db.scanStage.update({
        where: { id: (await db.scanStage.findFirst({ where: { scanId, order: i } }))!.id },
        data: { progress: 80 },
      });

      // Generate and store results based on stage type
      let resultsCount = 0;

      switch (stage.stageName) {
        case 'passive_subdomain_enum':
        case 'active_subdomain_enum':
        case 'subdomain_fuzzing':
        case 'cert_transparency': {
          const subdomains = generateSubdomains(primaryDomain);
          for (const sub of subdomains) {
            // Check if subdomain already exists for this project
            const existing = await db.subdomain.findFirst({
              where: { projectId, domain: sub.domain },
            });
            if (!existing) {
              await db.subdomain.create({
                data: { projectId, ...sub },
              });
            }
          }
          resultsCount = subdomains.length;
          await addLog(scanId, 'success', `[${stage.displayName}] Found ${subdomains.length} subdomains`);
          break;
        }
        case 'vhost_enum': {
          resultsCount = Math.floor(Math.random() * 5) + 1;
          await addLog(scanId, 'success', `[${stage.displayName}] Found ${resultsCount} virtual hosts`);
          break;
        }
        case 'infra_discovery': {
          resultsCount = Math.floor(Math.random() * 3) + 1;
          await addLog(scanId, 'success', `[${stage.displayName}] Discovered ${resultsCount} ASN ranges`);
          break;
        }
        case 'merge_dedup': {
          const allSubdomains = await db.subdomain.findMany({ where: { projectId } });
          resultsCount = allSubdomains.length;
          await addLog(scanId, 'success', `[${stage.displayName}] Merged ${resultsCount} unique subdomains`);
          break;
        }
        case 'alive_detection': {
          const subs = await db.subdomain.findMany({ where: { projectId, alive: false } });
          // Match the 60% alive probability from generateSubdomains
          const aliveCount = Math.floor(subs.length * 0.6);
          const toUpdate = subs.slice(0, aliveCount);
          for (const sub of toUpdate) {
            await db.subdomain.update({
              where: { id: sub.id },
              data: {
                alive: true,
                statusCode: 200,
                webServer: pick(WEB_SERVERS),
                title: `${sub.domain.split('.')[0]} - ${primaryDomain}`,
                contentLength: Math.floor(Math.random() * 50000),
                techStack: JSON.stringify(pickN(pick(TECH_STACKS), 1, 3)),
              },
            });
          }
          resultsCount = aliveCount;
          await addLog(scanId, 'success', `[${stage.displayName}] ${aliveCount} hosts are alive`);
          break;
        }
        case 'url_discovery':
        case 'param_extraction':
        case 'js_discovery':
        case 'api_discovery':
        case 'login_admin_detect':
        case 'idor_detect':
        case 'hidden_params':
        case 'directory_fuzzing':
        case 'api_fuzzing': {
          const endpoints = generateEndpoints(primaryDomain);
          const soft404Count = endpoints.filter(ep => ep.isSoft404).length;
          for (const ep of endpoints) {
            const existing = await db.endpoint.findFirst({
              where: { projectId, url: ep.url, method: ep.method },
            });
            if (!existing) {
              await db.endpoint.create({
                data: { projectId, ...ep },
              });
            }
          }
          resultsCount = endpoints.length;
          await addLog(scanId, 'success', `[${stage.displayName}] Discovered ${endpoints.length} endpoints`);
          if (soft404Count > 0) {
            await addLog(scanId, 'warn', `[${stage.displayName}] ${soft404Count} endpoints flagged as soft 404 (HTTP 200 with error page content)`);
          }
          break;
        }
        case 'sensitive_file_discovery': {
          // 70% chance of 0 findings — most domains won't have exposed sensitive files
          if (Math.random() < 0.70) {
            resultsCount = 0;
            await addLog(scanId, 'success', `[${stage.displayName}] No sensitive files discovered`);
          } else {
            const endpoints = generateEndpoints(primaryDomain).filter(ep => ep.category === 'sensitive' && ep.statusCode === 200 && !ep.isSoft404);
            for (const ep of endpoints) {
              const existing = await db.endpoint.findFirst({
                where: { projectId, url: ep.url, method: ep.method },
              });
              if (!existing) {
                await db.endpoint.create({
                  data: { projectId, ...ep },
                });
              }
            }
            resultsCount = endpoints.length;
            if (resultsCount > 0) {
              await addLog(scanId, 'warn', `[${stage.displayName}] Found ${resultsCount} exposed sensitive files!`);
            } else {
              await addLog(scanId, 'success', `[${stage.displayName}] No sensitive files discovered`);
            }
          }
          break;
        }
        case 'js_secret_discovery': {
          // 80% chance of 0 findings — secrets in JS are rare
          if (Math.random() < 0.80) {
            resultsCount = 0;
            await addLog(scanId, 'success', `[${stage.displayName}] No secrets found in JavaScript files`);
          } else {
            const findings = generateFindings(primaryDomain).filter(f => f.category === 'js_file');
            for (const finding of findings) {
              await db.finding.create({
                data: { scanId, ...finding },
              });
            }
            resultsCount = findings.length;
            if (findings.length > 0) {
              await addLog(scanId, 'warn', `[${stage.displayName}] Found ${findings.length} potential secrets in JavaScript!`);
            } else {
              await addLog(scanId, 'success', `[${stage.displayName}] No secrets found in JavaScript files`);
            }
          }
          break;
        }
        case 'port_scanning': {
          const subdomains = await db.subdomain.findMany({ where: { projectId, alive: true } });
          resultsCount = subdomains.length;
          for (const sub of subdomains.slice(0, 5)) {
            await db.subdomain.update({
              where: { id: sub.id },
              data: { ip: randomIp() },
            });
          }
          await addLog(scanId, 'success', `[${stage.displayName}] Scanned ${subdomains.length} hosts for open ports`);
          break;
        }
        case 'vuln_scanning': {
          // Limit to 0-2 vulns (generateVulnerabilities already returns 0-3,
          // but we cap here to 0-2 for the vuln_scanning stage specifically)
          let vulns = generateVulnerabilities(primaryDomain);
          if (vulns.length > 2) {
            vulns = vulns.slice(0, 2);
          }
          for (const vuln of vulns) {
            await db.vulnerability.create({
              data: { projectId, ...vuln },
            });
            await db.finding.create({
              data: {
                scanId,
                category: 'vulnerability',
                severity: vuln.severity,
                url: vuln.url,
                title: vuln.title,
                data: vuln.data,
              },
            });
          }
          resultsCount = vulns.length;
          if (vulns.length > 0) {
            await addLog(scanId, 'warn', `[${stage.displayName}] Found ${vulns.length} vulnerabilities!`);
          } else {
            await addLog(scanId, 'success', `[${stage.displayName}] No vulnerabilities detected`);
          }
          break;
        }
        case '403_bypass': {
          resultsCount = Math.floor(Math.random() * 3);
          if (resultsCount > 0) {
            await addLog(scanId, 'warn', `[${stage.displayName}] Found ${resultsCount} potential 403 bypasses`);
          } else {
            await addLog(scanId, 'success', `[${stage.displayName}] No 403 bypasses detected`);
          }
          break;
        }
        case 'report_generation': {
          const totalSubdomains = await db.subdomain.count({ where: { projectId } });
          const totalEndpoints = await db.endpoint.count({ where: { projectId } });
          const totalVulns = await db.vulnerability.count({ where: { projectId } });
          const totalFindings = await db.finding.count({ where: { scanId } });

          resultsCount = 1;
          await addLog(scanId, 'success', `[${stage.displayName}] Report generated successfully`);
          await addLog(scanId, 'info', `Summary: ${totalSubdomains} subdomains, ${totalEndpoints} endpoints, ${totalVulns} vulnerabilities, ${totalFindings} findings`);
          break;
        }
      }

      // Mark stage as completed
      const stageRecord = await db.scanStage.findFirst({ where: { scanId, order: i } });
      if (stageRecord) {
        await db.scanStage.update({
          where: { id: stageRecord.id },
          data: {
            status: 'completed',
            progress: 100,
            resultsCount,
            completedAt: new Date(),
          },
        });
      }

      // Update overall scan progress
      const completedStages = i + 1;
      const totalStages = SCAN_STAGES.length;
      const progress = Math.round((completedStages / totalStages) * 100);
      await db.scan.update({
        where: { id: scanId },
        data: { progress },
      });

    } catch (error) {
      // Mark stage as failed but continue
      const stageRecord = await db.scanStage.findFirst({ where: { scanId, order: i } });
      if (stageRecord) {
        await db.scanStage.update({
          where: { id: stageRecord.id },
          data: { status: 'failed', completedAt: new Date() },
        });
      }
      await addLog(scanId, 'error', `[${stage.displayName}] Stage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Also add general findings that aren't tied to specific stages
  // Filter out secrets since those are handled by js_secret_discovery stage
  const generalFindings = generateFindings(primaryDomain).filter(f => f.category !== 'secret' && f.category !== 'js_file');
  for (const finding of generalFindings) {
    await db.finding.create({
      data: { scanId, ...finding },
    });
  }

  // Mark scan as completed
  await db.scan.update({
    where: { id: scanId },
    data: {
      status: 'completed',
      progress: 100,
      completedAt: new Date(),
    },
  });

  await addLog(scanId, 'success', 'Scan completed successfully! 🎉');
}

// ─── Create scan stages in DB ─────────────────────────────────────────────────

export async function createScanStages(scanId: string) {
  for (let i = 0; i < SCAN_STAGES.length; i++) {
    const stage = SCAN_STAGES[i];
    await db.scanStage.create({
      data: {
        scanId,
        stageName: stage.stageName,
        displayName: stage.displayName,
        status: 'pending',
        order: i,
      },
    });
  }
}
