import axios from 'axios';
import config from './config';

const apiClient = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.TIMEOUTS.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor
apiClient.interceptors.request.use(
  request => {
    const token = localStorage.getItem('authToken');
    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
    }
    return request;
  },
  error => Promise.reject(error)
);

// Add response interceptor
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// API Methods
const api = {
  // Scans
  startScan: (domain, plan, scope) =>
    apiClient.post('/api/scan/start', { domain, plan, scope }),
  
  getScanStatus: (scanId) =>
    apiClient.get(`/api/scan/${scanId}/status`),
  
  getScanResults: (scanId) =>
    apiClient.get(`/api/scan/${scanId}/results`),
  
  // Remediation
  getRemediation: (vulnerability) =>
    apiClient.post('/api/remediation/suggest', { vulnerability }),
  
  // Export
  exportToBugBounty: (scanId, platform, vulnerabilities) =>
    apiClient.post('/api/export/bug-bounty', { 
      scanId, 
      platform, 
      vulnerabilities 
    }),
  
  // Plans
  getPlans: () =>
    apiClient.get('/api/plans'),
  
  // Health Check
  healthCheck: () =>
    apiClient.get('/api/health')
};

export default api;
