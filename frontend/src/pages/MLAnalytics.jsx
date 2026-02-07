import React, { useMemo } from 'react';
import { Brain, FileSearch, Activity } from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import './MLAnalytics.css';

// Neon color palette matching the app theme (no purple)
const CHART_COLORS = ['#22d3ee', '#ffb700', '#ff4d4d', '#00e676', '#06b6d4', '#ff7b00'];
const PIE_COLORS = ['#22d3ee', '#ffb700', '#ff4d4d', '#00e676'];

const MLAnalytics = () => {
  const { analysisReport } = useAnalysis();
  const navigate = useNavigate();
  const mlSignals = analysisReport?.ml_signals;

  const hasSignals = mlSignals?.signals?.length > 0;
  const analytics = mlSignals?.analytics || {};

  const pieData = useMemo(() => {
    const breakdown = analytics.signal_type_breakdown || [];
    if (breakdown.length === 0 && hasSignals) {
      const byType = {};
      mlSignals.signals.forEach((s) => {
        const t = s.type || 'other';
        byType[t] = (byType[t] || 0) + 1;
      });
      return Object.entries(byType).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
    }
    return breakdown.map((d) => ({ name: (d.type || d.name || '').replace(/_/g, ' '), value: d.count || 0 }));
  }, [analytics.signal_type_breakdown, hasSignals, mlSignals]);

  const histogramData = useMemo(() => {
    const hist = analytics.confidence_histogram || [];
    if (hist.length > 0) return hist;
    if (!hasSignals) return [];
    const buckets = { '0.5-0.6': 0, '0.6-0.7': 0, '0.7-0.8': 0, '0.8-0.9': 0, '0.9-1.0': 0 };
    mlSignals.signals.forEach((s) => {
      const c = s.confidence || 0;
      if (c < 0.6) buckets['0.5-0.6']++;
      else if (c < 0.7) buckets['0.6-0.7']++;
      else if (c < 0.8) buckets['0.7-0.8']++;
      else if (c < 0.9) buckets['0.8-0.9']++;
      else buckets['0.9-1.0']++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [analytics.confidence_histogram, hasSignals, mlSignals]);

  const keywordData = useMemo(() => {
    return analytics.keyword_distribution || [];
  }, [analytics.keyword_distribution]);

  const chartTooltipStyle = {
    backgroundColor: '#0f141a',
    border: '1px solid #1e2630',
    borderRadius: '8px',
  };

  return (
    <div className="page-container ml-analytics-page">
      <header className="page-header">
        <div className="breadcrumb">
          <span className="text-muted">Local ML Engine</span>
          <h1 className="page-title">ML Analytics</h1>
        </div>
        <div className="header-actions">
          <div className="ml-engine-badge">
            <Brain size={16} color="#22d3ee" />
            <span>local_ml</span>
          </div>
        </div>
      </header>

      {!mlSignals ? (
        <div className="empty-state-card">
          <FileSearch size={48} color="#6e7681" />
          <h3>No ML Signals Yet</h3>
          <p>Run an analysis (PDF, GitHub, or text/code) to see ML analytics. Go to Add Artifact, paste content with security keywords (auth, password, token, etc.), then Run Analysis.</p>
          <button className="btn-primary" onClick={() => navigate('/add-artifact')}>
            Add Artifact & Run Analysis
          </button>
        </div>
      ) : (
        <>
          {!hasSignals && (
            <div className="ml-no-signals-banner">
              <Activity size={20} />
              <span>No anomalies detected. Charts show empty/zero. Paste code with security keywords (auth, password, token, sql) in Add Artifact to trigger ML signals.</span>
            </div>
          )}

          {/* Overview stats - always show when we have ml_signals */}
          <div className="ml-stats-row">
            <div className="ml-stat-card">
              <span className="ml-stat-value">{mlSignals.signals?.length || 0}</span>
              <span className="ml-stat-label">Total Signals</span>
            </div>
            <div className="ml-stat-card">
              <span className="ml-stat-value">{((analytics.avg_confidence || 0) * 100).toFixed(1)}%</span>
              <span className="ml-stat-label">Avg Confidence</span>
            </div>
            <div className="ml-stat-card">
              <span className="ml-stat-value">{(pieData?.length || 0)}</span>
              <span className="ml-stat-label">Signal Types</span>
            </div>
            <div className="ml-stat-card">
              <span className="ml-stat-value">{mlSignals.artifact_id?.slice(0, 8) || '—'}</span>
              <span className="ml-stat-label">Artifact ID</span>
            </div>
          </div>

          {/* Charts grid */}
          <div className="ml-charts-grid">
            {/* Pie chart - Signal type distribution */}
            <div className="ml-chart-card">
              <div className="ml-chart-header">
                <h3>Signal Type Distribution</h3>
                <span className="text-muted text-sm">By category</span>
              </div>
              <div className="ml-chart-body">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {(pieData || []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [v, 'Count']} />
                    <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => v} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Histogram - Confidence distribution */}
            <div className="ml-chart-card">
              <div className="ml-chart-header">
                <h3>Confidence Histogram</h3>
                <span className="text-muted text-sm">Signal confidence ranges</span>
              </div>
              <div className="ml-chart-body">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={histogramData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2630" vertical={false} />
                    <XAxis dataKey="range" tick={{ fill: '#6e7681', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6e7681', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar chart - Keyword distribution */}
            {keywordData.length > 0 && (
              <div className="ml-chart-card ml-chart-wide">
                <div className="ml-chart-header">
                  <h3>Security Keyword Distribution</h3>
                  <span className="text-muted text-sm">Top keywords in artifact</span>
                </div>
                <div className="ml-chart-body">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={keywordData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2630" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#6e7681', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="keyword" tick={{ fill: '#6e7681', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="count" fill="#ffb700" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Signals table */}
          <div className="ml-table-card">
            <div className="ml-chart-header">
              <h3>Signals Detail Table</h3>
              <span className="text-muted text-sm">All detected ML signals</span>
            </div>
            <div className="ml-table-wrapper">
              <table className="ml-signals-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Type</th>
                    <th>Subtype</th>
                    <th>Confidence</th>
                    <th>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {(mlSignals.signals || []).map((sig, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <span className="signal-type-badge">{sig.type?.replace(/_/g, ' ') || '—'}</span>
                      </td>
                      <td>{sig.subtype?.replace(/_/g, ' ') || '—'}</td>
                      <td>
                        <span className={`confidence-badge ${(sig.confidence || 0) >= 0.8 ? 'high' : (sig.confidence || 0) >= 0.6 ? 'medium' : 'low'}`}>
                          {((sig.confidence || 0) * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="evidence-cell">{sig.evidence || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signal cards (original list) */}
          <div className="signals-grid">
            <h3 className="signals-title">Signal Details</h3>
            {(mlSignals.signals || []).map((sig, idx) => (
              <div key={idx} className="signal-card">
                <div className="signal-header">
                  <span className={`signal-type ${(sig.type || '').replace(/_/g, '-')}`}>
                    {sig.type || 'signal'}
                    {sig.subtype && ` • ${sig.subtype}`}
                  </span>
                  <span className="signal-confidence">{(sig.confidence * 100).toFixed(0)}%</span>
                </div>
                <p className="signal-evidence">{sig.evidence}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MLAnalytics;
