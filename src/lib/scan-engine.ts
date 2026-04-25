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
  { stageName: 'directory_fuzzing', displayName: 'Directory Fuzzing', tools: ['feroxbuster', 'ffuf', 'dirsearch'], delay: 4 },
  { stageName: 'api_fuzzing', displayName: 'API Endpoint Fuzzing', tools: ['kiterunner'], delay: 3 },
  { stageName: 'vuln_scanning', displayName: 'Vulnerability Scanning', tools: ['nuclei'], delay: 5 },
  { stageName: 'bypass_403', displayName: '403 Bypass Detection', tools: ['nuclei', 'byp4xx'], delay: 2 },
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
  const prefixes = pickN(SUBDOMAIN_PREFIXES, 8, 20);
  return prefixes.map(prefix => ({
    domain: `${prefix}.${domain}`,
    ip: randomIp(),
    statusCode: Math.random() > 0.2 ? 200 : randomStatusCode(),
    alive: Math.random() > 0.15,
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
}> {
  const endpoints: Array<{
    url: string; method: string; statusCode: number; contentType: string;
    contentLength: number; category: string; parameters: string; responseTime: number;
  }> = [];

  // JS files
  const jsFiles = ['app.js', 'main.js', 'vendor.js', 'chunk.js', 'runtime.js', 'analytics.js', 'tracking.js', 'config.js', 'api.js', 'utils.js', 'bundle.min.js', 'polyfills.js'];
  for (const file of pickN(jsFiles, 3, 6)) {
    endpoints.push({
      url: `https://${domain}/static/js/${file}`,
      method: 'GET', statusCode: 200, contentType: 'application/javascript',
      contentLength: Math.floor(Math.random() * 200000), category: 'js',
      parameters: '[]', responseTime: Math.floor(Math.random() * 300) + 20,
    });
  }

  // API endpoints
  const apiPaths = ['/api/v1/users', '/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/profile',
    '/api/v1/admin/users', '/api/v1/config', '/api/v1/upload', '/api/v1/search',
    '/api/v1/tokens', '/api/v1/webhooks', '/api/v1/payments', '/api/v1/notifications',
    '/api/graphql', '/api/rest/docs', '/api/v2/health'];
  for (const path of pickN(apiPaths, 4, 8)) {
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const params = path.includes('users') || path.includes('search') ? JSON.stringify(['id', 'page', 'limit']) :
      path.includes('upload') ? JSON.stringify(['file', 'type']) : JSON.stringify([]);
    endpoints.push({
      url: `https://${domain}${path}`,
      method: pick(methods), statusCode: randomStatusCode(), contentType: 'application/json',
      contentLength: Math.floor(Math.random() * 10000), category: 'api',
      parameters: params, responseTime: Math.floor(Math.random() * 500) + 30,
    });
  }

  // Login/Admin pages
  const authPaths = ['/login', '/admin', '/admin/dashboard', '/wp-admin', '/console',
    '/manager/html', '/dashboard', '/panel', '/control', '/cms/admin'];
  for (const path of pickN(authPaths, 2, 4)) {
    endpoints.push({
      url: `https://${domain}${path}`,
      method: 'GET', statusCode: pick([200, 200, 302, 403]), contentType: 'text/html',
      contentLength: Math.floor(Math.random() * 30000), category: path.includes('admin') || path.includes('panel') || path.includes('control') ? 'admin' : 'login',
      parameters: '[]', responseTime: Math.floor(Math.random() * 400) + 50,
    });
  }

  // Sensitive files
  const sensitiveFiles = ['.env', '.env.bak', '.env.local', '.git/config', '.DS_Store',
    'robots.txt', 'sitemap.xml', '.htaccess', 'web.config', 'package.json',
    'composer.json', 'wp-config.php.bak', '.svn/entries', 'backup.sql',
    'dump.sql', 'database.sql', '.well-known/security.txt', 'crossdomain.xml'];
  for (const file of pickN(sensitiveFiles, 3, 6)) {
    endpoints.push({
      url: `https://${domain}/${file}`,
      method: 'GET', statusCode: Math.random() > 0.5 ? 200 : 403, contentType: pick(['text/plain', 'application/json', 'text/xml', 'application/octet-stream']),
      contentLength: Math.floor(Math.random() * 5000), category: 'sensitive',
      parameters: '[]', responseTime: Math.floor(Math.random() * 200) + 10,
    });
  }

  // Interesting paths
  const interestingPaths = ['/swagger-ui/', '/api-docs', '/phpinfo.php', '/info.php',
    '/server-status', '/server-info', '/.github/workflows/', '/jenkins/',
    '/debug/', '/trace', '/actuator/health', '/actuator/env',
    '/graphql', '/graphiql', '/elmah.axd', '/elmah'];
  for (const path of pickN(interestingPaths, 2, 4)) {
    endpoints.push({
      url: `https://${domain}${path}`,
      method: 'GET', statusCode: randomStatusCode(), contentType: pick(['text/html', 'application/json']),
      contentLength: Math.floor(Math.random() * 15000), category: 'interesting',
      parameters: '[]', responseTime: Math.floor(Math.random() * 300) + 20,
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

  const vulnTemplates = [
    {
      title: 'Exposed .env File',
      severity: 'critical',
      description: 'A .env file containing sensitive configuration data including database credentials and API keys is publicly accessible.',
      url: `https://${domain}/.env`,
      template: 'exposure/env-file',
      type: 'exposure',
      data: JSON.stringify({ match: 'DB_PASSWORD=', statusCode: 200 }),
    },
    {
      title: 'CORS Misconfiguration',
      severity: 'high',
      description: 'The server returns a wildcard Access-Control-Allow-Origin header, allowing any origin to access the API.',
      url: `https://${domain}/api/v1/users`,
      template: 'misconfig/cors-wildcard',
      type: 'misconfig',
      data: JSON.stringify({ header: 'Access-Control-Allow-Origin: *', statusCode: 200 }),
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
      title: 'SQL Injection Indicator',
      severity: 'critical',
      description: 'A potential SQL injection vulnerability was detected. Error-based SQL injection is possible through the id parameter.',
      url: `https://${domain}/api/v1/users?id=1' OR '1'='1`,
      template: 'vuln/sql-injection',
      type: 'injection',
      data: JSON.stringify({ parameter: 'id', payload: "1' OR '1'='1", errorBased: true }),
    },
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
      title: 'Information Disclosure - Stack Trace',
      severity: 'medium',
      description: 'The application exposes detailed stack trace information in error responses, revealing internal paths and technology stack.',
      url: `https://${domain}/api/v1/error`,
      template: 'exposure/stack-trace',
      type: 'exposure',
      data: JSON.stringify({ framework: 'Express.js', statusCode: 500 }),
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
    {
      title: 'Directory Listing Enabled',
      severity: 'low',
      description: 'Directory listing is enabled on the /static/ directory, exposing file structure and potentially sensitive files.',
      url: `https://${domain}/static/`,
      template: 'misconfig/directory-listing',
      type: 'misconfig',
      data: JSON.stringify({ statusCode: 200, fileCount: 47 }),
    },
    {
      title: 'Exposed Git Repository',
      severity: 'critical',
      description: 'A .git directory is publicly accessible, potentially exposing the entire source code repository.',
      url: `https://${domain}/.git/config`,
      template: 'exposure/git-directory',
      type: 'exposure',
      data: JSON.stringify({ statusCode: 200, repository: true }),
    },
    {
      title: 'Server-Side Request Forgery (SSRF)',
      severity: 'high',
      description: 'The application fetches external URLs without validation, allowing SSRF attacks to access internal resources.',
      url: `https://${domain}/api/v1/fetch?url=http://169.254.169.254/latest/meta-data/`,
      template: 'vuln/ssrf',
      type: 'injection',
      data: JSON.stringify({ parameter: 'url', internalAccess: true }),
    },
    {
      title: 'Rate Limiting Absent',
      severity: 'medium',
      description: 'No rate limiting is implemented on the authentication endpoint, allowing brute force attacks.',
      url: `https://${domain}/api/v1/auth/login`,
      template: 'misconfig/no-rate-limit',
      type: 'misconfig',
      data: JSON.stringify({ requestsPerSecond: 100, endpoint: '/api/v1/auth/login' }),
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
      title: 'GraphQL Introspection Enabled',
      severity: 'medium',
      description: 'GraphQL introspection is enabled on the production API, exposing the entire schema and potential sensitive types.',
      url: `https://${domain}/api/graphql`,
      template: 'misconfig/graphql-introspection',
      type: 'misconfig',
      data: JSON.stringify({ schemaTypes: 42, mutations: 15 }),
    },
    {
      title: 'Default Credentials Detected',
      severity: 'critical',
      description: 'Default credentials were found to be active on the admin panel, allowing unauthorized access.',
      url: `https://${domain}/admin`,
      template: 'auth/default-credentials',
      type: 'auth',
      data: JSON.stringify({ username: 'admin', password: 'admin' }),
    },
  ];

  // Pick a subset of vulnerabilities
  const selected = pickN(vulnTemplates, 4, 8);
  vulns.push(...selected);
  return vulns;
}

function generateFindings(domain: string): Array<{
  category: string; severity: string; url: string; title: string; data: string;
}> {
  const findings: Array<{
    category: string; severity: string; url: string; title: string; data: string;
  }> = [];

  const findingTemplates = [
    { category: 'subdomain', severity: 'info', url: `https://staging.${domain}`, title: 'Staging Environment Detected', data: JSON.stringify({ source: 'crt.sh' }) },
    { category: 'subdomain', severity: 'info', url: `https://dev.${domain}`, title: 'Development Subdomain Found', data: JSON.stringify({ source: 'subfinder' }) },
    { category: 'js_file', severity: 'low', url: `https://${domain}/static/js/config.js`, title: 'Configuration File in JavaScript', data: JSON.stringify({ size: '12KB' }) },
    { category: 'js_file', severity: 'medium', url: `https://${domain}/static/js/api.js`, title: 'API Key in JavaScript Source', data: JSON.stringify({ keyType: 'google_maps' }) },
    { category: 'api', severity: 'info', url: `https://${domain}/api/v1/docs`, title: 'API Documentation Exposed', data: JSON.stringify({ framework: 'Swagger' }) },
    { category: 'api', severity: 'medium', url: `https://${domain}/api/graphql`, title: 'GraphQL Endpoint Discovered', data: JSON.stringify({ introspection: true }) },
    { category: 'sensitive_file', severity: 'high', url: `https://${domain}/.env`, title: 'Environment File Accessible', data: JSON.stringify({ size: '2.4KB' }) },
    { category: 'sensitive_file', severity: 'medium', url: `https://${domain}/robots.txt`, title: 'Interesting Disallow Entries', data: JSON.stringify({ disallowed: ['/admin', '/backup', '/api/v2'] }) },
    { category: 'login', severity: 'info', url: `https://${domain}/login`, title: 'Login Page Detected', data: JSON.stringify({ method: 'form' }) },
    { category: 'admin', severity: 'medium', url: `https://${domain}/admin`, title: 'Admin Panel Discovered', data: JSON.stringify({ authRequired: true }) },
    { category: 'admin', severity: 'high', url: `https://${domain}/wp-admin`, title: 'WordPress Admin Panel', data: JSON.stringify({ defaultCreds: true }) },
    { category: 'idor', severity: 'high', url: `https://${domain}/api/v1/users/1`, title: 'Potential IDOR in User API', data: JSON.stringify({ parameter: 'id', sequential: true }) },
    { category: 'secret', severity: 'critical', url: `https://${domain}/static/js/app.js`, title: 'AWS Access Key in JavaScript', data: JSON.stringify({ provider: 'AWS', keyPrefix: 'AKIA' }) },
    { category: 'secret', severity: 'high', url: `https://${domain}/static/js/bundle.js`, title: 'Private API Key Exposed', data: JSON.stringify({ keyType: 'stripe_secret' }) },
    { category: 'cloud_leak', severity: 'critical', url: `https://s3.amazonaws.com/${domain.replace(/\./g, '-')}-assets/`, title: 'Public S3 Bucket', data: JSON.stringify({ provider: 'AWS', service: 'S3' }) },
  ];

  const selected = pickN(findingTemplates, 5, 10);
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
          const aliveCount = Math.floor(subs.length * 0.7);
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
        case 'sensitive_file_discovery':
        case 'login_admin_detect':
        case 'idor_detect':
        case 'hidden_params':
        case 'directory_fuzzing':
        case 'api_fuzzing': {
          const endpoints = generateEndpoints(primaryDomain);
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
          break;
        }
        case 'js_secret_discovery': {
          const findings = generateFindings(primaryDomain).filter(f => f.category === 'secret' || f.category === 'js_file');
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
          const vulns = generateVulnerabilities(primaryDomain);
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
          await addLog(scanId, 'warn', `[${stage.displayName}] Found ${vulns.length} vulnerabilities!`);
          break;
        }
        case 'bypass_403': {
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
  const generalFindings = generateFindings(primaryDomain).filter(f => f.category !== 'secret');
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
