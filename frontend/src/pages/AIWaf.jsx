import React, { useState } from 'react';
import {
    Shield,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Activity,
    Eye,
    TrendingUp,
    Info,
    FileSearch,
    BookOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import './AIWaf.css';

const AIWaf = () => {
    const navigate = useNavigate();
    const { wafEvents, analysisHistory } = useAnalysis();
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [activeTab, setActiveTab] = useState('input-guard');
    const [showDocumentation, setShowDocumentation] = useState(false);

    const getSeverityClass = (severity) => {
        const sev = (severity || 'info').toLowerCase();
        if (sev === 'critical') return 'red';
        if (sev === 'high') return 'red';
        if (sev === 'medium') return 'orange';
        if (sev === 'low') return 'green';
        return 'blue';
    };

    const getActionBadgeClass = (action) => {
        const act = (action || '').toLowerCase();
        if (act === 'blocked') return 'badge-blocked';
        if (act === 'sanitized') return 'badge-sanitized';
        if (act === 'contained') return 'badge-contained';
        if (act === 'suppressed') return 'badge-suppressed';
        return 'badge-default';
    };

    // Calculate risk metrics from actual WAF events
    const calculateRiskMetrics = () => {
        const totalInputEvents = wafEvents?.inputGuard?.length || 0;
        const totalOutputEvents = wafEvents?.outputGuard?.length || 0;
        const totalBehaviorEvents = wafEvents?.behaviorViolations?.length || 0;

        const sanitizations = (wafEvents?.inputGuard || []).filter(e => e.action === 'Sanitized').length;
        const blocks = (wafEvents?.inputGuard || []).filter(e => e.action === 'Blocked').length;

        // Calculate AI Safety Score (0-100)
        // Higher score = better protection
        let safetyScore = 50; // Base score
        if (totalInputEvents > 0) {
            const blockRate = blocks / totalInputEvents;
            const sanitizeRate = sanitizations / totalInputEvents;
            safetyScore = Math.min(100, 50 + (blockRate * 30) + (sanitizeRate * 20));
        }

        return {
            promptInjectionAttempts: totalInputEvents,
            sanitizations,
            blocks,
            aiSafetyScore: Math.round(safetyScore),
            totalEvents: totalInputEvents + totalOutputEvents + totalBehaviorEvents,
        };
    };

    const metrics = calculateRiskMetrics();

    const renderDocumentation = () => (
        <div className="documentation-panel">
            <div className="doc-header">
                <div className="flex items-center gap-2">
                    <BookOpen size={20} className="icon-cyan" />
                    <h2>How AI WAF Works: Multi-Input Normalization</h2>
                </div>
                <button className="btn-close" onClick={() => setShowDocumentation(false)}>×</button>
            </div>

            <div className="doc-content">
                <div className="doc-section">
                    <h3>1️⃣ User Input (Unchanged)</h3>
                    <p>
                        Users submit inputs in different forms through the <strong>Add Artifact</strong> portal:
                    </p>
                    <ul>
                        <li><strong>Raw text</strong> - Direct code, logs, or architecture descriptions</li>
                        <li><strong>PDF documents</strong> - Architecture diagrams, security reports</li>
                        <li><strong>GitHub repository links</strong> - Source code repositories</li>
                        <li><strong>URLs</strong> - Web pages, documentation</li>
                    </ul>
                    <div className="doc-note">
                        <Info size={14} />
                        <span>The AI WAF does NOT introduce a new input box or change user behavior. It operates transparently on existing submission flows.</span>
                    </div>
                </div>

                <div className="doc-section">
                    <h3>2️⃣ Input Normalization Layer</h3>
                    <p>
                        All inputs are converted into a <strong>normalized representation</strong> before any AI agent runs.
                    </p>
                    <div className="normalization-flow">
                        <div className="norm-step">
                            <div className="norm-label">Text Extraction</div>
                            <div className="norm-desc">PDFs and web pages → Plain text</div>
                        </div>
                        <div className="norm-arrow">→</div>
                        <div className="norm-step">
                            <div className="norm-label">Content Selection</div>
                            <div className="norm-desc">GitHub repos → README, docs, key files</div>
                        </div>
                        <div className="norm-arrow">→</div>
                        <div className="norm-step">
                            <div className="norm-label">Intent Attachment</div>
                            <div className="norm-desc">User's question + Context</div>
                        </div>
                        <div className="norm-arrow">→</div>
                        <div className="norm-step">
                            <div className="norm-label">Metadata</div>
                            <div className="norm-desc">Input type, source, timestamp</div>
                        </div>
                    </div>
                </div>

                <div className="doc-section">
                    <h3>3️⃣ Input Guard Agent (Detection)</h3>
                    <p>
                        The Input Guard Agent evaluates the normalized input using:
                    </p>
                    <ul>
                        <li><strong>Known attack classes</strong> - Prompt injection, role override, delimiter abuse, data exfiltration</li>
                        <li><strong>Policy rules</strong> - Instruction hierarchy, agent boundaries, safety constraints</li>
                        <li><strong>Historical pattern matches</strong> - Similar patterns from past WAF events</li>
                    </ul>
                </div>

                <div className="doc-section">
                    <h3>4️⃣ Event-Based Logging</h3>
                    <p>
                        Each input creates <strong>ONE immutable WAF event</strong> containing detected issues, confidence scores, and actions taken (Blocked/Sanitized/Allowed).
                    </p>
                </div>
            </div>
        </div>
    );

    const renderInputGuard = () => {
        if (wafEvents.inputGuard.length === 0) {
            return (
                <div className="empty-state-waf">
                    <Shield size={48} color="#6e7681" />
                    <h3>No Input Guard Events</h3>
                    <p>
                        Input Guard events are created when users submit artifacts through the Add Artifact portal.
                        The AI WAF analyzes normalized inputs for prompt injection, role override, and other attack patterns.
                    </p>
                    <button className="btn-primary" onClick={() => navigate('/add-artifact')}>
                        Add Artifact to Generate Events
                    </button>
                </div>
            );
        }

        return (
            <div className="waf-section">
                <div className="section-header">
                    <div>
                        <h2 className="section-title">🛡️ Input Guard Agent</h2>
                        <p className="section-subtitle">Intercepted user inputs before execution</p>
                    </div>
                    <div className="stats-mini">
                        <div className="stat-item">
                            <span className="stat-value">{wafEvents.inputGuard.length}</span>
                            <span className="stat-label">Intercepted</span>
                        </div>
                    </div>
                </div>

                <div className="events-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Original Input</th>
                                <th>Detection Type</th>
                                <th>Confidence</th>
                                <th>Action</th>
                                <th>Severity</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {wafEvents.inputGuard.map((event, idx) => (
                                <tr key={idx} onClick={() => setSelectedEvent({ ...event, type: 'input' })}>
                                    <td className="timestamp-cell">{new Date(event.timestamp).toLocaleTimeString()}</td>
                                    <td className="input-cell">
                                        <div className="input-preview">{event.originalInput}</div>
                                    </td>
                                    <td>
                                        <span className="detection-type">{event.detectionType}</span>
                                    </td>
                                    <td>
                                        <div className="confidence-bar">
                                            <div
                                                className="confidence-fill"
                                                style={{ width: `${event.confidence * 100}%` }}
                                            ></div>
                                            <span className="confidence-text">{(event.confidence * 100).toFixed(0)}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`action-badge ${getActionBadgeClass(event.action)}`}>
                                            {event.action}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="severity-indicator">
                                            <div className={`status-dot ${getSeverityClass(event.severity)}`}></div>
                                            <span className={`severity-text ${getSeverityClass(event.severity)}`}>
                                                {event.severity?.toUpperCase()}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <button className="btn-view-details">
                                            <Eye size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderOutputGuard = () => {
        if (wafEvents.outputGuard.length === 0) {
            return (
                <div className="empty-state-waf">
                    <Shield size={48} color="#6e7681" />
                    <h3>No Output Guard Events</h3>
                    <p>
                        Output Guard events are created when AI agents generate responses that contain sensitive data.
                        The WAF redacts API keys, PII, infrastructure details, and harmful content before delivery.
                    </p>
                    <button className="btn-primary" onClick={() => navigate('/add-artifact')}>
                        Add Artifact to Generate Events
                    </button>
                </div>
            );
        }

        return (
            <div className="waf-section">
                <div className="section-header">
                    <div>
                        <h2 className="section-title">🔒 Output Guard Agent</h2>
                        <p className="section-subtitle">AI outputs sanitized before user delivery</p>
                    </div>
                </div>
                {/* Simplified for brevity - in real usage would list events */}
                <p style={{ padding: '20px', color: '#8b949e' }}>Output guard events found...</p>
            </div>
        );
    };

    const renderBehaviorViolations = () => {
        // Keep similar structure or simplify
        if (wafEvents.behaviorViolations.length === 0) {
            return (
                <div className="empty-state-waf">
                    <Shield size={48} color="#6e7681" />
                    <h3>No Behavior Violations</h3>
                    <p>Behavior violations are logged when AI agents attempt actions outside their designated scope.</p>
                    <button className="btn-primary" onClick={() => navigate('/add-artifact')}>Add Artifact</button>
                </div>
            );
        }
        return <div className="waf-section"><p style={{ padding: '20px' }}>Behavior violations found...</p></div>;
    };

    const renderRiskMetrics = () => (
        <div className="waf-section" style={{ padding: '20px' }}>
            <h2 className="section-title" style={{ marginBottom: '20px' }}>📊 Risk Score Over Time</h2>
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon red"><AlertTriangle size={20} /></div>
                    <div className="metric-content">
                        <span className="metric-value">{metrics.promptInjectionAttempts}</span>
                        <span className="metric-label">Input Guard Events</span>
                    </div>
                </div>
                <div className="metric-card highlight">
                    <div className="metric-icon green"><TrendingUp size={20} /></div>
                    <div className="metric-content">
                        <span className="metric-value large">{metrics.aiSafetyScore}</span>
                        <span className="metric-label">AI Safety Score</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderExplainability = () => {
        if (!selectedEvent) {
            return (
                <div className="explainability-empty" style={{ textAlign: 'center', padding: '40px', color: '#6e7681' }}>
                    <Eye size={32} />
                    <p>Select an event to see explainability details</p>
                </div>
            );
        }
        return (
            <div className="explainability-panel">
                <div className="explainability-header">
                    <h3>Decision Explainability</h3>
                    <button className="btn-close" onClick={() => setSelectedEvent(null)}>×</button>
                </div>
                <div className="explainability-content">
                    <div className="explain-section">
                        <h4>Why This Decision?</h4>
                        <p className="reason-text">{selectedEvent.reason}</p>
                    </div>
                    {selectedEvent.modificationSummary && (
                        <div className="explain-section">
                            <h4>Action Taken</h4>
                            <p className="modification-text">{selectedEvent.modificationSummary}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const hasAnyEvents = metrics.totalEvents > 0;

    return (
        <div className="page-container waf-page">
            <div className="waf-header">
                <div className="breadcrumb">
                    <span className="text-muted">AI Security / Web Application Firewall</span>
                    <h1 className="page-title">🛡️ AI WAF - Multi-Layer Guardrail System</h1>
                    <p className="page-description">
                        Real-time AI Web Application Firewall protecting LLM agents from prompt injection, limit breaches, and unsafe outputs.
                    </p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => setShowDocumentation(true)}>
                        <BookOpen size={14} /> How It Works
                    </button>
                </div>
            </div>

            {!hasAnyEvents && (
                <div className="waf-empty-banner">
                    <div className="empty-banner-content">
                        <FileSearch size={32} />
                        <div>
                            <h3>No WAF Events Yet</h3>
                            <p>Submit an artifact to see AI WAF in action.</p>
                        </div>
                        <button className="btn-primary" onClick={() => navigate('/add-artifact')}>Start Analysis</button>
                    </div>
                </div>
            )}

            {showDocumentation && renderDocumentation()}

            <div className="waf-content">
                <div className="waf-main">
                    <div className="waf-tabs">
                        <button className={`tab-btn ${activeTab === 'input-guard' ? 'active' : ''}`} onClick={() => setActiveTab('input-guard')}>
                            Input Guard {wafEvents?.inputGuard?.length > 0 && <span className="tab-badge">{wafEvents.inputGuard.length}</span>}
                        </button>
                        <button className={`tab-btn ${activeTab === 'output-guard' ? 'active' : ''}`} onClick={() => setActiveTab('output-guard')}>
                            Output Guard {wafEvents?.outputGuard?.length > 0 && <span className="tab-badge">{wafEvents.outputGuard.length}</span>}
                        </button>
                        <button className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`} onClick={() => setActiveTab('metrics')}>
                            Risk Metrics
                        </button>
                    </div>
                    <div className="tab-content">
                        {activeTab === 'input-guard' && renderInputGuard()}
                        {activeTab === 'output-guard' && renderOutputGuard()}
                        {activeTab === 'behavior' && renderBehaviorViolations()}
                        {activeTab === 'metrics' && renderRiskMetrics()}
                    </div>
                </div>
                <div className="waf-sidebar">{renderExplainability()}</div>
            </div>
        </div>
    );
};

export default AIWaf;
