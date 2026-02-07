import React, { useState, useMemo } from 'react';
import {
  Play,
  Download,
  FileText,
  FileSearch,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { useAnalysis } from '../context/AnalysisContext';
import { filterByAgent } from '../utils/findingsHelpers';
import { AGENT_NAMES } from '../constants/agents';
import './SecurityReview.css';

const SecurityReview = () => {
  const { analysisReport } = useAnalysis();
  const navigate = useNavigate();
  const [selectedIdx, setSelectedIdx] = useState(0);

  const securityFindings = useMemo(() => {
    return filterByAgent(analysisReport?.findings || [], AGENT_NAMES.LOGIC_AUDITOR);
  }, [analysisReport]);

  const selected = securityFindings[selectedIdx];
  const hasData = securityFindings.length > 0;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Title
    doc.setFontSize(22);
    doc.text("Security Review Report", margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 20;

    // Findings
    securityFindings.forEach((f, i) => {
      if (y > 270) { doc.addPage(); y = 20; }

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${f.finding_type} [${(f.severity || 'MEDIUM').toUpperCase()}]`, margin, y);
      y += 7;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Location: ${f.location || 'Unknown'}`, margin, y);
      y += 7;

      const descLines = doc.splitTextToSize(`Description: ${f.description}`, pageWidth - 40);
      doc.text(descLines, margin, y);
      y += (descLines.length * 4) + 5;

      if (f.suggestion) {
        const fixLines = doc.splitTextToSize(`Suggested Fix: ${f.suggestion}`, pageWidth - 40);
        doc.setTextColor(0, 100, 0);
        doc.text(fixLines, margin, y);
        doc.setTextColor(0);
        y += (fixLines.length * 4) + 10;
      } else {
        y += 5;
      }
    });

    doc.save(`Security_Review_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!hasData) {
    return (
      <div className="page-container">
        <header className="page-header">
          <div className="breadcrumb">
            <span className="text-muted">Pages / Security Review</span>
            <h1 className="page-title">Logic Auditor (Security Review)</h1>
          </div>
        </header>
        <div className="empty-state-card">
          <FileSearch size={48} color="#6e7681" />
          <h3>No Security Review Findings</h3>
          <p>Logic Auditor analyzes code for vulnerabilities (SQLi, XSS, logic bugs). Run an analysis with code content.</p>
          <button className="btn-primary" onClick={() => navigate('/add-artifact')}>
            <Play size={16} fill="black" />
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
          <span className="text-muted">Pages / Security Review</span>
          <h1 className="page-title">Logic Auditor — {securityFindings.length} findings</h1>
        </div>
        <button className="btn-primary" onClick={() => navigate('/add-artifact')}>
          <Play size={16} fill="black" />
          Run New Review
        </button>
      </header>

      <div className="stats-row">
        <div className="stat-card-simple">
          <div className="text-muted text-xs font-bold mb-2">Critical & High</div>
          <div className="text-3xl font-bold text-white mb-1">
            {securityFindings.filter((f) => ['critical', 'high'].includes((f.severity || '').toLowerCase())).length}
          </div>
        </div>
        <div className="stat-card-simple">
          <div className="text-muted text-xs font-bold mb-2">Medium</div>
          <div className="text-3xl font-bold text-white mb-1">
            {securityFindings.filter((f) => (f.severity || '').toLowerCase() === 'medium').length}
          </div>
        </div>
        <div className="stat-card-simple">
          <div className="text-muted text-xs font-bold mb-2">Low / Info</div>
          <div className="text-3xl font-bold text-white mb-1">
            {securityFindings.filter((f) => ['low', 'info'].includes((f.severity || '').toLowerCase())).length}
          </div>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <h3 className="font-semibold text-lg">Identified Findings (Logic Auditor)</h3>
      </div>

      <div className="findings-table-container">
        <table className="findings-table">
          <thead>
            <tr>
              <th>FINDING</th>
              <th>SEVERITY</th>
              <th>COMPONENT</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {securityFindings.map((f, idx) => (
              <tr
                key={idx}
                className={selectedIdx === idx ? 'active-row' : ''}
                onClick={() => setSelectedIdx(idx)}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <div className="font-medium text-white">{f.finding_type || 'Security Finding'}</div>
                  <div className="text-xs text-muted">{f.description?.slice(0, 60)}...</div>
                </td>
                <td>
                  <span className={`badge-${(f.severity || 'medium').toLowerCase()}`}>
                    {(f.severity || 'medium').toUpperCase()}
                  </span>
                </td>
                <td className="text-mono text-sm">{f.location || '—'}</td>
                <td><span className="status-dot red">Open</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="detail-panel mt-6">
          <div className="detail-panel-header">
            <h3>{selected.finding_type || 'Security Finding'}</h3>
            <div className="flex gap-2">
              {/* Removed View Logs and Assign Ticket buttons */}
            </div>
          </div>
          <div className="detail-panel-grid">
            <div className="bg-black p-4 rounded border border-gray-800 font-mono text-xs">
              <div className="text-gray-500 mb-2">// {selected.location || 'Codebase'}</div>
              <div className="text-white mt-1">{selected.description}</div>
            </div>
            <div>
              <div className="mb-4">
                <h4 className="text-cyan-400 font-bold text-sm mb-2">Logic Auditor Analysis</h4>
                <p className="text-sm text-gray-400 leading-relaxed">{selected.description}</p>
              </div>
              {selected.suggestion && (
                <div className="mb-4">
                  <h4 className="text-purple-400 font-bold text-sm mb-2">Suggested Fix</h4>
                  <pre className="text-sm text-gray-400 bg-gray-900 p-3 rounded overflow-x-auto">
                    {selected.suggestion}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityReview;
