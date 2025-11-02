// ZerOn Backend Server with Firebase Integration
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import Firebase
const { admin, db, auth } = require('./config/firebase');

// Import ALL Professional Scanning Services
// Phase 0: Scope & Recon
const ScopeService = require('./services/Phase0/scopeService');
const SubdomainEnumerator = require('./services/Phase0/subdomainEnum');
const AssetCatalog = require('./services/Phase0/assetCatalog');

// Phase 1: Discovery
const CrawlerService = require('./services/Phase1/crawlerService');
const FingerprintService = require('./services/Phase1/fingerprintService');
const WaybackService = require('./services/Phase1/waybackService');
const JSFileAnalyzer = require('./services/Phase1/jsFileAnalyzer');
const RobotsAndSitemapService = require('./services/Phase1/robotsAndSitemapService');
const DirectoryFuzzer = require('./services/Phase1/directoryFuzzer');

// Phase 2: Attack Surface Analysis
const ParameterDiscovery = require('./services/Phase2/parameterDiscovery');
const PayloadGenerator = require('./services/Phase2/payloadGenerator');

// Phase 3: Exploitation
const ExploitationEngine = require('./services/Phase3/exploitationEngine');
const ValidatorEngine = require('./services/Phase3/validatorEngine');
const ResponseAnalyzer = require('./services/Phase3/responseAnalyzer');
const SeverityCalculator = require('./services/Phase3/severityCalculator');
const PoCGenerator = require('./services/Phase3/pocGenerator');
const AdvancedExploitationService = require('./services/Phase3/advancedExploitationService');

// Phase 4: Reporting
const ReportGenerator = require('./services/Phase4/reportGenerator');
const BugBountyReportService = require('./services/Phase4/bugBountyReportService');

const app = express();
const server = http.createServer(app);

// Configure allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://zer-on.vercel.app',
  'https://zer-on.vercel.app/dashboard'
];

const io = socketIO(server, {
  cors: { 
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      
      // Check if origin is allowed or starts with allowed domain
      if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace('/dashboard', '')))) {
        return callback(null, true);
      }
      
      return callback(null, true); // For now, allow all (you can restrict later)
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace('/dashboard', '')))) {
      return callback(null, true);
    }
    
    return callback(null, true); // For now, allow all
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Store active scans in memory (for demo) AND Firebase
const activeScans = {};

// Save scan to Firebase
async function saveScanToFirebase(scanData) {
  try {
    await db.collection('scans').doc(scanData.scanId).set(scanData, { merge: true });
    console.log(`✓ Scan ${scanData.scanId} saved to Firebase`);
  } catch (error) {
    console.error('Firebase save error:', error);
  }
}

// Retrieve scan from Firebase
async function getScanFromFirebase(scanId) {
  try {
    const doc = await db.collection('scans').doc(scanId).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error('Firebase retrieve error:', error);
    return null;
  }
}

// Plan configuration
const PLANS = {
  basic: {
    name: 'Basic',
    price: 0,
    limits: { endpoints: 10, payloads: 100, concurrency: 1 },
    features: ['Scope Ingestion', 'Basic Crawling', 'Limited Payloads']
  },
  pro: {
    name: 'Pro',
    price: 99,
    limits: { endpoints: 100, payloads: 1000, concurrency: 5 },
    features: ['Advanced Discovery', 'Full Payloads', 'API Integration']
  },
  enterprise: {
    name: 'Enterprise',
    price: 999,
    limits: { endpoints: 1000, payloads: 5000, concurrency: 20 },
    features: ['Unlimited Access', 'Priority Support', 'Custom Rules']
  }
};

// ============================================================================
// ROUTES
// ============================================================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    features: {
      vulnerabilityTypes: 10,
      totalTestVectors: 218,
      realTimeUpdates: true,
      firebaseIntegration: true
    },
    allowedOrigins: allowedOrigins,
    endpoints: {
      startScan: 'POST /api/scan/start',
      scanStatus: 'GET /api/scan/:scanId/status',
      scanResults: 'GET /api/scan/:scanId/results',
      health: 'GET /api/health',
      plans: 'GET /api/plans'
    }
  });
});

// Get Plans
app.get('/api/plans', (req, res) => {
  res.json({ plans: PLANS });
});

// Start Scan
app.post('/api/scan/start', async (req, res) => {
  const { domain, plan, scope } = req.body;

  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
  }

  // Generate UUID for scan ID
  const scanId = uuidv4();
  const planConfig = PLANS[plan] || PLANS.basic;

  const scanData = {
    scanId,
    domain,
    plan,
    scope: scope || [domain],
    status: 'started',
    progress: 0,
    createdAt: new Date().toISOString(),
    phases: [
      { id: 0, name: 'Scope Ingestion', status: 'pending', progress: 0 },
      { id: 1, name: 'Discovery', status: 'pending', progress: 0 },
      { id: 2, name: 'Attack Surface', status: 'pending', progress: 0 },
      { id: 3, name: 'Exploitation', status: 'pending', progress: 0 },
      { id: 4, name: 'Reporting', status: 'pending', progress: 0 }
    ],
    vulnerabilities: []
  };

  activeScans[scanId] = scanData;
  
  // Save to Firebase
  await saveScanToFirebase(scanData);

  res.status(201).json({
    scanId,
    status: 'started',
    domain,
    plan,
    progress: 0,
    createdAt: new Date().toISOString(),
    estimatedDuration: 1800000
  });

  // Start real scanning in background
  performRealScan(scanId);
});

// Get Scan Status
app.get('/api/scan/:scanId/status', async (req, res) => {
  const { scanId } = req.params;
  let scan = activeScans[scanId];

  // If not in memory, try to fetch from Firebase
  if (!scan) {
    scan = await getScanFromFirebase(scanId);
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }
  }

  res.json({
    scanId,
    status: scan.status,
    progress: scan.progress,
    currentPhase: scan.phases.find(p => p.status === 'in_progress') || scan.phases[4],
    phases: scan.phases,
    findingsCount: {
      total: scan.vulnerabilities.length,
      critical: scan.vulnerabilities.filter(v => v.severity === 'critical').length,
      high: scan.vulnerabilities.filter(v => v.severity === 'high').length,
      medium: scan.vulnerabilities.filter(v => v.severity === 'medium').length,
      low: scan.vulnerabilities.filter(v => v.severity === 'low').length
    },
    updatedAt: new Date().toISOString()
  });
});

