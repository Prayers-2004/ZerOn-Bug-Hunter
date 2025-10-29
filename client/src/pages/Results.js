import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import VulnerabilityList from '../components/VulnerabilityList';
import RemediationPanel from '../components/RemediationPanel';
import PocExporter from '../components/PocExporter';
import '../styles/Results.css';

function Results() {
  const { scanId } = useParams();
  const [results, setResults] = useState(null);
  const [selectedVuln, setSelectedVuln] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId]);

  const fetchResults = async () => {
    try {
      const response = await api.getScanResults(scanId);
      setResults(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching results:', error);
      setLoading(false);
    }
  };

  const handleExport = async (platform) => {
    try {
      const response = await api.exportToBugBounty(
        scanId, 
        platform, 
        results.vulnerabilities
      );

      // Download or display based on platform
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `zeron_report_${platform}.json`;
      link.click();
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading results...</div>;
  }

  if (!results) {
    return <div className="error">No results available</div>;
  }

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>Scan Results</h1>
        <div className="header-actions">
          <PocExporter vulnerabilities={results.vulnerabilities} />
          <div className="export-buttons">
            <button onClick={() => handleExport('hackerone')}>Export to HackerOne</button>
            <button onClick={() => handleExport('bugcrowd')}>Export to Bugcrowd</button>
            <button onClick={() => handleExport('intigriti')}>Export to Intigriti</button>
          </div>
        </div>
      </div>

      <div className="results-grid">
        <div className="vulnerabilities-panel">
          <VulnerabilityList
            vulnerabilities={results.vulnerabilities}
            onSelectVuln={setSelectedVuln}
            selectedVuln={selectedVuln}
          />
        </div>

        <div className="remediation-panel-wrapper">
          {selectedVuln && (
            <RemediationPanel vulnerability={selectedVuln} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Results;
