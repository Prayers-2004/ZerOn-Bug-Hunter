import React from 'react';
import '../styles/ProgressDisplay.css';

function ProgressDisplay({ progress, phase, status, findingsCount }) {
  const phaseSteps = [
    'Phase 0: Scope',
    'Phase 1: Discovery',
    'Phase 2: Parameters',
    'Phase 3: Testing',
    'Phase 4: Reporting'
  ];

  const currentPhaseIndex = phaseSteps.findIndex(p =>
    p.toLowerCase().includes(phase.toLowerCase())
  );

  return (
    <div className="progress-display">
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="progress-text">{progress}%</p>
      </div>

      <div className="phase-indicator">
        <p className="phase">{phase}</p>
        <p className="status">{status}</p>
      </div>

      <div className="phases-timeline">
        {phaseSteps.map((step, index) => (
          <div
            key={index}
            className={`phase-step ${
              index <= currentPhaseIndex ? 'completed' : ''
            } ${index === currentPhaseIndex ? 'current' : ''}`}
          >
            <div className="step-dot" />
            <p className="step-label">{step.split(':')[1]}</p>
          </div>
        ))}
      </div>

      <div className="findings-count">
        <h3>Vulnerabilities Discovered: {findingsCount}</h3>
      </div>
    </div>
  );
}

export default ProgressDisplay;