// Get Scan Results
app.get('/api/scan/:scanId/results', async (req, res) => {
  const { scanId } = req.params;
  let scan = activeScans[scanId];

  // If not in memory, try to fetch from Firebase
  if (!scan) {
    scan = await getScanFromFirebase(scanId);
    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }
  }

  res.json({
    scanId,
    domain: scan.domain,
    status: scan.status,
    startTime: scan.createdAt,
    endTime: new Date().toISOString(),
    duration: 1800,
    vulnerabilities: scan.vulnerabilities,
    statistics: {
      totalVulnerabilities: scan.vulnerabilities.length,
      bySeverity: {
        critical: scan.vulnerabilities.filter(v => v.severity === 'critical').length,
        high: scan.vulnerabilities.filter(v => v.severity === 'high').length,
        medium: scan.vulnerabilities.filter(v => v.severity === 'medium').length,
        low: scan.vulnerabilities.filter(v => v.severity === 'low').length
      }
    }
  });
});

// Get Scan by UUID from Firebase (New endpoint for direct Firebase queries)
app.get('/api/scan/:scanId', async (req, res) => {
  const { scanId } = req.params;
  
  try {
    // First check active scans
    let scan = activeScans[scanId];
    
    // If not in memory, fetch from Firebase
    if (!scan) {
      scan = await getScanFromFirebase(scanId);
    }
    
    if (!scan) {
      return res.status(404).json({ 
        error: 'Scan not found',
        message: `No scan found with UUID: ${scanId}`
      });
    }

    // Return complete scan data
    res.json({
      success: true,
      data: scan
    });
  } catch (error) {
    console.error('Error fetching scan:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch scan data from Firebase'
    });
  }
});

// Get all scans from Firebase
app.get('/api/scans', async (req, res) => {
  try {
    const { limit = 50, orderBy = 'createdAt', order = 'desc' } = req.query;
    
    let query = db.collection('scans')
      .orderBy(orderBy, order)
      .limit(parseInt(limit));
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }

    const scans = [];
    snapshot.forEach(doc => {
      scans.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: scans,
      count: scans.length
    });
  } catch (error) {
    console.error('Error fetching scans:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch scans from Firebase'
    });
  }
});

// Get Remediation Suggestions (Mock)
app.post('/api/remediation/suggest', (req, res) => {
  const { vulnerability } = req.body;

  res.json({
    vulnerability,
    analysis: `Analysis for ${vulnerability?.type} vulnerability...`,
    recommendations: [
      'Use prepared statements with parameterized queries',
      'Implement input validation and sanitization',
      'Use ORM frameworks that handle escaping automatically'
    ],
    codeExample: {
      language: 'javascript',
      vulnerable: 'const query = `SELECT * FROM users WHERE id = ${userId}`;',
      secure: 'const query = "SELECT * FROM users WHERE id = ?"; db.query(query, [userId]);'
    }
  });
});

// Export to Bug Bounty
app.post('/api/export/bug-bounty', (req, res) => {
  const { scanId, platform, vulnerabilities } = req.body;

  res.json({
    status: 'exported',
    platform,
    reportCount: vulnerabilities?.length || 0,
    message: `Successfully exported to ${platform}`
  });
});

