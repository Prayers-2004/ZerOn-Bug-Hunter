import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import PlanSelector from '../components/PlanSelector';
import ScopeInput from '../components/ScopeInput';
import '../styles/Home.css';

function Home() {
  const navigate = useNavigate();
  const [domain, setDomain] = useState('');
  const [plan, setPlan] = useState('pro');
  const [scope, setScope] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartScan = async () => {
    if (!domain) {
      setError('Please enter a domain');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.startScan(domain, plan, scope);

      if (response.data.scanId) {
        navigate(`/scan/${response.data.scanId}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error starting scan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>ZerOn</h1>
        <p className="subtitle">Advanced Vulnerability Scanner & Bug Bounty Platform</p>
        <p className="description">
          Automated security assessment with AI-powered insights
        </p>
      </div>

      <div className="scan-section">
        <div className="input-group">
          <h2>Start Your Security Scan</h2>
          
          <div className="form-group">
            <label htmlFor="domain">Target Domain *</label>
            <input
              type="text"
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="domain-input"
            />
          </div>

          <PlanSelector selectedPlan={plan} onPlanChange={setPlan} />

          <ScopeInput value={scope} onChange={setScope} />

          {error && <div className="error-message">{error}</div>}

          <button
            onClick={handleStartScan}
            disabled={loading}
            className="start-scan-btn"
          >
            {loading ? 'Starting Scan...' : 'Start Security Scan'}
          </button>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <h3>🔍 Deep Reconnaissance</h3>
            <p>Subdomain enumeration, endpoint discovery, technology fingerprinting</p>
          </div>
          <div className="feature-card">
            <h3>⚔️ Comprehensive Testing</h3>
            <p>SQLi, XSS, SSRF, RCE, and 8+ more vulnerability types</p>
          </div>
          <div className="feature-card">
            <h3>🤖 AI-Powered Analysis</h3>
            <p>Gemini integration for intelligent remediation suggestions</p>
          </div>
          <div className="feature-card">
            <h3>📊 Real-time Dashboard</h3>
            <p>Live progress tracking and detailed vulnerability metrics</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
