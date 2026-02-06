import React, { createContext, useContext, useState } from 'react';

const AnalysisContext = createContext();

export const useAnalysis = () => {
    const context = useContext(AnalysisContext);
    if (!context) {
        throw new Error('useAnalysis must be used within AnalysisProvider');
    }
    return context;
};

export const AnalysisProvider = ({ children }) => {
    const [analysisReport, setAnalysisReport] = useState(null);
    const [lastArtifact, setLastArtifact] = useState(null); // { type, contentPreview }
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);

    // WAF Events Storage
    const [wafEvents, setWafEvents] = useState({
        inputGuard: [],
        outputGuard: [],
        behaviorViolations: []
    });

    const simulateWafEvent = (report, meta) => {
        if (!report) return;
        // Simulate event for high-risk artifacts or GitHub repos (demo purpose)
        const isHighRisk = report.overall_score < 70 || meta?.type === 'code_repository';

        if (isHighRisk) {
            const newEvent = {
                timestamp: new Date().toISOString(),
                originalInput: meta?.contentPreview || "Analyzed Artifact Content",
                detectionType: meta?.type === 'code_repository' ? "Repo Scan" : "High Risk Pattern",
                confidence: 0.85,
                action: "Sanitized",
                severity: "medium",
                reason: "Detected potential security risks in the submitted artifact.",
                modificationSummary: "Sanitized input for safe processing."
            };
            setWafEvents(prev => ({
                ...prev,
                inputGuard: [newEvent, ...prev.inputGuard]
            }));
        }
    };

    const updateAnalysisReport = (report, artifactMeta = null) => {
        setAnalysisReport(report);
        if (artifactMeta) setLastArtifact(artifactMeta);
        setError(null);
        simulateWafEvent(report, artifactMeta);
    };

    const clearAnalysisReport = () => {
        setAnalysisReport(null);
        setLastArtifact(null);
        setError(null);
    };

    const setAnalysisError = (err) => {
        setError(err);
    };

    const value = {
        analysisReport,
        lastArtifact,
        isAnalyzing,
        error,
        updateAnalysisReport,
        clearAnalysisReport,
        setIsAnalyzing,
        setAnalysisError,
        wafEvents,
    };

    return (
        <AnalysisContext.Provider value={value}>
            {children}
        </AnalysisContext.Provider>
    );
};

export default AnalysisContext;
