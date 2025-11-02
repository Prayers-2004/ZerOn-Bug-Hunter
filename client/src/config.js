// Frontend configuration

// Determine the API URL based on environment
const getApiUrl = () => {
  // If running on Vercel
  if (window.location.hostname.includes('vercel.app')) {
    // Use environment variable or default backend URL
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }
  
  // If in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }
  
  // Default fallback
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

const config = {
  // API Configuration - Dynamic based on deployment
  API_BASE_URL: getApiUrl(),
  
  // Socket.io Configuration - Same as API URL
  SOCKET_URL: getApiUrl(),
  
  // Allowed origins for the scanner
  ALLOWED_ORIGINS: [
    'http://localhost:3000',
    'https://zer-on.vercel.app'
  ],
  
  // Plans Configuration
  PLANS: {
    basic: {
      name: 'Basic',
      price: 'Free',
      endpoints: 10,
      payloads: 100,
      features: [
        'Up to 10 target endpoints',
        '100 payloads per endpoint',
        'Basic vulnerability detection',
        'HTML Report generation',
        'Email support'
      ],
      tier: 'free'
    },
    pro: {
      name: 'Pro',
      price: '$99/month',
      endpoints: 100,
      payloads: 1000,
      features: [
        'Up to 100 target endpoints',
        '1000 payloads per endpoint',
        'Advanced vulnerability detection',
        'API integrations (HackerOne, Bugcrowd)',
        'Gemini AI remediation',
        'Priority support',
        'Custom scope exclusions'
      ],
      tier: 'pro'
    },
    enterprise: {
      name: 'Enterprise',
      price: '$999/month',
      endpoints: 1000,
      payloads: 5000,
      features: [
        'Unlimited endpoints',
        'Up to 5000 payloads per endpoint',
        'Full vulnerability detection',
        'All bug-bounty platform integrations',
        'Advanced Gemini AI analysis',
        'Multi-user dashboard',
        '24/7 dedicated support',
        'Custom rules and templates',
        'Automated scheduling',
        'Advanced reporting and analytics'
      ],
      tier: 'enterprise'
    }
  },

  // Vulnerability Types
  VULNERABILITY_TYPES: [
    'SQL Injection',
    'XSS (Cross-Site Scripting)',
    'SSRF (Server-Side Request Forgery)',
    'XXE (XML External Entity)',
    'Path Traversal',
    'Remote Code Execution',
    'Local File Inclusion',
    'CSRF (Cross-Site Request Forgery)',
    'Authentication Bypass',
    'Privilege Escalation',
    'Information Disclosure',
    'Denial of Service',
    'Broken Authentication'
  ],

  // Severity Levels
  SEVERITY_LEVELS: {
    CRITICAL: { color: '#d32f2f', label: 'Critical', score: 9.0 },
    HIGH: { color: '#f57c00', label: 'High', score: 7.0 },
    MEDIUM: { color: '#fbc02d', label: 'Medium', score: 5.0 },
    LOW: { color: '#689f38', label: 'Low', score: 3.0 },
    INFO: { color: '#1976d2', label: 'Info', score: 0 }
  },

  // Bug Bounty Platforms
  BUG_BOUNTY_PLATFORMS: [
    { id: 'hackerone', name: 'HackerOne', logo: '🏆' },
    { id: 'bugcrowd', name: 'Bugcrowd', logo: '🔐' },
    { id: 'intigriti', name: 'Intigriti', logo: '🎯' },
    { id: 'synack', name: 'Synack', logo: '⚡' }
  ],

  // Scan Phases
  SCAN_PHASES: [
    { id: 0, name: 'Scope Ingestion', description: 'Parsing and validating targets' },
    { id: 1, name: 'Discovery', description: 'Finding endpoints and technologies' },
    { id: 2, name: 'Surface Expansion', description: 'Identifying attack vectors' },
    { id: 3, name: 'Exploitation', description: 'Testing vulnerabilities' },
    { id: 4, name: 'Reporting', description: 'Generating report and deduplication' }
  ],

  // Timeouts (in milliseconds)
  TIMEOUTS: {
    SCAN_UPDATE: 1000, // Update UI every 1 second
    API_TIMEOUT: 30000, // API request timeout
    SOCKET_TIMEOUT: 5000 // Socket connection timeout
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 100
  }
};

export default config;
