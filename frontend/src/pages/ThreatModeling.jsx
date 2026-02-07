import React, { useState, useMemo } from 'react';
import { Play, FileSearch, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { useAnalysis } from '../context/AnalysisContext';
import { filterByAgent } from '../utils/findingsHelpers';
import { AGENT_NAMES } from '../constants/agents';
import './ThreatModeling.css';

const ThreatModeling = () => {
  const { analysisReport } = useAnalysis();
  const navigate = useNavigate();
  const [selectedIdx, setSelectedIdx] = useState(0);

  const threatFindings = useMemo(() => {
    return filterByAgent(analysisReport?.findings || [], AGENT_NAMES.THREAT_MODELER);
  }, [analysisReport]);

  const selected = threatFindings[selectedIdx];
  const hasData = threatFindings.length > 0;

  const handleExportAnalysis = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Title
    doc.setFontSize(22);
    doc.text("Threat Modeling Analysis", margin, y);
    y += 10;

    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 15;

    // Finding Details
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(selected.finding_type || 'Threat Finding', margin, y);
    y += 8;

    doc.setFontSize(11);
    doc.setTextColor(50);
    doc.text(`Severity: ${(selected.severity || 'MEDIUM').toUpperCase()}`, margin, y);
    y += 6;
    doc.text(`Location: ${selected.location || 'Unknown'}`, margin, y);
    y += 6;
    doc.text(`Confidence: ${selected.confidence ? (selected.confidence * 100).toFixed(0) + '%' : 'N/A'}`, margin, y);
    y += 10;

    // Sections
    const addSection = (title, content) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin, y);
      y += 6;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60);
      const lines = doc.splitTextToSize(content || 'No content provided.', pageWidth - 40);
      doc.text(lines, margin, y);
      y += (lines.length * 4) + 10;
    };

    addSection("Description", selected.description);
    if (selected.suggestion) {
      addSection("Suggested Remediation", selected.suggestion);
    }

    addSection("Additional Context", `Derived From: ${selected.derived_from || 'Direct Analysis'}\nAgent: ${selected.agent_name || 'Threat Modeler'}`);

    doc.save(`Threat_Analysis_${selected.finding_type?.replace(/\s+/g, '_') || 'Finding'}.pdf`);
  };

  if (!hasData) {
    return (
      <div className="page-container full-height">
        <header className="page-header custom-mb">
          <div className="breadcrumb">
            <span className="text-muted">Threat Modeling / Active Scan</span>
            <h1 className="page-title">Threat Modeler Output</h1>
          </div>
        </header>
        <div className="empty-state-card">
          <FileSearch size={48} color="#6e7681" />
          <h3>No Threat Modeling Findings</h3>
          <p>Threat Modeler analyzes architecture and design. Run an analysis with architecture or API spec content.</p>
          <button className="btn-primary" onClick={() => navigate('/add-artifact')}>
            <Play size={16} fill="white" />
            Add Artifact & Run Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container full-height">
      <header className="page-header custom-mb">
        <div className="breadcrumb">
          <span className="text-muted">Threat Modeling / Active Scan</span>
          <h1 className="page-title">Threat Modeler — {threatFindings.length} findings</h1>
        </div>
        <button className="btn-primary" onClick={() => navigate('/add-artifact')}>
          <Play size={16} fill="white" />
          Run New Scan
        </button>
      </header>

      <div className="stats-row">
        <div className="stat-box red">
          <div className="stat-label">CRITICAL / HIGH</div>
          <div className="stat-number">
            {threatFindings.filter((f) => ['critical', 'high'].includes((f.severity || '').toLowerCase())).length}
          </div>
        </div>
        <div className="stat-box orange">
          <div className="stat-label">MEDIUM</div>
          <div className="stat-number">
            {threatFindings.filter((f) => (f.severity || '').toLowerCase() === 'medium').length}
          </div>
        </div>
        <div className="stat-box green">
          <div className="stat-label">LOW / INFO</div>
          <div className="stat-number">
            {threatFindings.filter((f) => ['low', 'info'].includes((f.severity || '').toLowerCase())).length}
          </div>
        </div>
      </div>

      <div className="threat-layout">
        <div className="findings-list">
          <h3 className="pane-title">Threat Modeler Findings</h3>
          {threatFindings.map((f, idx) => (
            <div
              key={idx}
              className={`finding-item ${selectedIdx === idx ? 'active' : ''}`}
              onClick={() => setSelectedIdx(idx)}
            >
              <div className="finding-item-header">
                <span className={`badge-${(f.severity || 'medium').toLowerCase()}`}>
                  {(f.severity || 'medium').toUpperCase()}
                </span>
              </div>
              <div className="finding-title">{f.finding_type || 'Threat Finding'}</div>
              <div className="finding-subtitle">{f.location || '—'}</div>
            </div>
          ))}
        </div>

        <div className="finding-detail">
          {selected && (
            <>
              <div className="detail-header">
                <div>
                  <h2 className="detail-title">{selected.finding_type || 'Threat Finding'}</h2>
                  <div className="detail-meta">
                    <span>{(selected.severity || 'medium').toUpperCase()}</span>
                    <span>Location: {selected.location || '—'}</span>
                  </div>
                </div>
              </div>
              <div className="detail-content-grid">
                <div className="analysis-panel" style={{ gridColumn: '1 / -1' }}>
                  <h4 className="panel-heading">THREAT MODELING AGENT ANALYSIS</h4>
                  <div className="analysis-section">
                    <div className="analysis-title">
                      <div className="dot"></div> Description
                    </div>
                    <p>{selected.description}</p>
                  </div>
                  {selected.suggestion && (
                    <div className="analysis-section">
                      <div className="analysis-title">
                        <div className="dot"></div> Suggested Remediation
                      </div>
                      <p>{selected.suggestion}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreatModeling;
