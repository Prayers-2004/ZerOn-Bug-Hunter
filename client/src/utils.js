import config from './config';

/**
 * Format severity level
 */
export const formatSeverity = (severity) => {
  if (!severity) return 'Unknown';
  const formatted = severity.toUpperCase();
  return config.SEVERITY_LEVELS[formatted]?.label || formatted;
};

/**
 * Get severity color
 */
export const getSeverityColor = (severity) => {
  if (!severity) return '#999';
  const formatted = severity.toUpperCase();
  return config.SEVERITY_LEVELS[formatted]?.color || '#999';
};

/**
 * Get severity score
 */
export const getSeverityScore = (severity) => {
  if (!severity) return 0;
  const formatted = severity.toUpperCase();
  return config.SEVERITY_LEVELS[formatted]?.score || 0;
};

/**
 * Format CVSS score
 */
export const formatCVSS = (score) => {
  if (typeof score !== 'number') return 'N/A';
  return score.toFixed(1);
};

/**
 * Validate domain input
 */
export const validateDomain = (input) => {
  const patterns = [
    // Domain regex
    /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    // IP regex (IPv4)
    /^(\d{1,3}\.){3}\d{1,3}$/,
    // CIDR regex
    /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/,
    // Wildcard domain
    /^\*\.([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
  ];

  return patterns.some(pattern => pattern.test(input));
};

/**
 * Parse scope input
 */
export const parseScope = (scopeText) => {
  if (!scopeText) return [];
  
  return scopeText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const isExcluded = line.startsWith('-');
      const target = isExcluded ? line.substring(1).trim() : line;
      
      return {
        target,
        excluded: isExcluded,
        type: getTargetType(target)
      };
    });
};

/**
 * Get target type
 */
export const getTargetType = (target) => {
  if (!target) return 'unknown';
  
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(target)) return 'ipv4';
  
  // CIDR
  if (/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(target)) return 'cidr';
  
  // IPv6
  if (/^[0-9a-fA-F:]+$/.test(target)) return 'ipv6';
  
  // Wildcard domain
  if (target.startsWith('*.')) return 'wildcard_domain';
  
  // Domain
  if (/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(target))
    return 'domain';
  
  // URL
  if (/^https?:\/\//.test(target)) return 'url';
  
  return 'unknown';
};

/**
 * Format timestamp
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp);
  return date.toLocaleString();
};

/**
 * Format duration (milliseconds to readable format)
 */
export const formatDuration = (ms) => {
  if (!ms) return '0s';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

/**
 * Truncate string
 */
export const truncateString = (str, length = 50) => {
  if (!str || str.length <= length) return str;
  return `${str.substring(0, length)}...`;
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = (text) => {
  return navigator.clipboard.writeText(text);
};

/**
 * Download file
 */
export const downloadFile = (content, filename, type = 'text/plain') => {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Escape HTML
 */
export const escapeHtml = (text) => {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Generate random ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get vulnerability icon/emoji
 */
export const getVulnIcon = (type) => {
  const icons = {
    'sql_injection': '💉',
    'xss': '🔗',
    'ssrf': '🌐',
    'xxe': '📄',
    'path_traversal': '📁',
    'rce': '⚡',
    'lfi': '📂',
    'csrf': '🎫',
    'auth_bypass': '🔓',
    'privilege_escalation': '👑',
    'info_disclosure': '👀',
    'dos': '💥',
    'broken_auth': '🔑'
  };
  
  return icons[type] || '🔍';
};

/**
 * Calculate severity distribution
 */
export const calculateSeverityStats = (vulnerabilities) => {
  const stats = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    total: vulnerabilities.length
  };

  vulnerabilities.forEach(vuln => {
    const severity = (vuln.severity || 'info').toLowerCase();
    if (stats[severity] !== undefined) {
      stats[severity]++;
    }
  });

  return stats;
};

/**
 * Filter vulnerabilities
 */
export const filterVulnerabilities = (vulnerabilities, filters) => {
  let filtered = [...vulnerabilities];

  if (filters.severity && filters.severity !== 'all') {
    filtered = filtered.filter(v => 
      (v.severity || 'info').toLowerCase() === filters.severity.toLowerCase()
    );
  }

  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter(v => 
      v.type === filters.type
    );
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(v => 
      v.name?.toLowerCase().includes(searchLower) ||
      v.description?.toLowerCase().includes(searchLower) ||
      v.parameter?.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
};

/**
 * Sort vulnerabilities
 */
export const sortVulnerabilities = (vulnerabilities, sortBy = 'severity') => {
  const sorted = [...vulnerabilities];

  switch (sortBy) {
    case 'severity':
      sorted.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        const aScore = severityOrder[(a.severity || 'info').toLowerCase()] ?? 5;
        const bScore = severityOrder[(b.severity || 'info').toLowerCase()] ?? 5;
        return aScore - bScore;
      });
      break;

    case 'name':
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;

    case 'date':
      sorted.sort((a, b) => 
        new Date(b.foundAt || 0) - new Date(a.foundAt || 0)
      );
      break;

    default:
      break;
  }

  return sorted;
};
