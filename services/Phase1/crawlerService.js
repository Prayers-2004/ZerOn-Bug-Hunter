// Phase 1: Crawler Service - Enumerate URLs, APIs, endpoints
const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

class CrawlerService {
  constructor() {
    this.visited = new Set();
    this.endpoints = [];
    this.maxDepth = 3;
    this.maxPages = 1000;
  }

  /**
   * Start crawling a target
   */
  async crawl(startUrl, options = {}) {
    this.maxDepth = options.maxDepth || 3;
    this.maxPages = options.maxPages || 1000;
    this.visited.clear();
    this.endpoints = [];

    try {
      await this._crawlRecursive(startUrl, 0);
      return {
        success: true,
        endpointCount: this.endpoints.length,
        endpoints: this.endpoints
      };
    } catch (error) {
      console.error('Crawling error:', error);
      return {
        success: false,
        error: error.message,
        endpoints: this.endpoints
      };
    }
  }

  /**
   * Recursive crawling function
   */
  async _crawlRecursive(url, depth) {
    if (depth > this.maxDepth || this.visited.size >= this.maxPages) {
      return;
    }

    if (this.visited.has(url)) {
      return;
    }

    this.visited.add(url);

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      const links = new Set();

      // Extract all links
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          try {
            const absoluteUrl = new URL(href, url).href;
            const targetHost = new URL(url).hostname;
            const linkHost = new URL(absoluteUrl).hostname;

            // Only crawl same domain
            if (linkHost === targetHost && !this.visited.has(absoluteUrl)) {
              links.add(absoluteUrl);
            }
          } catch (e) {
            // Invalid URL
          }
        }
      });

      // Extract forms and other endpoints
      this._extractEndpoints($, url);

      // Crawl child links
      for (const link of links) {
        await this._crawlRecursive(link, depth + 1);
      }
    } catch (error) {
      console.error(`Error crawling ${url}:`, error.message);
    }
  }

  /**
   * Extract endpoints, forms, and API calls
   */
  _extractEndpoints($, baseUrl) {
    const baseUrlObj = new URL(baseUrl);

    // Extract forms
    $('form').each((_, form) => {
      const action = $(form).attr('action');
      const method = $(form).attr('method') || 'GET';
      const endpoint = new URL(action || '', baseUrl).href;

      this.endpoints.push({
        url: endpoint,
        method: method.toUpperCase(),
        type: 'form',
        inputs: []
      });
    });

    // Extract API calls and scripts
    $('script').each((_, script) => {
      const content = $(script).html();
      if (content) {
        this._extractAPIFromScript(content, baseUrlObj.hostname);
      }
    });

    // Extract data attributes and onclick handlers
    $('[onclick], [data-url], [data-api]').each((_, element) => {
      const onclick = $(element).attr('onclick');
      const dataUrl = $(element).attr('data-url');
      const dataApi = $(element).attr('data-api');

      if (onclick) this._extractFromString(onclick, baseUrlObj.hostname);
      if (dataUrl) this.endpoints.push({ url: dataUrl, type: 'data-attribute' });
      if (dataApi) this.endpoints.push({ url: dataApi, type: 'data-attribute' });
    });
  }

  /**
   * Extract API endpoints from JavaScript
   */
  _extractAPIFromScript(content, hostname) {
    // Pattern: /api/endpoint, /v1/users, etc.
    const apiPattern = /['"](\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*)['"]/g;
    let match;

    while ((match = apiPattern.exec(content)) !== null) {
      const endpoint = match[1];
      if (endpoint.startsWith('/') && endpoint.length > 1) {
        this.endpoints.push({
          url: `https://${hostname}${endpoint}`,
          type: 'api',
          extractedFrom: 'script'
        });
      }
    }

    // Pattern: https://domain/api/...
    const fullUrlPattern = /https?:\/\/[a-zA-Z0-9.-]+[a-zA-Z0-9.-]*\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*/g;
    while ((match = fullUrlPattern.exec(content)) !== null) {
      const url = match[0];
      try {
        const urlObj = new URL(url);
        if (urlObj.hostname === hostname || urlObj.hostname.endsWith(`.${hostname}`)) {
          this.endpoints.push({
            url: url,
            type: 'api',
            extractedFrom: 'script'
          });
        }
      } catch (e) {
        // Invalid URL
      }
    }
  }

  /**
   * Extract URLs from JavaScript string
   */
  _extractFromString(str, hostname) {
    const urlPattern = /['"](\/[^'"]+)['"]/g;
    let match;

    while ((match = urlPattern.exec(str)) !== null) {
      const endpoint = match[1];
      if (endpoint.startsWith('/')) {
        this.endpoints.push({
          url: `https://${hostname}${endpoint}`,
          type: 'extracted'
        });
      }
    }
  }

  /**
   * Remove duplicates and normalize endpoints
   */
  static deduplicateEndpoints(endpoints) {
    const unique = new Map();

    endpoints.forEach(endpoint => {
      const key = `${endpoint.method || 'GET'}:${endpoint.url}`;
      if (!unique.has(key)) {
        unique.set(key, endpoint);
      }
    });

    return Array.from(unique.values());
  }
}

module.exports = CrawlerService;
