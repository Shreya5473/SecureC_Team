import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Calendar,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Info,
  FileSearch,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAnalysis } from '../context/AnalysisContext';
import './RiskSummary.css';

const RiskSummary = () => {
  const { analysisReport, lastArtifact } = useAnalysis();
  const navigate = useNavigate();

  const severityCounts = useMemo(() => {
    if (!analysisReport?.findings?.length) {
      return { high: 0, medium: 0, low: 0, critical: 0 };
    }
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    analysisReport.findings.forEach((f) => {
      const s = (f.severity || 'info').toLowerCase();
      counts[s] = (counts[s] || 0) + 1;
    });
    return {
      critical: counts.critical,
      high: counts.high + counts.critical,
      medium: counts.medium,
      low: counts.low + counts.info,
    };
  }, [analysisReport]);

  const executiveInsight = analysisReport?.summary ?? null;
  const overallScore = analysisReport?.overall_score ?? null;
  const status = analysisReport?.status ?? null;
  const timestamp = analysisReport?.timestamp ? new Date(analysisReport.timestamp).toLocaleString() : null;

  // Chart data derived from findings (by severity over time - simplified as single snapshot)
  const chartData = useMemo(() => {
    if (!analysisReport?.findings?.length) {
      return [{ name: 'Findings', value: 0 }];
    }
    const total = analysisReport.findings.length;
    return [
      { name: 'Critical', value: severityCounts.critical },
      { name: 'High', value: severityCounts.high },
      { name: 'Medium', value: severityCounts.medium },
      { name: 'Low', value: severityCounts.low },
    ].filter((d) => d.value > 0);
  }, [analysisReport, severityCounts]);

  const hasData = analysisReport && (analysisReport.findings?.length > 0 || analysisReport.summary);

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="breadcrumb">
          <span className="text-muted">Reporting / Executive</span>
          <h1 className="page-title">Risk Summary</h1>
        </div>
        <div className="header-actions">
          <div className="date-filter">
            <Calendar size={16} />
            <span>{timestamp || 'No analysis yet'}</span>
          </div>
          {hasData && (
            <button
              className="btn-primary"
              onClick={() => window.print()}
              title="Export current analysis as PDF"
            >
              <Download size={16} />
              Export PDF
            </button>
          )}
        </div>
      </header>

      {!hasData ? (
        <div className="empty-state-card">
          <FileSearch size={48} color="#6e7681" />
          <h3>No Analysis Yet</h3>
          <p>Submit an artifact to get a Risk Summary with findings from all agents.</p>
          <button className="btn-primary" onClick={() => navigate('/add-artifact')}>
            Add Artifact & Run Analysis
          </button>
        </div>
      ) : (
        <>
          {lastArtifact && (
            <div className="artifact-context-banner">
              <span className="text-muted text-sm">
                Analysis for: <strong>{lastArtifact.type}</strong> — {lastArtifact.contentPreview}
              </span>
            </div>
          )}

          <section className="insight-card">
            <div className="insight-icon">
              <Sparkles size={20} color="#a78bfa" />
            </div>
            <div className="insight-content">
              <h3 className="insight-title">Executive Insight</h3>
              <p className="insight-text">{executiveInsight || 'Analysis complete.'}</p>
              <div style={{ marginTop: '12px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#22d3ee' }}>Score: {overallScore ?? '—'}/100</span>
                <span className={`badge-${status === 'GO' ? 'success' : 'warning'}`}>{status ?? '—'}</span>
              </div>
            </div>
          </section>

          <div className="stats-grid">
            <div className="stat-card high">
              <div className="stat-header">
                <span className="stat-label">HIGH SEVERITY</span>
                <AlertCircle size={16} color="#ef4444" />
              </div>
              <div className="stat-value">{severityCounts.high}</div>
              <div className="stat-trend negative">From analysis</div>
            </div>
            <div className="stat-card medium">
              <div className="stat-header">
                <span className="stat-label">MEDIUM SEVERITY</span>
                <AlertTriangle size={16} color="#f59e0b" />
              </div>
              <div className="stat-value">{severityCounts.medium}</div>
              <div className="stat-trend neutral">Requires attention</div>
            </div>
            <div className="stat-card low">
              <div className="stat-header">
                <span className="stat-label">LOW SEVERITY</span>
                <Info size={16} color="#10b981" />
              </div>
              <div className="stat-value">{severityCounts.low}</div>
              <div className="stat-trend positive">Monitor</div>
            </div>
          </div>

          <div className="lower-grid">
            <div className="chart-card">
              <div className="card-header">
                <h3>Findings by Severity</h3>
                <span className="text-muted text-sm">From multi-agent analysis</span>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData.length ? chartData : [{ name: 'N/A', value: 0 }]}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e2630" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6e7681', fontSize: 12 }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ backgroundColor: '#0f141a', borderColor: '#1e2630' }} itemStyle={{ color: '#f0f6fc' }} />
                    <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="impact-card">
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} color="#a78bfa" />
                  <h3>Projected Impact</h3>
                </div>
                <span className={`badge-${severityCounts.high > 5 ? 'warning' : severityCounts.high > 0 ? 'warning' : 'success'}`}>
                  {severityCounts.high > 5 ? 'Elevated' : severityCounts.high > 0 ? 'Moderate' : 'Low'}
                </span>
              </div>
              <p className="impact-desc">Based on current findings from the analysis of your artifact.</p>
              <button className="btn-text" onClick={() => navigate('/remediation')}>
                View Mitigation Plan
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RiskSummary;
