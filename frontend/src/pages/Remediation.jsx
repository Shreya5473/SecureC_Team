import React, { useState, useMemo } from 'react';
import {
  Download,
  Zap,
  Flame,
  Shield,
  Ticket,
  FileSearch,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { useAnalysis } from '../context/AnalysisContext';
import { filterBySeverity } from '../utils/findingsHelpers';
import './Remediation.css';

const Remediation = () => {
  const { analysisReport } = useAnalysis();
  const navigate = useNavigate();

  // Modal State
  const [showSlackModal, setShowSlackModal] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [slackChannel, setSlackChannel] = useState('#security-alerts');

  const remediationGroups = useMemo(() => {
    if (!analysisReport?.findings?.length) {
      return { quickWins: [], highImpact: [], longTerm: [] };
    }
    const allFindings = analysisReport.findings;
    const high = filterBySeverity(allFindings, ['high', 'critical']);
    const medium = filterBySeverity(allFindings, ['medium']);
    const low = filterBySeverity(allFindings, ['low', 'info']);

    return {
      highImpact: high,
      quickWins: medium,
      longTerm: low,
    };
  }, [analysisReport]);

  const hasData = remediationGroups.highImpact.length > 0 ||
    remediationGroups.quickWins.length > 0 ||
    remediationGroups.longTerm.length > 0;

  const getSlackMessage = (finding) => {
    if (!finding) return '';
    const severity = (finding.severity || 'medium').toUpperCase();
    const severityEmoji = severity === 'CRITICAL' || severity === 'HIGH' ? '🚨' : severity === 'MEDIUM' ? '⚠️' : 'ℹ️';

    return `${severityEmoji} ${severity} Security Finding
${finding.finding_type || 'Security Finding'}

Component: ${finding.location || 'Unknown'}
Action: ${finding.suggestion?.slice(0, 100) || 'Review details in SecureC'}...

🔗 View in SecureC`;
  };

  const handleSendToSlack = async () => {
    if (!selectedFinding) return;

    try {
      const response = await fetch('http://localhost:8000/api/v1/slack/send-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          finding_type: selectedFinding.finding_type || 'Security Finding',
          severity: selectedFinding.severity || 'medium',
          description: selectedFinding.description || 'No description available',
          location: selectedFinding.location,
          suggestion: selectedFinding.suggestion,
          agent_name: selectedFinding.agent_name,
          derived_from: selectedFinding.derived_from,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowSlackModal(false);
        alert('✓ Slack ticket sent successfully to DM!');
      } else {
        throw new Error(data.detail || 'Failed to send Slack ticket');
      }
    } catch (error) {
      console.error('Error sending Slack ticket:', error);
      alert(`✗ Failed to send Slack ticket: ${error.message}`);
    }
  };

  const renderFindingCard = (finding, idx) => (
    <div className="finding-card" key={idx}>
      <div className="finding-main">
        <div className="finding-header">
          <h4>
            {finding.finding_type || 'Security Finding'}{' '}
            <span className={`score ${['critical', 'high'].includes((finding.severity || '').toLowerCase()) ? 'red' : ''}`}>
              {finding.agent_name || ''} • {(finding.severity || 'medium').toUpperCase()}
            </span>
          </h4>
        </div>
        <p className="finding-desc">{finding.description}</p>
        {finding.suggestion && (
          <div className="code-display">
            <span className="code-label">SUGGESTED FIX</span>
            <code>
              <span className="code-add">{finding.suggestion}</span>
            </code>
          </div>
        )}
      </div>
      <div className="finding-meta">
        <div className="meta-item">
          <label>SEVERITY</label>
          <span className={`severity-${(finding.severity || 'medium').toLowerCase()}`}>
            {(finding.severity || 'medium').toUpperCase()}
          </span>
        </div>
        <div className="meta-item">
          <label>COMPONENT</label>
          <span>{finding.location || 'Unknown'}</span>
        </div>
        <div className="meta-item">
          <label>AGENT</label>
          <span>{finding.agent_name || '—'}</span>
        </div>
        {finding.derived_from && (
          <div className="meta-item">
            <label>SOURCE</label>
            <span className="derived-from-badge">{finding.derived_from}</span>
          </div>
        )}
        <button
          className="btn-jira"
          onClick={() => {
            setSelectedFinding(finding);
            setShowSlackModal(true);
          }}
          title="Create Slack Ticket"
        >
          <Ticket size={14} />
          Create Slack Ticket
        </button>
      </div>
    </div>
  );

  if (!hasData) {
    return (
      <div className="page-container">
        <header className="page-header">
          <div className="breadcrumb">
            <span className="text-muted">Actionable Findings</span>
            <h1 className="page-title">Remediation Plan</h1>
          </div>
        </header>
        <div className="empty-state-card">
          <FileSearch size={48} color="#6e7681" />
          <h3>No Remediation Data</h3>
          <p>Run an analysis first. Remediation suggestions come from the Remediation Engineer and other agents.</p>
          <button className="btn-primary" onClick={() => navigate('/add-artifact')}>
            Add Artifact & Run Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="breadcrumb">
          <span className="text-muted">Actionable Findings</span>
          <h1 className="page-title">Remediation Plan</h1>
        </div>
        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={() => {
              const doc = new jsPDF();
              const pageWidth = doc.internal.pageSize.getWidth();
              const margin = 20;
              let y = 20;

              // Title
              doc.setFontSize(22);
              doc.setTextColor(0, 0, 0);
              doc.text("SecureC Remediation Plan", margin, y);
              y += 10;

              // Metadata
              doc.setFontSize(10);
              doc.setTextColor(100, 100, 100);
              doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
              y += 15;

              // High Impact Section
              if (remediationGroups.highImpact.length > 0) {
                doc.setFontSize(16);
                doc.setTextColor(220, 53, 69); // Red
                doc.text(`High Impact (${remediationGroups.highImpact.length})`, margin, y);
                y += 10;

                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                remediationGroups.highImpact.forEach((f, i) => {
                  if (y > 270) { doc.addPage(); y = 20; }

                  doc.setFont("helvetica", "bold");
                  doc.text(`${i + 1}. ${f.finding_type} [${(f.severity || 'HIGH').toUpperCase()}]`, margin, y);
                  y += 5;

                  doc.setFont("helvetica", "normal");
                  doc.text(`Location: ${f.location || 'Unknown'}`, margin + 5, y);
                  y += 5;

                  const descLines = doc.splitTextToSize(`Fix: ${f.suggestion || 'See details'}`, pageWidth - 40);
                  doc.text(descLines, margin + 5, y);
                  y += (descLines.length * 4) + 5;
                });
                y += 10;
              }

              // Quick Wins Section
              if (remediationGroups.quickWins.length > 0) {
                if (y > 250) { doc.addPage(); y = 20; }

                doc.setFontSize(16);
                doc.setTextColor(40, 167, 69); // Green
                doc.text(`Quick Wins (${remediationGroups.quickWins.length})`, margin, y);
                y += 10;

                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                remediationGroups.quickWins.forEach((f, i) => {
                  if (y > 270) { doc.addPage(); y = 20; }

                  doc.setFont("helvetica", "bold");
                  doc.text(`${i + 1}. ${f.finding_type} [${(f.severity || 'MEDIUM').toUpperCase()}]`, margin, y);
                  y += 5;

                  doc.setFont("helvetica", "normal");
                  doc.text(`Location: ${f.location || 'Unknown'}`, margin + 5, y);
                  y += 5;

                  const descLines = doc.splitTextToSize(`Fix: ${f.suggestion || 'See details'}`, pageWidth - 40);
                  doc.text(descLines, margin + 5, y);
                  y += (descLines.length * 4) + 5;
                });
              }

              doc.save(`SecureC_Remediation_Plan_${new Date().toISOString().split('T')[0]}.pdf`);

              alert('✓ Remediation plan exported as PDF!');
            }}
            title="Download remediation plan as PDF"
          >
            <Download size={16} />
            Export Plan as PDF
          </button>
        </div>
      </header>

      {remediationGroups.highImpact.length > 0 && (
        <section className="remediation-section">
          <div className="section-header">
            <div className="icon-box red">
              <Flame size={20} color="#f87171" />
            </div>
            <div>
              <h3 className="section-title">High Impact</h3>
              <p className="section-desc">Critical/high severity findings requiring immediate attention.</p>
            </div>
          </div>
          {remediationGroups.highImpact.map(renderFindingCard)}
        </section>
      )}

      {remediationGroups.quickWins.length > 0 && (
        <section className="remediation-section">
          <div className="section-header">
            <div className="icon-box green">
              <Zap size={20} color="#34d399" />
            </div>
            <div>
              <h3 className="section-title">Quick Wins</h3>
              <p className="section-desc">Medium severity – lower effort fixes.</p>
            </div>
          </div>
          {remediationGroups.quickWins.map(renderFindingCard)}
        </section>
      )}

      {remediationGroups.longTerm.length > 0 && (
        <section className="remediation-section">
          <div className="section-header">
            <div className="icon-box blue">
              <Shield size={20} color="#60a5fa" />
            </div>
            <div>
              <h3 className="section-title">Long-term Hardening</h3>
              <p className="section-desc">Low/info severity – strategic improvements.</p>
            </div>
          </div>
          {remediationGroups.longTerm.map(renderFindingCard)}
        </section>
      )}

      {/* Slack Modal */}
      {showSlackModal && selectedFinding && (
        <div className="modal-overlay" onClick={() => setShowSlackModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send to Slack</h3>
              <button className="close-btn" onClick={() => setShowSlackModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Message Preview</label>
                <div className="message-preview">
                  {getSlackMessage(selectedFinding)}
                </div>
              </div>
              <p className="text-xs text-muted" style={{ marginTop: '10px' }}>
                This ticket will be sent as a direct message to the configured Slack user.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowSlackModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSendToSlack}>Send to Slack</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Remediation;