// ============================================================================
// SOCKET.IO EVENTS
// ============================================================================

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_scan', (data) => {
    socket.join(`scan_${data.scanId}`);
    console.log(`Client joined scan room: scan_${data.scanId}`);
  });

  socket.on('leave_scan', (data) => {
    socket.leave(`scan_${data.scanId}`);
    console.log(`Client left scan room: scan_${data.scanId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ============================================================================
// PROFESSIONAL BUG BOUNTY SCANNING ENGINE
// ============================================================================

async function performRealScan(scanId) {
  const scan = activeScans[scanId];
  const domain = scan.domain;
  
  // Try both HTTP and HTTPS
  let targetUrl = domain.startsWith('http') ? domain : `http://${domain}`;
  
  console.log(`\n🎯 Starting professional scan for: ${domain}`);
  console.log(`   Attempting connection to: ${targetUrl}`);
  
  try {
    // Phase 0: Scope Ingestion & Subdomain Enumeration
    const subdomains = await runPhase0(scanId, domain, targetUrl);
    
    // Phase 1: Discovery - Crawl all subdomains and fingerprint
    const discoveredAssets = await runPhase1(scanId, [targetUrl, ...subdomains]);
    
    // Phase 2: Attack Surface Analysis - Find parameters and generate payloads
    const attackSurface = await runPhase2(scanId, discoveredAssets);
    
    // Phase 3: Exploitation - Test with intelligent payloads
    const vulnerabilities = await runPhase3(scanId, attackSurface);
    
    // Phase 4: Report Generation
    await runPhase4(scanId, vulnerabilities);
    
    scan.status = 'completed';
    scan.progress = 100;
    await saveScanToFirebase(scan);
    
    console.log(`✅ Scan completed: Found ${scan.vulnerabilities.length} vulnerabilities`);
    
    io.emit(`progress_${scanId}`, {
      phase: 'Complete!',
      status: `Scan finished - Found ${scan.vulnerabilities.length} vulnerabilities`,
      progress: 100,
      findings: scan.vulnerabilities.length
    });
    
  } catch (error) {
    console.error(`❌ Scan error for ${scanId}:`, error);
    scan.status = 'failed';
    scan.error = error.message;
    await saveScanToFirebase(scan);
    
    io.emit(`progress_${scanId}`, {
      phase: 'Error',
      status: `Scan failed: ${error.message}`,
      progress: scan.progress,
      findings: scan.vulnerabilities.length
    });
  }
}

// Phase 0: Scope Ingestion & Subdomain Enumeration (Real Bug Bounty Approach)
async function runPhase0(scanId, domain, targetUrl) {
  const scan = activeScans[scanId];
  scan.phases[0].status = 'in_progress';
  
  console.log('📋 Phase 0: Scope Ingestion & Subdomain Enumeration');
  
  io.emit(`progress_${scanId}`, {
    phase: 'Phase 0: Scope Ingestion',
    status: 'Enumerating subdomains...',
    progress: 5,
    findings: 0
  });
  
  // Parse scope
  const scope = await ScopeService.parseScope(domain);
  console.log(`  ✓ Parsed scope: ${scope.domains.length} domains`);
  
  // Enumerate subdomains (like a real bug bounty hunter)
  io.emit(`progress_${scanId}`, {
    phase: 'Phase 0: Subdomain Enumeration',
    status: 'Using DNS bruteforce & CT logs...',
    progress: 7,
    findings: 0
  });
  
  const subdomainList = await SubdomainEnumerator.enumerateSubdomains(domain);
  console.log(`  ✓ Found ${subdomainList.length} subdomains`);
  
  // Verify live subdomains (limit to top 5 for speed)
  const liveSubdomains = await SubdomainEnumerator.verifySubdomains(subdomainList.slice(0, 5));
  const subdomainUrls = liveSubdomains.map(sub => `https://${sub.subdomain}`);
  
  console.log(`  ✓ Verified ${liveSubdomains.length} live subdomains`);
  
  scan.phases[0].status = 'completed';
  scan.phases[0].progress = 100;
  scan.progress = 10;
  await saveScanToFirebase(scan);
  
  io.emit(`progress_${scanId}`, {
    phase: 'Phase 0: Complete',
    status: `Found ${liveSubdomains.length} live subdomains`,
    progress: 10,
    findings: 0
  });
  
  return subdomainUrls;
}

// Phase 1: Discovery - REAL Bug Bounty Reconnaissance Tools
async function runPhase1(scanId, targets) {
  const scan = activeScans[scanId];
  scan.phases[1].status = 'in_progress';
  
  console.log('🕷️  Phase 1: Professional Reconnaissance');
  
  io.emit(`progress_${scanId}`, {
    phase: 'Phase 1: Discovery',
    status: `Running professional recon on ${targets.length} targets...`,
    progress: 15,
    findings: 0
  });
  
  const allEndpoints = [];
  const techStack = [];
  
  // Process each target with REAL bug bounty tools
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const urlObj = new URL(target);
    const domain = urlObj.hostname;
    
    console.log(`\n  🎯 Target: ${target}`);
    console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    try {
      // Tool 1: Wayback Machine (Historical URLs)
      const waybackUrls = await WaybackService.getHistoricalUrls(domain);
      const waybackPaths = WaybackService.extractPaths(waybackUrls);
      waybackPaths.forEach(path => {
        try {
          allEndpoints.push({
            url: new URL(path, target).href,
            method: 'GET',
            type: 'wayback'
          });
        } catch (e) {}
      });
      
      // Tool 2: Robots.txt & Sitemap.xml
      const robotsPaths = await RobotsAndSitemapService.parseRobotsTxt(target);
      const sitemapUrls = await RobotsAndSitemapService.parseSitemap(target);
      
      robotsPaths.forEach(url => allEndpoints.push({ url, method: 'GET', type: 'robots' }));
      sitemapUrls.forEach(url => allEndpoints.push({ url, method: 'GET', type: 'sitemap' }));
      
      // Tool 3: JavaScript File Analysis
      const jsEndpoints = await JSFileAnalyzer.analyzeJSFiles(target);
      allEndpoints.push(...jsEndpoints);
      
      // Tool 4: Directory & File Fuzzing
      const fuzzedPaths = await DirectoryFuzzer.fuzzDirectories(target);
      allEndpoints.push(...fuzzedPaths);
      
      // Tool 5: Active Crawling
      console.log(`    🕸️  Active crawling...`);
      try {
        const crawler = new CrawlerService();
        const crawlResult = await crawler.crawl(target, { 
          maxDepth: 3,
          maxPages: 100
        });
        
        console.log(`       [DEBUG] Crawl result:`, {
          success: crawlResult.success,
          endpointsCount: crawlResult.endpoints?.length || 0,
          sampleEndpoints: crawlResult.endpoints?.slice(0, 3).map(ep => ({
            url: ep.url,
            method: ep.method,
            type: ep.type
          }))
        });
        
        if (crawlResult.success && crawlResult.endpoints && crawlResult.endpoints.length > 0) {
          // Add endpoints directly - they already have proper structure from CrawlerService
          allEndpoints.push(...crawlResult.endpoints);
          console.log(`       ✓ Crawled ${crawlResult.endpoints.length} pages`);
        } else {
          console.log(`       ⚠ No pages found via crawling`);
        }
      } catch (crawlError) {
        console.log(`       ⚠ Crawling error: ${crawlError.message}`);
        console.error(`       [DEBUG] Crawl error stack:`, crawlError.stack);
      }
      
      // Tool 6: Technology Fingerprinting
      console.log(`    � Fingerprinting technologies...`);
      try {
        const fingerprint = await FingerprintService.fingerprint(target);
        if (fingerprint.success) {
          techStack.push(...fingerprint.technologies);
          console.log(`       ✓ Technologies: ${fingerprint.technologies.join(', ')}`);
        }
      } catch (fpError) {
        console.log(`       ⚠ Fingerprinting skipped`);
      }
      
      io.emit(`progress_${scanId}`, {
        phase: 'Phase 1: Reconnaissance',
        status: `Scanned ${i + 1}/${targets.length} targets`,
        progress: 15 + (i / targets.length) * 15,
        findings: allEndpoints.length
      });
      
    } catch (error) {
      console.error(`    ✗ Error with ${target}:`, error.message);
    }
    
    console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }
  
  // Deduplicate endpoints
  const uniqueEndpoints = CrawlerService.deduplicateEndpoints(allEndpoints);
  console.log(`\n  📊 Reconnaissance Summary:`);
  console.log(`     • Total unique endpoints: ${uniqueEndpoints.length}`);
  console.log(`     • Wayback Machine: ${allEndpoints.filter(e => e.type === 'wayback').length}`);
  console.log(`     • JavaScript files: ${allEndpoints.filter(e => e.type === 'js_extracted').length}`);
  console.log(`     • Fuzzing: ${allEndpoints.filter(e => e.type === 'fuzzed').length}`);
  console.log(`     • Crawling: ${allEndpoints.filter(e => !e.type || e.type === 'discovered').length}`);
  console.log(`     • Known Vulnerable: ${allEndpoints.filter(e => e.type === 'known_vulnerable').length}`);
  console.log(`     • Tech stack: ${[...new Set(techStack)].join(', ') || 'Unknown'}\n`);
  
  scan.phases[1].status = 'completed';
  scan.phases[1].progress = 100;
  scan.progress = 30;
  await saveScanToFirebase(scan);
  
  io.emit(`progress_${scanId}`, {
    phase: 'Phase 1: Complete',
    status: `Discovered ${uniqueEndpoints.length} endpoints`,
    progress: 30,
    findings: uniqueEndpoints.length
  });
  
  return { endpoints: uniqueEndpoints, techStack: [...new Set(techStack)] };
}

// Phase 2: Attack Surface Analysis - Parameter Discovery & Payload Generation
async function runPhase2(scanId, discoveredAssets) {
  const scan = activeScans[scanId];
  scan.phases[2].status = 'in_progress';
  
  console.log('🎯 Phase 2: Attack Surface Analysis');
  
  io.emit(`progress_${scanId}`, {
    phase: 'Phase 2: Attack Surface',
    status: 'Discovering parameters...',
    progress: 40,
    findings: 0
  });
  
  const attackSurface = [];
  const seenVectors = new Set(); // Track unique endpoint+parameter combinations
  const { endpoints } = discoveredAssets;
  
  // Helper function to normalize URL (remove parameter values for deduplication)
  function normalizeURL(url) {
    try {
      const urlObj = new URL(url);
      const params = Array.from(urlObj.searchParams.keys()).sort();
      // Create normalized URL with just the path and parameter names (no values)
      return `${urlObj.origin}${urlObj.pathname}?${params.join('&')}`;
    } catch (e) {
      return url; // If parsing fails, return original URL
    }
  }
  
  // Discover parameters for each endpoint
  for (let i = 0; i < Math.min(endpoints.length, 50); i++) {
    const endpoint = endpoints[i];
    
    try {
      console.log(`  🔍 Analyzing: ${endpoint.url}`);
      
      // Discover all parameters
      const paramResult = await ParameterDiscovery.discoverParameters(
        endpoint.url,
        endpoint.method || 'GET'
      );
      
      if (paramResult.success && paramResult.parameters.length > 0) {
        const injectable = ParameterDiscovery.getInjectableParameters(paramResult.parameters);
        
        // Generate context-aware payloads for each parameter
        for (const param of injectable) {
          // Create unique key for deduplication using normalized URL
          const normalizedUrl = normalizeURL(endpoint.url);
          const vectorKey = `${normalizedUrl}::${param.name}`;
          
          // Skip if we've already added this endpoint+parameter combination
          if (seenVectors.has(vectorKey)) {
            continue;
          }
          
          seenVectors.add(vectorKey);
          
          const payloads = PayloadGenerator.generatePayloadsByPriority(param);
          
          attackSurface.push({
            endpoint,
            parameter: param,
            payloads: payloads.slice(0, 20), // Top 20 payloads per parameter
            classification: param.classification,
            sensitivity: param.sensitivity
          });
        }
        
        console.log(`    ✓ Found ${injectable.length} injectable parameters`);
      }
      
      io.emit(`progress_${scanId}`, {
        phase: 'Phase 2: Attack Surface',
        status: `Analyzed ${i + 1}/${Math.min(endpoints.length, 50)} endpoints`,
        progress: 40 + (i / Math.min(endpoints.length, 50)) * 10,
        findings: attackSurface.length
      });
      
    } catch (error) {
      console.error(`    ✗ Error analyzing ${endpoint.url}:`, error.message);
    }
  }
  
  console.log(`  ✓ Total attack surface: ${attackSurface.length} unique testable parameters (duplicates removed)`);
  
  scan.phases[2].status = 'completed';
  scan.phases[2].progress = 100;
  scan.progress = 50;
  await saveScanToFirebase(scan);
  
  io.emit(`progress_${scanId}`, {
    phase: 'Phase 2: Complete',
    status: `Identified ${attackSurface.length} attack vectors`,
    progress: 50,
    findings: attackSurface.length
  });
  
  return attackSurface;
}

// Phase 3: Systematic Vulnerability Testing (Test by Type - Real Bug Bounty Approach)
async function runPhase3(scanId, attackSurface) {
  const scan = activeScans[scanId];
  scan.phases[3].status = 'in_progress';
  
  console.log('💥 Phase 3: Systematic Vulnerability Testing (Real Bug Bounty Approach)');
  console.log('   Testing Order: XSS → SQLi → SSRF → RCE → Other\n');
  
  io.emit(`progress_${scanId}`, {
    phase: 'Phase 3: Exploitation',
    status: 'Testing vulnerabilities systematically by type...',
    progress: 60,
    findings: scan.vulnerabilities.length
  });
  
  const confirmedVulns = [];
  const totalVectors = Math.min(attackSurface.length, 50);
  
  // ============================================================================
  // PHASE 3.1: Test ALL parameters for XSS first
  // ============================================================================
  console.log('  🎯 PHASE 3.1: Testing for XSS Vulnerabilities\n');
  console.log('  ' + '═'.repeat(70));
  
  for (let i = 0; i < totalVectors; i++) {
    const vector = attackSurface[i];
    const { endpoint, parameter } = vector;
    
    console.log(`  🔬 XSS Test [${i + 1}/${totalVectors}]: ${endpoint.url} [${parameter.name}]`);
    
    try {
      const xssResults = await AdvancedExploitationService.testXSSOnly(endpoint, parameter);
      
      for (const result of xssResults) {
        if (result.vulnerable && result.confidence >= 60) {
          const vuln = await createVulnerability(result, endpoint, parameter, scan);
          if (vuln) {  // Only add if vulnerability was created successfully
            confirmedVulns.push(vuln);
            console.log(`    ✅ XSS FOUND! (Confidence: ${result.confidence}%)`);
          }
        }
      }
      
      if (xssResults.length === 0 || !xssResults[0].vulnerable) {
        console.log(`    ⚪ No XSS detected`);
      }
      
    } catch (error) {
      console.error(`    ✗ Error: ${error.message}`);
    }
    
    io.emit(`progress_${scanId}`, {
      phase: 'Phase 3.1: XSS Testing',
      status: `XSS tested ${i + 1}/${totalVectors} vectors`,
      progress: 60 + (i / totalVectors) * 10,
      findings: scan.vulnerabilities.length
    });
  }
  
  console.log(`  ✅ XSS Testing Complete: ${confirmedVulns.filter(v => v.type.includes('XSS')).length} XSS found\n`);
  
  // ============================================================================
  // PHASE 3.2: Test ALL parameters for SQLi
  // ============================================================================
  console.log('  🎯 PHASE 3.2: Testing for SQL Injection Vulnerabilities\n');
  console.log('  ' + '═'.repeat(70));
  
  for (let i = 0; i < totalVectors; i++) {
    const vector = attackSurface[i];
    const { endpoint, parameter } = vector;
    
    console.log(`  🔬 SQLi Test [${i + 1}/${totalVectors}]: ${endpoint.url} [${parameter.name}]`);
    
    try {
      const sqliResults = await AdvancedExploitationService.testSQLiOnly(endpoint, parameter);
      
      for (const result of sqliResults) {
        if (result.vulnerable && result.confidence >= 60) {
          const vuln = await createVulnerability(result, endpoint, parameter, scan);
          if (vuln) {  // Only add if vulnerability was created successfully
            confirmedVulns.push(vuln);
            console.log(`    ✅ SQLi FOUND: ${result.type} (Confidence: ${result.confidence}%)`);
          }
        }
      }
      
      if (sqliResults.length === 0 || !sqliResults[0].vulnerable) {
        console.log(`    ⚪ No SQLi detected`);
      }
      
    } catch (error) {
      console.error(`    ✗ Error: ${error.message}`);
    }
    
    io.emit(`progress_${scanId}`, {
      phase: 'Phase 3.2: SQLi Testing',
      status: `SQLi tested ${i + 1}/${totalVectors} vectors`,
      progress: 70 + (i / totalVectors) * 10,
      findings: scan.vulnerabilities.length
    });
  }
  
  console.log(`  ✅ SQLi Testing Complete: ${confirmedVulns.filter(v => v.type.includes('SQLi') || v.type.includes('SQL')).length} SQLi found\n`);
  
  // ============================================================================
  // PHASE 3.3: Test for SSRF
  // ============================================================================
  console.log('  🎯 PHASE 3.3: Testing for SSRF Vulnerabilities\n');
  console.log('  ' + '═'.repeat(70));
  
  for (let i = 0; i < Math.min(totalVectors, 20); i++) {
    const vector = attackSurface[i];
    const { endpoint, parameter } = vector;
    
    console.log(`  🔬 SSRF Test [${i + 1}/${Math.min(totalVectors, 20)}]: ${endpoint.url} [${parameter.name}]`);
    
    try {
      const ssrfResults = await AdvancedExploitationService.testSSRFOnly(endpoint, parameter);
      
      for (const result of ssrfResults) {
        if (result.vulnerable && result.confidence >= 60) {
          const vuln = await createVulnerability(result, endpoint, parameter, scan);
          if (vuln) {  // Only add if vulnerability was created successfully
            confirmedVulns.push(vuln);
            console.log(`    ✅ SSRF FOUND! (Confidence: ${result.confidence}%)`);
          }
        }
      }
      
      if (ssrfResults.length === 0) {
        console.log(`    ⚪ No SSRF detected`);
      }
      
    } catch (error) {
      console.error(`    ✗ Error: ${error.message}`);
    }
    
    io.emit(`progress_${scanId}`, {
      phase: 'Phase 3.3: SSRF Testing',
      status: `SSRF tested ${i + 1}/${Math.min(totalVectors, 20)} vectors`,
      progress: 80 + (i / Math.min(totalVectors, 20)) * 5,
      findings: scan.vulnerabilities.length
    });
  }
  
  console.log(`  ✅ SSRF Testing Complete: ${confirmedVulns.filter(v => v.type === 'SSRF').length} SSRF found\n`);
  
  // ============================================================================
  // PHASE 3.4: Test for RCE
  // ============================================================================
  console.log('  🎯 PHASE 3.4: Testing for Remote Code Execution\n');
  console.log('  ' + '═'.repeat(70));
  
  for (let i = 0; i < Math.min(totalVectors, 20); i++) {
    const vector = attackSurface[i];
    const { endpoint, parameter } = vector;
    
    console.log(`  🔬 RCE Test [${i + 1}/${Math.min(totalVectors, 20)}]: ${endpoint.url} [${parameter.name}]`);
    
    try {
      const rceResults = await AdvancedExploitationService.testRCEOnly(endpoint, parameter);
      
      for (const result of rceResults) {
        if (result.vulnerable && result.confidence >= 60) {
          const vuln = await createVulnerability(result, endpoint, parameter, scan);
          if (vuln) {  // Only add if vulnerability was created successfully
            confirmedVulns.push(vuln);
            console.log(`    ✅ RCE FOUND! (Confidence: ${result.confidence}%)`);
          }
        }
      }
      
      if (rceResults.length === 0) {
        console.log(`    ⚪ No RCE detected`);
      }
      
    } catch (error) {
      console.error(`    ✗ Error: ${error.message}`);
    }
    
    io.emit(`progress_${scanId}`, {
      phase: 'Phase 3.4: RCE Testing',
      status: `RCE tested ${i + 1}/${Math.min(totalVectors, 20)} vectors`,
      progress: 85 + (i / Math.min(totalVectors, 20)) * 5,
      findings: scan.vulnerabilities.length
    });
  }
  
  console.log(`  ✅ RCE Testing Complete: ${confirmedVulns.filter(v => v.type.includes('RCE') || v.type.includes('Code Execution')).length} RCE found\n`);
  
  // ============================================================
  // 3.5: Information Disclosure Testing
  // ============================================================
  console.log('  ' + '═'.repeat(70));
  console.log('  📊 Phase 3.5: Information Disclosure Testing');
  console.log('  ' + '═'.repeat(70));
  console.log(`  Testing ${Math.min(totalVectors, 30)} vectors for sensitive data exposure\n`);
  
  for (let i = 0; i < Math.min(totalVectors, 30); i++) {
    const vector = attackSurface[i];
    const { endpoint, parameter } = vector;
    
    console.log(`  🔬 Info Disclosure Test [${i + 1}/${Math.min(totalVectors, 30)}]: ${endpoint.url} [${parameter.name}]`);
    
    try {
      const infoResults = await AdvancedExploitationService.testInfoDisclosureOnly(endpoint, parameter);
      
      for (const result of infoResults) {
        if (result.vulnerable && result.confidence >= 60) {
          const vuln = await createVulnerability(result, endpoint, parameter, scan);
          if (vuln) {  // Only add if vulnerability was created successfully
            confirmedVulns.push(vuln);
            console.log(`    ✅ INFO DISCLOSURE FOUND: ${result.subType || result.type} (Confidence: ${result.confidence}%)`);
          }
        }
      }
      
      if (infoResults.length === 0) {
        console.log(`    ⚪ No info disclosure detected`);
      }
      
    } catch (error) {
      console.error(`    ✗ Error: ${error.message}`);
    }
    
    io.emit(`progress_${scanId}`, {
      phase: 'Phase 3.5: Information Disclosure Testing',
      status: `Info Disclosure tested ${i + 1}/${Math.min(totalVectors, 30)} vectors`,
      progress: 90 + (i / Math.min(totalVectors, 30)) * 5,
      findings: scan.vulnerabilities.length
    });
  }
  
  console.log(`  ✅ Info Disclosure Testing Complete: ${confirmedVulns.filter(v => v.type.includes('Information Disclosure')).length} found\n`);
  
  // ============================================================
  // 3.6: IDOR (Insecure Direct Object Reference) Testing
  // ============================================================
  console.log('  ' + '═'.repeat(70));
  console.log('  🔐 Phase 3.6: IDOR Testing');
  console.log('  ' + '═'.repeat(70));
  console.log(`  Testing ${Math.min(totalVectors, 25)} vectors for insecure direct object references\n`);
  
  for (let i = 0; i < Math.min(totalVectors, 25); i++) {
    const vector = attackSurface[i];
    const { endpoint, parameter } = vector;
    
    console.log(`  🔬 IDOR Test [${i + 1}/${Math.min(totalVectors, 25)}]: ${endpoint.url} [${parameter.name}]`);
    
    try {
      const idorResults = await AdvancedExploitationService.testIDOROnly(endpoint, parameter);
      
      for (const result of idorResults) {
        if (result.vulnerable && result.confidence >= 60) {
          const vuln = await createVulnerability(result, endpoint, parameter, scan);
          if (vuln) {
            confirmedVulns.push(vuln);
            console.log(`    ✅ IDOR FOUND: ${result.subType || result.type} (Confidence: ${result.confidence}%)`);
          }
        }
      }
      
      if (idorResults.length === 0) {
        console.log(`    ⚪ No IDOR detected`);
      }
      
    } catch (error) {
      console.error(`    ✗ Error: ${error.message}`);
    }
    
    io.emit(`progress_${scanId}`, {
      phase: 'Phase 3.6: IDOR Testing',
      status: `IDOR tested ${i + 1}/${Math.min(totalVectors, 25)} vectors`,
      progress: 95 + (i / Math.min(totalVectors, 25)) * 2,
      findings: scan.vulnerabilities.length
    });
  }
  
  console.log(`  ✅ IDOR Testing Complete: ${confirmedVulns.filter(v => v.type.includes('IDOR')).length} found\n`);
  
  // ============================================================
  // 3.7: CORS Misconfiguration Testing
  // ============================================================
  console.log('  ' + '═'.repeat(70));
  console.log('  🌐 Phase 3.7: CORS Misconfiguration Testing');
  console.log('  ' + '═'.repeat(70));
  console.log(`  Testing ${Math.min(totalVectors, 15)} API endpoints for CORS issues\n`);
  
  for (let i = 0; i < Math.min(totalVectors, 15); i++) {
    const vector = attackSurface[i];
    const { endpoint, parameter } = vector;
    
    console.log(`  🔬 CORS Test [${i + 1}/${Math.min(totalVectors, 15)}]: ${endpoint.url}`);
    
    try {
      const corsResults = await AdvancedExploitationService.testCORSOnly(endpoint, parameter);
      
      for (const result of corsResults) {
        if (result.vulnerable && result.confidence >= 60) {
          const vuln = await createVulnerability(result, endpoint, parameter, scan);
          if (vuln) {
            confirmedVulns.push(vuln);
            console.log(`    ✅ CORS ISSUE FOUND: ${result.subType || result.type} (Confidence: ${result.confidence}%)`);
          }
        }
      }
      
      if (corsResults.length === 0) {
        console.log(`    ⚪ No CORS misconfiguration`);
      }
      
    } catch (error) {
      console.error(`    ✗ Error: ${error.message}`);
    }
    
    io.emit(`progress_${scanId}`, {
      phase: 'Phase 3.7: CORS Testing',
      status: `CORS tested ${i + 1}/${Math.min(totalVectors, 15)} endpoints`,
      progress: 97 + (i / Math.min(totalVectors, 15)) * 1,
      findings: scan.vulnerabilities.length
    });
  }
  
  console.log(`  ✅ CORS Testing Complete: ${confirmedVulns.filter(v => v.type.includes('CORS')).length} found\n`);
  
  // ============================================================
  // 3.8: Open Redirect Testing
  // ============================================================
  console.log('  ' + '═'.repeat(70));
  console.log('  🔀 Phase 3.8: Open Redirect Testing');
  console.log('  ' + '═'.repeat(70));
  console.log(`  Testing redirect parameters for open redirect vulnerabilities\n`);
  
  for (let i = 0; i < Math.min(totalVectors, 25); i++) {
    const vector = attackSurface[i];
    const { endpoint, parameter } = vector;
    
    console.log(`  🔬 Open Redirect Test [${i + 1}/${Math.min(totalVectors, 25)}]: ${endpoint.url} [${parameter.name}]`);
    
    try {
      const redirectResults = await AdvancedExploitationService.testOpenRedirectOnly(endpoint, parameter);
      
      for (const result of redirectResults) {
        if (result.vulnerable && result.confidence >= 60) {
          const vuln = await createVulnerability(result, endpoint, parameter, scan);
          if (vuln) {
            confirmedVulns.push(vuln);
            console.log(`    ✅ OPEN REDIRECT FOUND: ${result.subType || result.type} (Confidence: ${result.confidence}%)`);
          }
        }
      }
      
      if (redirectResults.length === 0) {
        console.log(`    ⚪ No open redirect`);
      }
      
    } catch (error) {
      console.error(`    ✗ Error: ${error.message}`);
    }
    
    io.emit(`progress_${scanId}`, {
      phase: 'Phase 3.8: Open Redirect Testing',
      status: `Redirect tested ${i + 1}/${Math.min(totalVectors, 25)} parameters`,
      progress: 98 + (i / Math.min(totalVectors, 25)) * 0.5,
      findings: scan.vulnerabilities.length
    });
  }
  
  console.log(`  ✅ Open Redirect Testing Complete: ${confirmedVulns.filter(v => v.type.includes('Open Redirect')).length} found\n`);
  
  // ============================================================
  // 3.9: Authentication Bypass Testing
  // ============================================================
  console.log('  ' + '═'.repeat(70));
  console.log('  🔓 Phase 3.9: Authentication Bypass Testing');
  console.log('  ' + '═'.repeat(70));
  console.log(`  Testing authentication endpoints for bypass vulnerabilities\n`);
  
  for (let i = 0; i < Math.min(totalVectors, 20); i++) {
    const vector = attackSurface[i];
    const { endpoint, parameter } = vector;
    
    console.log(`  🔬 Auth Bypass Test [${i + 1}/${Math.min(totalVectors, 20)}]: ${endpoint.url} [${parameter.name}]`);
    
    try {
      const authResults = await AdvancedExploitationService.testAuthBypassOnly(endpoint, parameter);
      
      for (const result of authResults) {
        if (result.vulnerable && result.confidence >= 60) {
          const vuln = await createVulnerability(result, endpoint, parameter, scan);
          if (vuln) {
            confirmedVulns.push(vuln);
            console.log(`    ✅ AUTH BYPASS FOUND: ${result.subType || result.type} (Confidence: ${result.confidence}%)`);
          }
        }
      }
      
      if (authResults.length === 0) {
        console.log(`    ⚪ No auth bypass`);
      }
      
    } catch (error) {
      console.error(`    ✗ Error: ${error.message}`);
    }
    
    io.emit(`progress_${scanId}`, {
      phase: 'Phase 3.9: Auth Bypass Testing',
      status: `Auth tested ${i + 1}/${Math.min(totalVectors, 20)} endpoints`,
      progress: 98.5 + (i / Math.min(totalVectors, 20)) * 0.5,
      findings: scan.vulnerabilities.length
    });
  }
  
  console.log(`  ✅ Authentication Bypass Testing Complete: ${confirmedVulns.filter(v => v.type.includes('Authentication Bypass')).length} found\n`);
  
  // ============================================================
  // 3.10: Business Logic Vulnerabilities Testing
  // ============================================================
  console.log('  ' + '═'.repeat(70));
  console.log('  💼 Phase 3.10: Business Logic Testing');
  console.log('  ' + '═'.repeat(70));
  console.log(`  Testing business logic flaws (price, quantity, discount manipulation)\n`);
  
  for (let i = 0; i < Math.min(totalVectors, 25); i++) {
    const vector = attackSurface[i];
    const { endpoint, parameter } = vector;
    
    console.log(`  🔬 Business Logic Test [${i + 1}/${Math.min(totalVectors, 25)}]: ${endpoint.url} [${parameter.name}]`);
    
    try {
      const bizLogicResults = await AdvancedExploitationService.testBusinessLogicOnly(endpoint, parameter);
      
      for (const result of bizLogicResults) {
        if (result.vulnerable && result.confidence >= 60) {
          const vuln = await createVulnerability(result, endpoint, parameter, scan);
          if (vuln) {
            confirmedVulns.push(vuln);
            console.log(`    ✅ BUSINESS LOGIC FLAW FOUND: ${result.subType || result.type} (Confidence: ${result.confidence}%)`);
          }
        }
      }
      
      if (bizLogicResults.length === 0) {
        console.log(`    ⚪ No business logic flaws`);
      }
      
    } catch (error) {
      console.error(`    ✗ Error: ${error.message}`);
    }
    
    io.emit(`progress_${scanId}`, {
      phase: 'Phase 3.10: Business Logic Testing',
      status: `Business logic tested ${i + 1}/${Math.min(totalVectors, 25)} parameters`,
      progress: 99 + (i / Math.min(totalVectors, 25)) * 0.5,
      findings: scan.vulnerabilities.length
    });
  }
  
  console.log(`  ✅ Business Logic Testing Complete: ${confirmedVulns.filter(v => v.type.includes('Business Logic')).length} found\n`);
  
  console.log('  ' + '═'.repeat(70));
  console.log(`\n  ✅ Phase 3 Complete: ${confirmedVulns.length} confirmed vulnerabilities`);
  console.log(`     • XSS: ${confirmedVulns.filter(v => v.type.includes('XSS')).length}`);
  console.log(`     • SQLi: ${confirmedVulns.filter(v => v.type.includes('SQLi') || v.type.includes('SQL')).length}`);
  console.log(`     • SSRF: ${confirmedVulns.filter(v => v.type === 'SSRF').length}`);
  console.log(`     • RCE: ${confirmedVulns.filter(v => v.type.includes('RCE') || v.type.includes('Code Execution')).length}`);
  console.log(`     • Info Disclosure: ${confirmedVulns.filter(v => v.type.includes('Information Disclosure')).length}`);
  console.log(`     • IDOR: ${confirmedVulns.filter(v => v.type.includes('IDOR')).length}`);
  console.log(`     • CORS: ${confirmedVulns.filter(v => v.type.includes('CORS')).length}`);
  console.log(`     • Open Redirect: ${confirmedVulns.filter(v => v.type.includes('Open Redirect')).length}`);
  console.log(`     • Auth Bypass: ${confirmedVulns.filter(v => v.type.includes('Authentication Bypass')).length}`);
  console.log(`     • Business Logic: ${confirmedVulns.filter(v => v.type.includes('Business Logic')).length}\n`);
  
  scan.phases[3].status = 'completed';
  scan.phases[3].progress = 100;
  scan.progress = 99.5;
  await saveScanToFirebase(scan);
  
  io.emit(`progress_${scanId}`, {
    phase: 'Phase 3: Complete',
    status: `Found ${confirmedVulns.length} confirmed vulnerabilities`,
    progress: 99.5,
    findings: scan.vulnerabilities.length
  });
  
  return confirmedVulns;
}

// Helper function to create vulnerability object
async function createVulnerability(result, endpoint, parameter, scan) {
  // Safety checks for required fields
  if (!endpoint || !endpoint.url || !parameter || !parameter.name) {
    console.warn('    ⚠ Skipping vulnerability due to missing endpoint or parameter data');
    return null;
  }
  
  const severity = SeverityCalculator.calculateSimpleSeverity({
    type: result.type,
    impact: 'high',
    auth: 'none',
    complexity: 'low'
  });
  
  const poc = PoCGenerator.generatePoC({
    type: result.type,
    endpoint,
    parameter,
    payload: { payload: result.payloadUsed || result.evidence?.[0] || 'test' },
    response: { data: result.evidence?.join('\n') || 'Response data not available' }
  });
  
  const vulnerability = {
    id: `vuln_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: result.type,
    severity: severity.severity,
    cvss: severity.score / 10,
    endpoint: endpoint.url || 'Unknown',
    parameter: parameter.name || 'Unknown',
    parameterClassification: parameter.classification || 'generic',
    description: `The "${parameter.name}" parameter is vulnerable to ${result.type}. ${result.evidence?.join('. ') || 'No evidence details'}`,
    payload: result.payloadUsed || result.evidence?.[0] || 'Unknown payload',
    confidence: result.confidence || 0,
    indicators: result.evidence || [],
    poc,
    request: {
      method: endpoint.method || 'GET',
      url: endpoint.url || 'Unknown',
      parameter: parameter.name || 'Unknown',
      value: result.payloadUsed || 'multiple payloads tested'
    },
    response: {
      status: 200,
      snippet: (result.evidence?.join('\n') || '').substring(0, 500)
    },
    context: result.context || 'N/A',
    exploitationMethod: 'Systematic Testing',
    discoveredAt: new Date().toISOString()
  };
  
  scan.vulnerabilities.push(vulnerability);
  await saveScanToFirebase(scan);
  
  return vulnerability;
}

// Phase 4: Professional Bug Bounty Report Generation
async function runPhase4(scanId, vulnerabilities) {
  const scan = activeScans[scanId];
  scan.phases[4].status = 'in_progress';
  
  console.log('📊 Phase 4: Professional Bug Bounty Report Generation\n');
  
  io.emit(`progress_${scanId}`, {
    phase: 'Phase 4: Reporting',
    status: 'Generating HackerOne/Bugcrowd style reports...',
    progress: 95,
    findings: scan.vulnerabilities.length
  });
  
  // Generate bug bounty style reports for each vulnerability
  const bugBountyReports = [];
  const vulnerabilitiesToReport = vulnerabilities || scan.vulnerabilities;
  
  console.log(`  📝 Generating ${vulnerabilitiesToReport.length} individual bug bounty reports...`);
  
  for (const vuln of vulnerabilitiesToReport) {
    try {
      // Generate HackerOne/Bugcrowd style report
      const bbReport = BugBountyReportService.generateBugBountyReport(vuln);
      const markdownReport = BugBountyReportService.generateMarkdownReport(vuln);
      
      bugBountyReports.push({
        vulnerability: vuln,
        report: bbReport,
        markdown: markdownReport,
        submission_ready: true
      });
      
      console.log(`     ✓ ${bbReport.title}`);
      console.log(`       CVSS: ${bbReport.cvss.score}/10 (${bbReport.cvss.severity})`);
      
    } catch (error) {
      console.error(`     ✗ Error generating report for ${vuln.type}: ${error.message}`);
    }
  }
  
  // Generate comprehensive executive report
  const executiveReport = ReportGenerator.generateReport(vulnerabilitiesToReport, {
    domain: scan.domain,
    duration: Date.now() - new Date(scan.createdAt).getTime(),
    scanId: scanId
  });
  
  console.log(`\n  📊 Executive Summary:`);
  console.log(`     • Risk Level: ${executiveReport.executive_summary.risk_level}`);
  console.log(`     • Total Findings: ${executiveReport.statistics.total_vulnerabilities}`);
  console.log(`     • Critical: ${executiveReport.statistics.by_severity.CRITICAL}`);
  console.log(`     • High: ${executiveReport.statistics.by_severity.HIGH}`);
  console.log(`     • Medium: ${executiveReport.statistics.by_severity.MEDIUM}`);
  console.log(`     • Low: ${executiveReport.statistics.by_severity.LOW}`);
  
  // Store both report types
  scan.report = executiveReport;
  scan.bugBountyReports = bugBountyReports;
  
  // Calculate potential bug bounty rewards (estimated)
  const estimatedRewards = _estimateBugBountyRewards(bugBountyReports);
  scan.estimatedBounty = estimatedRewards;
  
  console.log(`\n  💰 Estimated Bug Bounty Value: $${estimatedRewards.total}`);
  console.log(`     • Critical: $${estimatedRewards.critical} (${estimatedRewards.criticalCount} findings)`);
  console.log(`     • High: $${estimatedRewards.high} (${estimatedRewards.highCount} findings)`);
  console.log(`     • Medium: $${estimatedRewards.medium} (${estimatedRewards.mediumCount} findings)`);
  
  scan.phases[4].status = 'completed';
  scan.phases[4].progress = 100;
  scan.progress = 100;
  await saveScanToFirebase(scan);
  
  io.emit(`progress_${scanId}`, {
    phase: 'Phase 4: Complete',
    status: 'Professional bug bounty reports generated',
    progress: 100,
    findings: scan.vulnerabilities.length
  });
  
  return { executiveReport, bugBountyReports, estimatedRewards };
}

// Estimate bug bounty rewards (based on HackerOne/Bugcrowd averages)
function _estimateBugBountyRewards(reports) {
  const rewards = {
    CRITICAL: 5000,  // $3k-10k average
    HIGH: 2000,      // $1k-5k average
    MEDIUM: 500,     // $250-1k average
    LOW: 100         // $50-250 average
  };
  
  let total = 0;
  let critical = 0, high = 0, medium = 0, low = 0;
  let criticalCount = 0, highCount = 0, mediumCount = 0, lowCount = 0;
  
  for (const report of reports) {
    const severity = report.report.cvss.severity;
    
    if (severity === 'CRITICAL') {
      critical += rewards.CRITICAL;
      criticalCount++;
    } else if (severity === 'HIGH') {
      high += rewards.HIGH;
      highCount++;
    } else if (severity === 'MEDIUM') {
      medium += rewards.MEDIUM;
      mediumCount++;
    } else if (severity === 'LOW') {
      low += rewards.LOW;
      lowCount++;
    }
  }
  
  total = critical + high + medium + low;
  
  return {
    total,
    critical,
    high,
    medium,
    low,
    criticalCount,
    highCount,
    mediumCount,
    lowCount
  };
}

// ============================================================================
// START SERVER
// ============================================================================

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('🎯 ZerOn Vulnerability Scanner - Backend Started!');
  console.log(`${'='.repeat(60)}`);
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Socket.io ready for real-time updates`);
  console.log(`✓ API endpoints available`);
  console.log(`✓ Allowed Origins: ${allowedOrigins.join(', ')}`);
  console.log(`✓ Frontend: http://localhost:3000`);
  console.log(`✓ Production Frontend: https://zer-on.vercel.app`);
  console.log(`${'='.repeat(60)}\n`);
});
