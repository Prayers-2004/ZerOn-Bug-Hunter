# ZerOn - Advanced Vulnerability Scanner

ZerOn is a comprehensive, AI-powered vulnerability scanner with real-time progress tracking, multi-phase scanning, and automated remediation suggestions powered by Google's Gemini API.

## 🚀 Features

### Phase 0: Preparation & Scope Ingestion
- Parse and manage target scopes (domains, IPs, CIDR ranges, subdomains)
- Policy parser for bug-bounty rules
- Subdomain enumeration using DNS brute-force and Certificate Transparency logs
- Asset catalog with priority scoring using SimHash

### Phase 1: Discovery & Mapping
- Web crawler for endpoint enumeration
- Technology fingerprinting (frameworks, versions)
- Authentication flow detection
- API endpoint discovery (REST, GraphQL, SOAP)
- Static code analysis integration

### Phase 2: Attack Surface Expansion
- Parameter discovery engine (extract all user-controlled inputs)
- Parameter classification (sensitive, path-like, search, etc.)
- Vulnerability template library (SQLi, XSS, SSRF, XXE, PathTraversal, RCE, etc.)
- Intelligent payload generation with context awareness

### Phase 3: Exploitation & Validation
- Dynamic payload execution
- Headless browser integration for XSS detection
- Response analysis for vulnerability indicators
- Automated false-positive filtering
- PoC generator with code examples
- CVSS v3.1 severity calculation

### Phase 4: Reporting & Submission
- Professional HTML reports
- Automatic deduplication of findings
- Bug-bounty platform integration (HackerOne, Bugcrowd, Intigriti, Synack)
- Remediation tracking

### Phase 5: Continuous Learning
- Benchmark suite for testing
- Performance metrics tracking
- ML-powered payload optimization

## 📋 Pricing Plans

### Basic (Free)
- 10 Endpoints
- 100 Payloads
- Basic Reports

### Pro ($99/month)
- 100 Endpoints
- 1,000 Payloads
- Real-time Dashboard
- API Access
- Advanced Reports

### Enterprise ($999/month)
- 1,000 Endpoints
- 5,000 Payloads
- Priority Support
- Custom Integration
- Dedicated Analysis

## 🛠️ Installation

### Prerequisites
- Node.js 14+
- npm or yarn
- Python 3.8+ (for some analysis features)
- Firebase account (Firestore access)
- Gemini API key

### Setup

1. **Clone and install dependencies:**
```bash
cd "c:\Prayers\ZerOn Project"
npm install
cd client && npm install && cd ..
```

2. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env`:
```
NODE_ENV=development
PORT=5000
FIREBASE_PROJECT_ID=zeron-6b44c
GEMINI_API_KEY=AIzaSyAwDdHV9jF2PTF96BKjJeqez6OyXJJvko8
JWT_SECRET=your_jwt_secret_key_here
```

3. **Start the server:**
```bash
npm run dev
```

4. **Start the client (in another terminal):**
```bash
cd client
npm start
```

## 📁 Project Structure

```
ZerOn Project/
├── config/
│   └── firebase.js                 # Firebase configuration
├── services/
│   ├── Phase0/
│   │   ├── scopeService.js
│   │   ├── assetCatalog.js
│   │   ├── targetScorer.js
│   │   └── subdomainEnum.js
│   ├── Phase1/
│   │   ├── crawlerService.js
│   │   ├── fingerprintService.js
│   │   ├── apiDiscoveryService.js
│   │   └── staticAnalysisService.js
│   ├── Phase2/
│   │   ├── parameterDiscovery.js
│   │   ├── vulnerabilityTemplates.js
│   │   └── payloadGenerator.js
│   ├── Phase3/
│   │   ├── exploitationEngine.js
│   │   ├── headlessBrowser.js
│   │   ├── responseAnalyzer.js
│   │   ├── validatorEngine.js
│   │   ├── pocGenerator.js
│   │   └── severityCalculator.js
│   ├── Phase4/
│   │   ├── reportGenerator.js
│   │   ├── deduplicationEngine.js
│   │   ├── bugBountyIntegration.js
│   │   └── remediationTracker.js
│   └── geminiIntegration.js
├── server.js                       # Main Express server
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── ScanDashboard.js
│   │   │   └── Results.js
│   │   ├── components/
│   │   │   ├── Navigation.js
│   │   │   ├── PlanSelector.js
│   │   │   ├── ScopeInput.js
│   │   │   ├── ProgressDisplay.js
│   │   │   ├── VulnerabilityList.js
│   │   │   └── RemediationPanel.js
│   │   └── styles/
│   └── package.json
├── package.json
└── README.md
```

## 🔧 API Endpoints

### Scanning
- `POST /api/scan/start` - Start a new security scan
- `GET /api/scan/:scanId/status` - Get scan progress
- `GET /api/scan/:scanId/results` - Get scan results

### Reporting
- `POST /api/remediation/suggest` - Get AI-powered remediation suggestions
- `POST /api/export/bug-bounty` - Export findings for bug-bounty platforms

### System
- `GET /api/health` - Health check
- `GET /api/plans` - Get available plans

## 🔍 Vulnerability Types Detected

1. **SQLi** - SQL Injection
2. **XSS** - Cross-Site Scripting
3. **SSRF** - Server-Side Request Forgery
4. **XXE** - XML External Entity Injection
5. **PathTraversal** - Directory/Path Traversal
6. **RCE** - Remote Code Execution
7. **LFI** - Local File Inclusion
8. **CSRF** - Cross-Site Request Forgery
9. **AuthBypass** - Authentication Bypass
10. **PrivilegeEscalation** - Privilege Escalation
11. **InfoDisclosure** - Information Disclosure
12. **DoS** - Denial of Service
13. **BrokenAuth** - Broken Authentication

## 🤖 AI Integration

ZerOn uses Google's Gemini API to:
- Generate intelligent remediation suggestions
- Provide code-fix examples
- Analyze vulnerability patterns
- Create executive summaries
- Optimize payload generation

## 📊 Real-time Dashboard

The dashboard provides:
- Live progress tracking across all 5 phases
- Real-time vulnerability count
- Severity distribution
- Estimated time remaining
- Phase timeline visualization

## 🐛 Bug Bounty Integrations

Export findings directly to:
- **HackerOne**
- **Bugcrowd**
- **Intigriti**
- **Synack**

Each platform has custom formatting and field mapping.

## 📈 Performance

- **Endpoint Crawling**: Up to 1000 endpoints (Enterprise)
- **Payload Generation**: Up to 5000 custom payloads
- **Concurrent Tests**: Up to 20 parallel requests
- **Deduplication**: Automatic duplicate removal using SimHash
- **Response Time**: < 30 seconds per endpoint (average)

## 🔐 Security Considerations

- All API keys stored in environment variables
- Firebase authentication for data security
- CORS configuration for multi-domain support
- Input validation on all endpoints
- Rate limiting on API endpoints
- Secure session handling with JWT

## 📝 Usage Examples

### Starting a Scan
```bash
curl -X POST http://localhost:5000/api/scan/start \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "plan": "pro",
    "scope": "example.com\n*.api.example.com"
  }'
```

### Getting Remediation Suggestions
```bash
curl -X POST http://localhost:5000/api/remediation/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "vulnerability": {
      "type": "SQLi",
      "endpoint": "/api/users",
      "parameter": "id",
      "severity": "HIGH"
    }
  }'
```

### Exporting to HackerOne
```bash
curl -X POST http://localhost:5000/api/export/bug-bounty \
  -H "Content-Type: application/json" \
  -d '{
    "findings": [...],
    "platform": "hackerone",
    "programInfo": { "programId": "123" }
  }'
```

## 🚀 Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Setup
```bash
# Production
NODE_ENV=production
PORT=5000
# Add other env vars
```

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

## 📞 Support

For support, email support@zeron.dev or visit our website.

## 🎯 Roadmap

- [ ] Machine learning payload optimization
- [ ] Custom authentication plugin support
- [ ] Kubernetes deployment templates
- [ ] Advanced CVSS calculator
- [ ] Community payload library
- [ ] Multi-user collaboration features
- [ ] Enterprise SSO integration
- [ ] GraphQL API
- [ ] Mobile app
- [ ] Compliance reporting (PCI-DSS, HIPAA, etc.)

---

**Built with ❤️ for security professionals and bug hunters**
