import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import config from '../config';
import ProgressDisplay from '../components/ProgressDisplay';
import '../styles/ScanDashboard.css';

function ScanDashboard() {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('Initializing...');
  const [status, setStatus] = useState('Starting scan');
  const [socket, setSocket] = useState(null);
  const [findings, setFindings] = useState([]);

  useEffect(() => {
    const newSocket = io(config.SOCKET_URL);
    setSocket(newSocket);

    newSocket.emit('join_scan', { scanId });

    const progressHandler = (data) => {
      setPhase(data.phase);
      setStatus(data.status);
      setProgress(data.progress || 0);

      if (data.findings) {
        setFindings(data.findings);
      }

      if (data.progress === 100) {
        setTimeout(() => {
          navigate(`/results/${scanId}`);
        }, 2000);
      }
    };

    newSocket.on(`progress_${scanId}`, progressHandler);

    return () => {
      newSocket.off(`progress_${scanId}`, progressHandler);
      newSocket.disconnect();
    };
  }, [scanId, navigate]);

  return (
    <div className="scan-dashboard">
      <div className="dashboard-container">
        <h1>Security Scan in Progress</h1>
        <p className="scan-id">Scan ID: {scanId}</p>

        <ProgressDisplay
          progress={progress}
          phase={phase}
          status={status}
          findingsCount={findings.length}
        />

        <div className="findings-preview">
          <h2>Vulnerabilities Found: {findings.length}</h2>
          {findings.length > 0 && (
            <div className="findings-list">
              {findings.slice(0, 5).map((finding, index) => (
                <div key={index} className="finding-item">
                  <span className={`severity ${finding.severity?.severity?.toLowerCase()}`}>
                    {finding.severity?.severity}
                  </span>
                  <span className="type">{finding.type}</span>
                  <span className="endpoint">{finding.endpoint}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScanDashboard;
