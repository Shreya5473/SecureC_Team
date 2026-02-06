import React, { useState, useMemo } from 'react';
import {
  Settings,
  XCircle,
  FileSearch,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import { filterByAgent } from '../utils/findingsHelpers';
import { AGENT_NAMES } from '../constants/agents';
import './SocAlerts.css';

const SocAlerts = () => {
  const { analysisReport } = useAnalysis();
  const navigate = useNavigate();
  const [selectedIdx, setSelectedIdx] = useState(0);
  // Track resolved state for findings 
  const [resolvedFindings, setResolvedFindings] = useState({});

  const socFindings = useMemo(() => {
    return filterByAgent(analysisReport?.findings || [], AGENT_NAMES.SOC_INTELLIGENCE);
  }, [analysisReport]);

  const selected = socFindings[selectedIdx];
  const hasData = socFindings.length > 0;

  const getSeverityClass = (s) => {
    const sev = (s || 'info').toLowerCase();
    if (sev === 'critical' || sev === 'high') return 'red';
    if (sev === 'medium') return 'orange';
    if (sev === 'low') return 'green';
    return 'blue';
  };

  const markResolved = (idx) => {
    setResolvedFindings(prev => ({
      ...prev,
      [idx]: true
    }));
  };

  if (!hasData) {
    return (
      <div className="page-container full-height-soc">
        <div className="soc-header">
          <div className="breadcrumb">
            <span className="text-muted">Detection & Response / Alerts</span>
            <h1 className="page-title">SOC Intelligence Output</h1>
          </div>
        </div>
        <div className="empty-state-card">
          <FileSearch size={48} color="#6e7681" />
          <h3>No SOC Alerts</h3>
          <p>SOC Intelligence analyzes logs and traffic for incidents. Run an analysis with log/SOC content.</p>
          <button className="btn-primary" onClick={() => navigate('/add-artifact')}>
            Add Artifact & Run Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container full-height-soc">
      <div className="soc-header">
        <div className="breadcrumb">
          <span className="text-muted">Detection & Response / Alerts</span>
          <h1 className="page-title">SOC Intelligence — {socFindings.length} findings</h1>
        </div>
        {/* Buttons removed as requested: Feed Settings, Dismiss All, etc. */}
      </div>

      {socFindings.length > 1 && (
        <div className="ai-insight-banner">
          <div className="banner-content">
            <span className="ai-badge">AI Insight</span>
            <span className="insight-text">
              SOC Intelligence identified {socFindings.length} findings from your log/artifact input.
            </span>
          </div>
        </div>
      )}

      <div className="soc-grid">
        <div className="feed-panel">
          <div className="feed-header">
            <span className="text-muted text-xs font-bold tracking-wider">SOC FINDINGS</span>
          </div>
          {socFindings.map((f, idx) => (
            <div
              key={idx}
              className={`alert-item ${selectedIdx === idx ? 'active' : ''}`}
              onClick={() => setSelectedIdx(idx)}
              style={{ cursor: 'pointer' }}
            >
              <div className="alert-meta-top">
                <div className="flex items-center gap-2">
                  <div className={`status-dot ${getSeverityClass(f.severity)}`}></div>
                  <span className={`severity-text ${getSeverityClass(f.severity)}`}>
                    {(f.severity || 'info').toUpperCase()}
                  </span>
                </div>
                {resolvedFindings[idx] && <span className="text-xs text-green-400 ml-auto">Fixed</span>}
              </div>
              <div className="alert-title">{f.finding_type || 'SOC Finding'}</div>
              <div className="alert-meta-bottom">
                <span className="meta-tag">{f.location || 'Logs'}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="investigation-panel">
          {selected && (
            <>
              <div className="investigation-header">
                <div>
                  <h2 className="investigation-title">{selected.finding_type || 'SOC Finding'}</h2>
                  <div className="flex gap-2 mt-2">
                    <span className={`tag-${getSeverityClass(selected.severity)}`}>
                      {(selected.severity || 'info').toUpperCase()} Severity
                    </span>
                  </div>
                </div>
              </div>
              <div className="incident-analysis-grid">
                <div className="analysis-box">
                  <h4 className="box-title">Why it triggered</h4>
                  <p className="box-content">{selected.description}</p>
                </div>
                {selected.suggestion && (
                  <div className="analysis-box">
                    <h4 className="box-title">Recommended Action</h4>
                    <p className="box-content">{selected.suggestion}</p>
                  </div>
                )}
              </div>
              <div className="investigation-footer">
                {/* Removed View Raw Logs button */}
                <button
                  className={resolvedFindings[selectedIdx] ? "btn-secondary" : "btn-primary"}
                  onClick={() => markResolved(selectedIdx)}
                  disabled={resolvedFindings[selectedIdx]}
                >
                  {resolvedFindings[selectedIdx] ? "Done" : "Mark as Resolved"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocAlerts;
