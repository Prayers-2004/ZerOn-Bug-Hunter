# ZerOn API Documentation

Complete API reference for the ZerOn vulnerability scanner.

## Base URL

```
http://localhost:5000
```

## Authentication

Currently, ZerOn supports JWT-based authentication (optional for local deployment).

### Getting a Token
```bash
# Add token to request headers
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Health Check

**Endpoint:** `GET /api/health`

**Description:** Check server health status

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "environment": "development"
}
```

---

### Get Plans

**Endpoint:** `GET /api/plans`

**Description:** Get available subscription plans

**Response:**
```json
{
  "plans": [
    {
      "id": "basic",
      "name": "Basic",
      "price": "Free",
      "endpoints": 10,
      "payloads": 100,
      "features": [
        "Up to 10 target endpoints",
        "100 payloads per endpoint",
        "Basic vulnerability detection",
        "HTML Report generation",
        "Email support"
      ]
    },
    {
      "id": "pro",
      "name": "Pro",
      "price": "$99/month",
      "endpoints": 100,
      "payloads": 1000,
      "features": [...]
    },
    {
      "id": "enterprise",
      "name": "Enterprise",
      "price": "$999/month",
      "endpoints": 1000,
      "payloads": 5000,
      "features": [...]
    }
  ]
}
```

---

### Start Scan

**Endpoint:** `POST /api/scan/start`

**Description:** Initiate a new vulnerability scan

**Request Body:**
```json
{
  "domain": "example.com",
  "plan": "pro",
  "scope": [
    "example.com",
    "api.example.com",
    "*.example.com",
    "-internal.example.com"
  ]
}
```

**Parameters:**
- `domain` (string, required): Target domain to scan
- `plan` (string, required): Subscription plan (basic, pro, enterprise)
- `scope` (array, optional): Additional scope targets
  - Prefix with `-` to exclude targets

**Response:**
```json
{
  "scanId": "scan_1705316400000_abc123",
  "status": "started",
  "domain": "example.com",
  "plan": "pro",
  "progress": 0,
  "createdAt": "2024-01-15T10:30:00Z",
  "estimatedDuration": 1800000
}
```

**Status Codes:**
- `201`: Scan created successfully
- `400`: Invalid domain or plan
- `429`: Too many concurrent scans (rate limited)
- `500`: Server error

---

### Get Scan Status

**Endpoint:** `GET /api/scan/{scanId}/status`

**Description:** Get real-time status of an ongoing scan

**Parameters:**
- `scanId` (string, required): Unique scan identifier

**Response:**
```json
{
  "scanId": "scan_1705316400000_abc123",
  "status": "scanning",
  "progress": 45,
  "currentPhase": {
    "id": 2,
    "name": "Attack Surface Expansion",
    "status": "in_progress",
    "progress": 60
  },
  "phases": [
    {
      "id": 0,
      "name": "Scope Ingestion",
      "status": "completed",
      "progress": 100,
      "duration": 1200
    },
    {
      "id": 1,
      "name": "Discovery",
      "status": "completed",
      "progress": 100,
      "duration": 5400
    },
    {
      "id": 2,
      "name": "Attack Surface Expansion",
      "status": "in_progress",
      "progress": 60,
      "duration": 3200
    },
    {
      "id": 3,
      "name": "Exploitation",
      "status": "pending",
      "progress": 0,
      "duration": 0
    },
    {
      "id": 4,
      "name": "Reporting",
      "status": "pending",
      "progress": 0,
      "duration": 0
    }
  ],
  "findingsCount": {
    "total": 12,
    "critical": 2,
    "high": 4,
    "medium": 4,
    "low": 2,
    "info": 0
  },
  "updatedAt": "2024-01-15T10:45:00Z"
}
```

**Real-Time Updates via Socket.io:**
```javascript
socket.on(`progress_${scanId}`, (data) => {
  console.log(data);
  // {
  //   phase: "Phase 2: Attack Surface Expansion",
  //   status: "Scanning parameter: id",
  //   progress: 45,
  //   findings: 12
  // }
});
```

---

### Get Scan Results

**Endpoint:** `GET /api/scan/{scanId}/results`

**Description:** Get complete scan results and vulnerabilities

**Parameters:**
- `scanId` (string, required): Unique scan identifier
- `filter` (string, optional): Filter by severity (critical, high, medium, low, info)
- `sort` (string, optional): Sort by (severity, date, type)

**Query Examples:**
```
GET /api/scan/scan_123/results?filter=critical&sort=severity
GET /api/scan/scan_123/results?filter=high,medium
```

