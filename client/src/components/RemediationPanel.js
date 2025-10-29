import React, { useState, useEffect } from 'react';
import api from '../api';
import '../styles/RemediationPanel.css';

function RemediationPanel({ vulnerability }) {
  const [remediation, setRemediation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vulnerability) {
      loadRemediation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vulnerability]);

  const loadRemediation = async () => {
    setLoading(true);
    try {
      const response = await api.getRemediation(vulnerability);
      setRemediation(response.data);
    } catch (error) {
      console.error('Error loading remediation:', error);
    }
    setLoading(false);
  };

  if (!vulnerability) {
    return <div className="remediation-panel empty">Select a vulnerability to view details</div>;
  }

  return (
    <div className="remediation-panel">
      <div className="panel-header">
        <h3>Remediation Guide</h3>
        <button className="refresh-btn" onClick={loadRemediation} disabled={loading}>
          🔄
        </button>
      </div>

      <div className="vuln-summary">
        <h4>{vulnerability.type}</h4>
        <p className="endpoint-info">
          <strong>Endpoint:</strong> {vulnerability.endpoint}
        </p>
        <p className="param-info">
          <strong>Parameter:</strong> {vulnerability.parameter}
        </p>
        <p className="score-info">
          <strong>CVSS Score:</strong> {vulnerability.severity?.score}/10
        </p>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Loading remediation suggestions...</p>
          <div className="spinner" />
        </div>
      ) : remediation ? (
        <div className="remediation-content">
          <div className="remediation-text">
            {remediation.remediation ? (
              <div dangerouslySetInnerHTML={{
                __html: remediation.remediation.replace(/\n/g, '<br />')
              }} />
            ) : (
              <p>{remediation.fallbackRemediation}</p>
            )}
          </div>

          <div className="poc-section">
            <h5>Proof of Concept:</h5>
            {vulnerability.proof_of_concept?.codeSnippet?.curl && (
              <div className="code-block">
                <code>
                  {vulnerability.proof_of_concept.codeSnippet.curl}
                </code>
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button className="btn btn-primary">Generate Full Report</button>
            <button className="btn btn-secondary">Export PoC</button>
          </div>
        </div>
      ) : (
        <p>No remediation data available</p>
      )}
    </div>
  );
}

export default RemediationPanel;
