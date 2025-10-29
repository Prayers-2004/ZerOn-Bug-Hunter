import React from 'react';
import '../styles/ScopeInput.css';

function ScopeInput({ value, onChange }) {
  return (
    <div className="scope-input-group">
      <label htmlFor="scope">
        Scope (Optional)
        <span className="hint">
          Add domains, IPs, CIDR ranges. Use '-' prefix to exclude.
        </span>
      </label>
      <textarea
        id="scope"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="example.com
*.api.example.com
192.168.1.0/24
- internal.example.com"
        className="scope-textarea"
        rows="6"
      />
      <p className="scope-help">
        Format:
        <br />• Domains: example.com, *.api.example.com
        <br />• IPs: 192.168.1.1
        <br />• CIDR: 192.168.0.0/16
        <br />• Exclude: - domain.com
      </p>
    </div>
  );
}

export default ScopeInput;