**Response:**
```json
{
  "scanId": "scan_1705316400000_abc123",
  "domain": "example.com",
  "status": "completed",
  "startTime": "2024-01-15T10:30:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "duration": 1800,
  "vulnerabilities": [
    {
      "id": "vuln_001",
      "type": "SQL Injection",
      "severity": "critical",
      "cvss": 9.8,
      "cwe": "CWE-89",
      "endpoint": "/api/users",
      "parameter": "id",
      "description": "SQL injection vulnerability in user ID parameter",
      "payload": "1' OR '1'='1",
      "response": {
        "statusCode": 200,
        "body": "..."
      },
      "poc": {
        "curl": "curl 'http://example.com/api/users?id=1%27%20OR%20%271%27=%271'",
        "python": "import requests\nresponse = requests.get('http://example.com/api/users?id=1\\' OR \\'1\\'=\\'1')",
        "javascript": "fetch('http://example.com/api/users?id=1%27%20OR%20%271%27=%271')"
      },
      "remediation": "...",
      "foundAt": "2024-01-15T10:45:30Z"
    },
    {
      "id": "vuln_002",
      "type": "Reflected XSS",
      "severity": "high",
      "cvss": 7.5,
      "cwe": "CWE-79",
      "endpoint": "/search",
      "parameter": "q",
      "description": "Reflected XSS in search query parameter",
      "payload": "<img src=x onerror=alert('XSS')>",
      "response": {
        "statusCode": 200,
        "body": "..."
      },
      "poc": {...},
      "remediation": "...",
      "foundAt": "2024-01-15T10:52:15Z"
    }
  ],
  "statistics": {
    "totalVulnerabilities": 12,
    "byType": {
      "SQL Injection": 2,
      "XSS": 4,
      "SSRF": 1,
      "Others": 5
    },
    "bySeverity": {
      "critical": 2,
      "high": 4,
      "medium": 4,
      "low": 2,
      "info": 0
    },
    "avgCVSS": 6.8,
    "falsePositives": 1
  },
  "reportUrl": "https://storage.example.com/reports/scan_123.html"
}
```

**Vulnerability Object Properties:**
- `id`: Unique vulnerability identifier
- `type`: Vulnerability type
- `severity`: CRITICAL, HIGH, MEDIUM, LOW, or INFO
- `cvss`: CVSS v3.1 score (0-10)
- `cwe`: Common Weakness Enumeration ID
- `endpoint`: Affected URL endpoint
- `parameter`: Vulnerable parameter name
- `description`: Human-readable description
- `payload`: Actual payload used for detection
- `response`: Server response details
- `poc`: Proof of Concept in multiple languages
- `remediation`: Suggested fix
- `foundAt`: Timestamp when vulnerability was discovered

---

### Get Remediation Suggestions

**Endpoint:** `POST /api/remediation/suggest`

**Description:** Get AI-powered remediation suggestions using Gemini

**Request Body:**
```json
{
  "vulnerability": {
    "type": "SQL Injection",
    "endpoint": "/api/users",
    "parameter": "id",
    "description": "SQL injection in user ID parameter",
    "payload": "1' OR '1'='1",
    "severity": "critical"
  }
}
```

**Response:**
```json
{
  "vulnerability": {
    "type": "SQL Injection",
    "endpoint": "/api/users",
    "parameter": "id"
  },
  "analysis": "SQL injection occurs when user input is directly concatenated into SQL queries without proper sanitization...",
  "recommendations": [
    "Use prepared statements with parameterized queries",
    "Implement input validation and sanitization",
    "Use ORM frameworks that handle escaping automatically",
    "Apply principle of least privilege to database user accounts",
    "Enable query logging and monitoring"
  ],
  "codeExample": {
    "language": "javascript",
    "vulnerable": "const query = `SELECT * FROM users WHERE id = ${userId}`;",
    "secure": "const query = 'SELECT * FROM users WHERE id = ?';\ndb.query(query, [userId]);"
  },
  "cvssVector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
  "references": [
    "https://owasp.org/www-community/attacks/SQL_Injection",
    "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html"
  ]
}
```

---

### Export to Bug Bounty Platform

**Endpoint:** `POST /api/export/bug-bounty`

**Description:** Export vulnerabilities to bug-bounty platforms

**Request Body:**
```json
{
  "scanId": "scan_1705316400000_abc123",
  "platform": "hackerone",
  "vulnerabilities": [
    {
      "id": "vuln_001",
      "type": "SQL Injection",
      "severity": "critical",
      "cvss": 9.8,
      "description": "...",
      "endpoint": "/api/users",
      "parameter": "id"
    }
  ]
}
```

**Supported Platforms:**
- `hackerone`: HackerOne
- `bugcrowd`: Bugcrowd
- `intigriti`: Intigriti
- `synack`: Synack

**Response:**
```json
{
  "status": "exported",
  "platform": "hackerone",
  "reportCount": 1,
  "url": "https://hackerone.com/reports/123456",
  "format": {
    "title": "[CRITICAL] SQL Injection in /api/users",
    "description": "...",
    "severity": "critical",
    "cwe": "CWE-89",
    "cvss": 9.8,
    "poc": "..."
  }
}
```

