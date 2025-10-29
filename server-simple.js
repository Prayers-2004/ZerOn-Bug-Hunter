// ZerOn Backend Server with Firebase Integration
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

// Import Firebase
const { admin, db, auth } = require('./config/firebase');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware
app.use(cors());
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
    environment: process.env.NODE_ENV || 'development'
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

  const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  // Simulate scanning in background
  simulateScan(scanId);
});

// Get Scan Status
app.get('/api/scan/:scanId/status', (req, res) => {
  const { scanId } = req.params;
  const scan = activeScans[scanId];

  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
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
app.get('/api/scan/:scanId/results', (req, res) => {
  const { scanId } = req.params;
  const scan = activeScans[scanId];

  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
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
// SIMULATION FUNCTION
// ============================================================================

function simulateScan(scanId) {
  const scan = activeScans[scanId];
  let phaseIndex = 0;

  const phaseSimulations = [
    {
      name: 'Phase 0: Scope Ingestion',
      duration: 30000,
      vulnerabilities: []
    },
    {
      name: 'Phase 1: Discovery',
      duration: 45000,
      vulnerabilities: [
        { id: 'v1', type: 'Old Framework', severity: 'info', endpoint: '/index.php' }
      ]
    },
    {
      name: 'Phase 2: Attack Surface',
      duration: 40000,
      vulnerabilities: []
    },
    {
      name: 'Phase 3: Exploitation',
      duration: 60000,
      vulnerabilities: [
        {
          id: 'v2',
          type: 'SQL Injection',
          severity: 'critical',
          cvss: 9.8,
          endpoint: '/list.php',
          parameter: 'id',
          description: 'The "id" parameter in list.php is vulnerable to SQL injection attacks',
          payload: "' OR '1'='1"
        },
        {
          id: 'v3',
          type: 'Reflected XSS',
          severity: 'high',
          cvss: 7.5,
          endpoint: '/search.php',
          parameter: 'q',
          description: 'User input is not properly sanitized before being reflected in responses',
          payload: '<script>alert("XSS")</script>'
        },
        {
          id: 'v4',
          type: 'Path Traversal',
          severity: 'high',
          cvss: 7.2,
          endpoint: '/viewfile.php',
          parameter: 'file',
          description: 'Insufficient input validation allows accessing files outside intended directory',
          payload: '../../etc/passwd'
        }
      ]
    },
    {
      name: 'Phase 4: Reporting',
      duration: 20000,
      vulnerabilities: []
    }
  ];

  async function runPhase() {
    if (phaseIndex >= phaseSimulations.length) {
      scan.status = 'completed';
      scan.progress = 100;
      await saveScanToFirebase(scan);
      io.emit(`progress_${scanId}`, {
        phase: 'Complete!',
        status: 'Scan finished',
        progress: 100,
        findings: scan.vulnerabilities.length
      });
      return;
    }

    const phase = phaseSimulations[phaseIndex];
    const scanPhase = scan.phases[phaseIndex];

    scanPhase.status = 'in_progress';
    scan.status = 'scanning';

    // Simulate phase progress
    const startTime = Date.now();
    const interval = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / phase.duration) * 100);

      scanPhase.progress = progress;
      scan.progress = (phaseIndex / phaseSimulations.length) * 100 + (progress / phaseSimulations.length);

      io.emit(`progress_${scanId}`, {
        phase: phase.name,
        status: `Progress: ${Math.floor(progress)}%`,
        progress: Math.floor(scan.progress),
        findings: scan.vulnerabilities.length
      });

      if (progress >= 100) {
        clearInterval(interval);
        scanPhase.status = 'completed';
        scanPhase.progress = 100;

        // Add vulnerabilities from this phase
        scan.vulnerabilities.push(...phase.vulnerabilities);
        
        // Save progress to Firebase
        await saveScanToFirebase(scan);

        phaseIndex++;
        setTimeout(runPhase, 2000); // 2 second delay between phases
      }
    }, 500);
  }

  runPhase();
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
  console.log(`✓ Frontend: http://localhost:3000`);
  console.log(`${'='.repeat(60)}\n`);
});
