// Phase 0: Subdomain Enumeration - DNS brute-force and CT logs
const dns = require('dns').promises;
const axios = require('axios');

class SubdomainEnumerator {
  /**
   * Enumerate subdomains using multiple methods
   */
  static async enumerateSubdomains(domain) {
    const subdomains = new Set();

    try {
      // Method 1: DNS Brute-force
      const bruteForced = await this._dnsBruteForce(domain);
      bruteForced.forEach(sub => subdomains.add(sub));

      // Method 2: Certificate Transparency Logs
      const ctSubdomains = await this._queryCertificateTransparency(domain);
      ctSubdomains.forEach(sub => subdomains.add(sub));

      // Method 3: Common subdomains
      const common = this._getCommonSubdomains(domain);
      common.forEach(sub => subdomains.add(sub));

      return Array.from(subdomains);
    } catch (error) {
      console.error('Error enumerating subdomains:', error);
      return Array.from(subdomains);
    }
  }

  /**
   * DNS brute-force enumeration
   */
  static async _dnsBruteForce(domain, timeout = 5000) {
    const subdomains = [];
    const commonPrefixes = this._getCommonPrefixes();

    for (const prefix of commonPrefixes) {
      const subdomain = `${prefix}.${domain}`;
      try {
        const addresses = await Promise.race([
          dns.resolve4(subdomain),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeout)
          )
        ]);

        if (addresses && addresses.length > 0) {
          subdomains.push(subdomain);
        }
      } catch (error) {
        // DNS resolution failed, continue
      }
    }

    return subdomains;
  }

  /**
   * Query Certificate Transparency logs
   */
  static async _queryCertificateTransparency(domain) {
    const subdomains = [];

    try {
      // Use crt.sh API
      const response = await axios.get(
        `https://crt.sh/?q=%.${domain}&output=json`,
        { timeout: 10000 }
      );

      if (Array.isArray(response.data)) {
        const seen = new Set();
        response.data.forEach(cert => {
          const names = cert.name_value.split('\n');
          names.forEach(name => {
            const clean = name.trim();
            if (clean && !seen.has(clean)) {
              subdomains.push(clean);
              seen.add(clean);
            }
          });
        });
      }
    } catch (error) {
      console.log('CT logs query failed:', error.message);
    }

    return subdomains;
  }

  /**
   * Get common subdomain prefixes for brute-force
   */
  static _getCommonPrefixes() {
    return [
      'www', 'mail', 'smtp', 'pop', 'ns1', 'webmail', 'ns2',
      'cpanel', 'whm', 'autodiscover', 'autoconfig', 'm', 'smtp2',
      'smtpout', 'ftp', 'router', 'vpn', 'test', 'staging',
      'dev', 'admin', 'api', 'api-v1', 'v1', 'v2', 'cdn',
      'img', 'images', 'static', 'assets', 'downloads', 'files',
      'upload', 'portal', 'app', 'apps', 'blog', 'forum',
      'store', 'shop', 'cart', 'order', 'email', 'billing',
      'support', 'help', 'docs', 'docs-api', 'status', 'status-page',
      'monitoring', 'log', 'logs', 'analytics', 'metrics', 'dashboard',
      'db', 'database', 'dbserver', 'mysql', 'postgres', 'redis',
      'cache', 'session', 'secure', 'ssl', 'certificate', 'jenkins',
      'gitlab', 'github', 'bitbucket', 'svn', 'git', 'code',
      'repo', 'repos', 'source', 'backup', 'archive', 'old',
      'legacy', 'beta', 'alpha', 'sandbox', 'demo', 'preview',
      'internal', 'private', 'partner', 'partners', 'client',
      'clients', 'vendor', 'vendors', 'public', 'external'
    ];
  }

  /**
   * Get common subdomains directly
   */
  static _getCommonSubdomains(domain) {
    return this._getCommonPrefixes().map(prefix => `${prefix}.${domain}`);
  }

  /**
   * Verify subdomain is live
   */
  static async verifySubdomain(subdomain) {
    try {
      const addresses = await dns.resolve4(subdomain);
      return {
        subdomain,
        isLive: addresses.length > 0,
        ips: addresses
      };
    } catch (error) {
      return {
        subdomain,
        isLive: false,
        ips: []
      };
    }
  }

  /**
   * Batch verify subdomains
   */
  static async verifySubdomains(subdomains) {
    const results = [];
    for (const subdomain of subdomains) {
      const result = await this.verifySubdomain(subdomain);
      results.push(result);
    }
    return results.filter(r => r.isLive);
  }
}

module.exports = SubdomainEnumerator;