**Export Formats:**

**HackerOne:**
```json
{
  "title": "[CRITICAL] SQL Injection in /api/users",
  "description": "Detailed description...",
  "severity": "critical",
  "cwe": 89,
  "cvss": 9.8,
  "poc": "curl 'http://...'",
  "impact": "Attackers can read, modify, or delete database records"
}
```

**Bugcrowd:**
```json
{
  "title": "[Critical] SQL Injection",
  "description": "...",
  "vulnerability_type": "SQL Injection",
  "priority": "critical",
  "cvss": 9.8,
  "proof": "..."
}
```

**Intigriti:**
```json
{
  "title": "SQL Injection in /api/users",
  "description": "...",
  "severity": "critical",
  "cwe_id": 89,
  "cvss_vector": "CVSS:3.1/AV:N/AC:L/...",
  "proof_of_concept": "..."
}
```

---

## Socket.io Events

Real-time communication for scan progress updates.

### Join Scan Room
```javascript
socket.emit('join_scan', { scanId: 'scan_123' });
```

### Leave Scan Room
```javascript
socket.emit('leave_scan', { scanId: 'scan_123' });
```

### Listen for Progress
```javascript
socket.on(`progress_${scanId}`, (data) => {
  console.log('Phase:', data.phase);
  console.log('Status:', data.status);
  console.log('Progress:', data.progress);
  console.log('Findings:', data.findings);
});
```

### Progress Update Format
```json
{
  "phase": "Phase 2: Attack Surface Expansion",
  "status": "Testing parameter: id",
  "progress": 45,
  "findings": 12,
  "timestamp": "2024-01-15T10:45:00Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid domain",
  "message": "Domain format is invalid",
  "statusCode": 400
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token",
  "statusCode": 401
}
```

### 404 Not Found
```json
{
  "error": "Scan not found",
  "message": "Scan with ID 'scan_123' does not exist",
  "statusCode": 404
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limited",
  "message": "Too many concurrent scans. Maximum 5 scans per plan.",
  "statusCode": 429,
  "retryAfter": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later.",
  "statusCode": 500,
  "requestId": "req_123456"
}
```

---

## Rate Limits

Plan-based rate limiting:

| Plan | Concurrent Scans | Endpoints | Payloads/Endpoint |
|------|------------------|-----------|------------------|
| Basic | 1 | 10 | 100 |
| Pro | 5 | 100 | 1000 |
| Enterprise | 20 | 1000 | 5000 |

---

## Pagination

For large result sets:

```bash
GET /api/scan/{scanId}/results?page=1&limit=50&sort=severity&order=desc
```

**Query Parameters:**
- `page` (integer): Page number (1-indexed)
- `limit` (integer): Results per page (1-100)
- `sort` (string): Sort field (severity, date, type)
- `order` (string): Sort order (asc, desc)

---

## Example Usage

### Using cURL

```bash
# Start a scan
curl -X POST http://localhost:5000/api/scan/start \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "plan": "pro",
    "scope": ["example.com", "*.api.example.com"]
  }'

# Get status
curl http://localhost:5000/api/scan/scan_123/status

# Get results
curl http://localhost:5000/api/scan/scan_123/results?filter=critical

# Get remediation
curl -X POST http://localhost:5000/api/remediation/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "vulnerability": {
      "type": "SQL Injection",
      "endpoint": "/api/users",
      "parameter": "id",
      "severity": "critical"
    }
  }'
```

### Using JavaScript/Node.js

```javascript
import api from './api';

// Start scan
const { data: scan } = await api.startScan('example.com', 'pro', ['example.com']);

// Poll for status
const { data: status } = await api.getScanStatus(scan.scanId);

// Get results
const { data: results } = await api.getScanResults(scan.scanId);

// Get remediation
const { data: remediation } = await api.getRemediation(results.vulnerabilities[0]);

// Export to bug-bounty
const { data: exported } = await api.exportToBugBounty(
  scan.scanId,
  'hackerone',
  results.vulnerabilities
);
```

### Using Python

```python
import requests
import time

BASE_URL = 'http://localhost:5000'

# Start scan
response = requests.post(f'{BASE_URL}/api/scan/start', json={
    'domain': 'example.com',
    'plan': 'pro',
    'scope': ['example.com']
})
scan_id = response.json()['scanId']

# Poll for status
while True:
    status = requests.get(f'{BASE_URL}/api/scan/{scan_id}/status').json()
    print(f"Progress: {status['progress']}%")
    if status['status'] == 'completed':
        break
    time.sleep(5)

# Get results
results = requests.get(f'{BASE_URL}/api/scan/{scan_id}/results').json()
print(f"Found {len(results['vulnerabilities'])} vulnerabilities")
```

---

For more information, see the main README.md and SETUP.md files.
