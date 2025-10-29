// Phase 3: Response Analyzer - Parse responses for vulnerability indicators
class ResponseAnalyzer {
  /**
   * Analyze response for vulnerability indicators
   */
  static analyzeResponse(response, payload, vulnType) {
    const analysis = {
      vulnerable: false,
      indicators: [],
      confidence: 0,
      details: {}
    };

    switch (vulnType) {
      case 'SQLi':
        analysis.vulnerable = this._analyzeSQLiResponse(response, analysis);
        break;
      case 'XSS':
        analysis.vulnerable = this._analyzeXSSResponse(response, payload, analysis);
        break;
      case 'SSRF':
        analysis.vulnerable = this._analyzeSSRFResponse(response, analysis);
        break;
      case 'PathTraversal':
        analysis.vulnerable = this._analyzePathTraversalResponse(response, analysis);
        break;
      case 'RCE':
        analysis.vulnerable = this._analyzeRCEResponse(response, analysis);
        break;
      case 'XXE':
        analysis.vulnerable = this._analyzeXXEResponse(response, analysis);
        break;
      case 'LFI':
        analysis.vulnerable = this._analyzeLFIResponse(response, analysis);
        break;
      default:
        analysis.vulnerable = this._analyzeGenericResponse(response, analysis);
    }

    // Calculate confidence based on indicators
    analysis.confidence = Math.min(analysis.indicators.length * 25, 100);

    return analysis;
  }

  /**
   * Analyze SQLi response
   */
  static _analyzeSQLiResponse(response, analysis) {
    const data = response.data || '';
    const sqlErrors = [
      'SQL error', 'syntax error', 'mysql_error', 'PostgreSQL error',
      'ORA-', 'Syntax error in SQL', 'SQL Server', 'Unclosed quotation mark',
      'You have an error in your SQL'
    ];

    for (const error of sqlErrors) {
      if (data.toLowerCase().includes(error.toLowerCase())) {
        analysis.indicators.push(`Found SQL error: ${error}`);
        return true;
      }
    }

    // Check for timing-based indicators
    if (response.timing && response.timing > 5000) {
      analysis.indicators.push('Response took unusually long');
    }

    return analysis.indicators.length > 0;
  }

  /**
   * Analyze XSS response
   */
  static _analyzeXSSResponse(response, payload, analysis) {
    const data = response.data || '';

    // Check if payload is reflected without sanitization
    if (data.includes(payload.payload)) {
      analysis.indicators.push('Payload reflected in response');
      return true;
    }

    // Check for HTML entities encoding
    const encoded = this._htmlEncode(payload.payload);
    if (data.includes(encoded)) {
      analysis.indicators.push('Payload was HTML encoded (likely safe)');
      return false;
    }

    return false;
  }

  /**
   * Analyze SSRF response
   */
  static _analyzeSSRFResponse(response, analysis) {
    const data = response.data || '';
    const localIndicators = [
      'localhost', '127.0.0.1', '192.168.', '10.0.', '172.16.',
      'admin panel', 'internal', 'metadata'
    ];

    for (const indicator of localIndicators) {
      if (data.toLowerCase().includes(indicator.toLowerCase())) {
        analysis.indicators.push(`Detected local content: ${indicator}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Analyze Path Traversal response
   */
  static _analyzePathTraversalResponse(response, analysis) {
    const data = response.data || '';
    const fileIndicators = [
      'root:', 'daemon:', 'bin:', 'sys:', // /etc/passwd indicators
      '[boot loader]', '[operating system]', // win.ini indicators
      '<?php', '<?xml', 'BEGIN RSA PRIVATE KEY' // File content indicators
    ];

    for (const indicator of fileIndicators) {
      if (data.includes(indicator)) {
        analysis.indicators.push(`Detected file content: ${indicator}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Analyze RCE response
   */
  static _analyzeRCEResponse(response, analysis) {
    const data = response.data || '';
    const rceIndicators = [
      'uid=', 'gid=', 'groups=', 'root', 'www-data',
      'C:\\\\', 'Windows\\\\System32'
    ];

    for (const indicator of rceIndicators) {
      if (data.includes(indicator)) {
        analysis.indicators.push(`Detected command output: ${indicator}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Analyze XXE response
   */
  static _analyzeXXEResponse(response, analysis) {
    const data = response.data || '';
    const xxeIndicators = [
      'root:', 'DOCTYPE', 'ENTITY', 'SYSTEM',
      'XML parsing error', 'XXE'
    ];

    for (const indicator of xxeIndicators) {
      if (data.includes(indicator)) {
        analysis.indicators.push(`Detected XXE indicator: ${indicator}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Analyze LFI response
   */
  static _analyzeLFIResponse(response, analysis) {
    return this._analyzePathTraversalResponse(response, analysis);
  }

  /**
   * Generic response analysis
   */
  static _analyzeGenericResponse(response, analysis) {
    if (response.status && (response.status < 400 || response.status === 403)) {
      analysis.indicators.push('Unexpected response behavior');
      return true;
    }
    return false;
  }

  /**
   * Check for false positives
   */
  static detectFalsePositives(response, vulnType) {
    const data = response.data || '';
    const falsePositiveIndicators = {
      'SQLi': ['SQL tutorial', 'Learn SQL', 'SQL syntax'],
      'XSS': ['XSS protection', 'CSP', 'X-XSS-Protection'],
      'PathTraversal': ['documentation', 'help', 'learning'],
      'RCE': ['example uid=', 'documentation']
    };

    const indicators = falsePositiveIndicators[vulnType] || [];
    for (const indicator of indicators) {
      if (data.toLowerCase().includes(indicator.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract useful data from response
   */
  static extractData(response, extractionPatterns = null) {
    const data = response.data || '';
    const extracted = [];

    if (!extractionPatterns) {
      extractionPatterns = [
        /api[_-]?key\s*[:=]\s*['"]?([^'"}\n]+)/gi,
        /password\s*[:=]\s*['"]?([^'"}\n]+)/gi,
        /token\s*[:=]\s*['"]?([^'"}\n]+)/gi,
        /secret\s*[:=]\s*['"]?([^'"}\n]+)/gi
      ];
    }

    extractionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(data)) !== null) {
        extracted.push(match[1]);
      }
    });

    return extracted;
  }

  /**
   * Helper: HTML encode
   */
  static _htmlEncode(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Analyze response headers for security issues
   */
  static analyzeSecurityHeaders(headers) {
    const issues = [];
    const requiredHeaders = {
      'Content-Security-Policy': 'CSP Header missing',
      'X-Content-Type-Options': 'X-Content-Type-Options missing',
      'X-Frame-Options': 'X-Frame-Options missing (clickjacking risk)',
      'Strict-Transport-Security': 'HSTS Header missing'
    };

    Object.entries(requiredHeaders).forEach(([header, issue]) => {
      if (!headers[header.toLowerCase()]) {
        issues.push(issue);
      }
    });

    return issues;
  }
}

module.exports = ResponseAnalyzer;
