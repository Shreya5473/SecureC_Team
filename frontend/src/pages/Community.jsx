import React, { useState, useEffect } from 'react';
import {
    Shield,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    ThumbsUp,
    Copy,
    Plus,
    X,
    AlertTriangle,
    BarChart3
} from 'lucide-react';
import { getApiUrl } from '../config';
import './Community.css';

const Community = () => {
    const [threats, setThreats] = useState([]);
    const [rules, setRules] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [expandedThreats, setExpandedThreats] = useState(new Set());
    const [upvotedItems, setUpvotedItems] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state for threat submission
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Injection',
        confidence: 0.7,
        example_payload: '',
        mitigation: ''
    });

    useEffect(() => {
        fetchCommunityData();
    }, []);

    const fetchCommunityData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [threatsRes, rulesRes, analyticsRes] = await Promise.all([
                fetch(getApiUrl('/community/threats?limit=10')),
                fetch(getApiUrl('/community/rules?limit=10')),
                fetch(getApiUrl('/community/analytics/categories'))
            ]);

            if (!threatsRes.ok || !rulesRes.ok || !analyticsRes.ok) {
                throw new Error('Failed to fetch community data');
            }

            const threatsData = await threatsRes.json();
            const rulesData = await rulesRes.json();
            const analyticsData = await analyticsRes.json();

            setThreats(threatsData.threats || []);
            setRules(rulesData.rules || []);
            setCategoryData(analyticsData.categories || []);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching community data:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (threatId) => {
        const newExpanded = new Set(expandedThreats);
        if (newExpanded.has(threatId)) {
            newExpanded.delete(threatId);
        } else {
            newExpanded.add(threatId);
        }
        setExpandedThreats(newExpanded);
    };

    const handleUpvote = async (itemId, itemType) => {
        // Prevent multiple rapid clicks
        if (upvotedItems.has(itemId)) return;

        try {
            const response = await fetch(getApiUrl('/community/upvote'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ item_id: itemId, item_type: itemType })
            });

            if (!response.ok) throw new Error('Failed to upvote');

            const data = await response.json();

            // Optimistically update UI
            setUpvotedItems(new Set([...upvotedItems, itemId]));

            if (itemType === 'threat') {
                setThreats(threats.map(t =>
                    t.id === itemId ? { ...t, upvotes: (t.upvotes || 0) + 1 } : t
                ));
            } else {
                setRules(rules.map(r =>
                    r.id === itemId ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r
                ));
            }
        } catch (err) {
            console.error('Error upvoting:', err);
        }
    };

    const handleCopyRule = async (rule) => {
        try {
            const ruleText = JSON.stringify(rule.rule_config, null, 2);
            await navigator.clipboard.writeText(ruleText);
            alert('Rule configuration copied to clipboard!');
        } catch (err) {
            console.error('Error copying rule:', err);
            alert('Failed to copy rule configuration');
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'confidence' ? parseFloat(value) : value
        }));
    };

    const handleSubmitThreat = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch(getApiUrl('/community/threats'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to submit threat');
            }

            const data = await response.json();

            // Add new threat to the list
            if (data.threat) {
                setThreats([data.threat, ...threats]);
            }

            // Reset form and close modal
            setFormData({
                title: '',
                description: '',
                category: 'Injection',
                confidence: 0.7,
                example_payload: '',
                mitigation: ''
            });
            setShowModal(false);

            // Refresh data to get updated analytics
            fetchCommunityData();
        } catch (err) {
            console.error('Error submitting threat:', err);
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const categories = [
        'Injection', 'XSS', 'Authentication', 'Authorization',
        'File Access', 'SSRF', 'Deserialization', 'AI Security',
        'Data Privacy', 'Cryptography', 'Configuration', 'Other'
    ];

    if (loading) {
        return (
            <div className="community-page">
                <div className="loading-state">
                    <Shield size={48} className="icon" />
                    <p>Loading community intelligence...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="community-page">
                <div className="error-state">
                    <AlertTriangle size={48} />
                    <p>Error loading community data: {error}</p>
                    <button className="submit-btn" onClick={fetchCommunityData}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const maxCount = Math.max(...categoryData.map(c => c.count), 1);

    return (
        <div className="community-page">
            {/* Header */}
            <div className="community-header">
                <h1>Global AI Security Community</h1>
                <p>Shared threat intelligence and AI defense strategies</p>
            </div>

            {/* Section A: Trending Threats */}
            <div className="community-section">
                <div className="section-header">
                    <h2>
                        <TrendingUp className="icon" size={24} />
                        Trending Threats
                    </h2>
                    <button className="submit-btn" onClick={() => setShowModal(true)}>
                        <Plus size={18} />
                        Submit Threat
                    </button>
                </div>

                {threats.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <p>No threats found. Be the first to submit one!</p>
                    </div>
                ) : (
                    <div className="threats-grid">
                        {threats.map((threat) => (
                            <div key={threat.id} className="threat-card">
                                <div className="threat-card-header">
                                    <div style={{ flex: 1 }}>
                                        <h3 className="threat-title">{threat.title}</h3>
                                        <span className="category-badge">{threat.category}</span>
                                    </div>
                                </div>

                                <p className="threat-description">{threat.description}</p>

                                <div className="threat-meta">
                                    <div className="confidence-score">
                                        <Shield size={16} />
                                        Confidence: {(threat.confidence * 100).toFixed(0)}%
                                    </div>
                                    <div className="threat-actions">
                                        <button
                                            className={`upvote-btn ${upvotedItems.has(threat.id) ? 'upvoted' : ''}`}
                                            onClick={() => handleUpvote(threat.id, 'threat')}
                                            disabled={upvotedItems.has(threat.id)}
                                        >
                                            <ThumbsUp size={14} />
                                            {threat.upvotes || 0}
                                        </button>
                                        <button
                                            className="expand-btn"
                                            onClick={() => toggleExpand(threat.id)}
                                        >
                                            {expandedThreats.has(threat.id) ? (
                                                <>
                                                    <ChevronUp size={14} />
                                                    Less
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown size={14} />
                                                    More
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {expandedThreats.has(threat.id) && (
                                    <div className="threat-details">
                                        {threat.example_payload && (
                                            <div className="detail-section">
                                                <div className="detail-label">Example Payload</div>
                                                <div className="detail-content">{threat.example_payload}</div>
                                            </div>
                                        )}
                                        {threat.mitigation && (
                                            <div className="detail-section">
                                                <div className="detail-label">Mitigation</div>
                                                <div className="detail-content">{threat.mitigation}</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Section B: Shared AI WAF Rules */}
            <div className="community-section">
                <div className="section-header">
                    <h2>
                        <Shield className="icon" size={24} />
                        Shared AI WAF Rules
                    </h2>
                </div>

                {rules.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🛡️</div>
                        <p>No WAF rules available yet.</p>
                    </div>
                ) : (
                    <div className="rules-grid">
                        {rules.map((rule) => (
                            <div key={rule.id} className="rule-card">
                                <div className="rule-header">
                                    <h3 className="rule-name">{rule.name}</h3>
                                    <p className="rule-description">{rule.description}</p>
                                </div>

                                <div className="rule-meta">
                                    <span className="category-badge">{rule.category}</span>
                                    <span className="rule-type-badge">{rule.rule_type.replace('_', ' ')}</span>
                                </div>

                                <div className="rule-actions">
                                    <button
                                        className="copy-btn"
                                        onClick={() => handleCopyRule(rule)}
                                    >
                                        <Copy size={16} />
                                        Copy to Workspace
                                    </button>
                                    <button
                                        className={`upvote-btn ${upvotedItems.has(rule.id) ? 'upvoted' : ''}`}
                                        onClick={() => handleUpvote(rule.id, 'rule')}
                                        disabled={upvotedItems.has(rule.id)}
                                    >
                                        <ThumbsUp size={14} />
                                        {rule.upvotes || 0}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Section C: Risk Trends Chart */}
            <div className="community-section">
                <div className="section-header">
                    <h2>
                        <BarChart3 className="icon" size={24} />
                        Threat Distribution by Category
                    </h2>
                </div>

                <div className="chart-container">
                    {categoryData.length === 0 ? (
                        <div className="empty-state">
                            <p>No category data available</p>
                        </div>
                    ) : (
                        <div className="bar-chart">
                            {categoryData.map((item) => (
                                <div key={item.category} className="bar-item">
                                    <div className="bar-label">{item.category}</div>
                                    <div className="bar-wrapper">
                                        <div
                                            className="bar-fill"
                                            style={{ width: `${(item.count / maxCount) * 100}%` }}
                                        >
                                            <span className="bar-count">{item.count}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Submit Threat Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Submit New Threat</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitThreat}>
                            <div className="form-group">
                                <label className="form-label">Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    className="form-input"
                                    value={formData.title}
                                    onChange={handleFormChange}
                                    required
                                    placeholder="e.g., SQL Injection via User Input"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description *</label>
                                <textarea
                                    name="description"
                                    className="form-textarea"
                                    value={formData.description}
                                    onChange={handleFormChange}
                                    required
                                    placeholder="Describe the threat and its impact..."
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Category *</label>
                                <select
                                    name="category"
                                    className="form-select"
                                    value={formData.category}
                                    onChange={handleFormChange}
                                    required
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confidence Score (0-1)</label>
                                <input
                                    type="number"
                                    name="confidence"
                                    className="form-input"
                                    value={formData.confidence}
                                    onChange={handleFormChange}
                                    min="0"
                                    max="1"
                                    step="0.1"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Example Payload</label>
                                <textarea
                                    name="example_payload"
                                    className="form-textarea"
                                    value={formData.example_payload}
                                    onChange={handleFormChange}
                                    placeholder="Provide an example of the malicious payload..."
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Mitigation</label>
                                <textarea
                                    name="mitigation"
                                    className="form-textarea"
                                    value={formData.mitigation}
                                    onChange={handleFormChange}
                                    placeholder="How to prevent or mitigate this threat..."
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="submit-modal-btn"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Threat'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Community;
