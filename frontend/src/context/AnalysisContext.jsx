import React, { createContext, useContext, useState } from 'react';
import { sentinelAPI } from '../services/api';

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

    /**
     * Run Input Guard analysis on user input
     */
    const runInputGuard = async (userInput, artifactType = 'unknown', source = 'direct') => {
        try {
            const result = await sentinelAPI.analyzeInputGuard(userInput, artifactType, source);

            if (result.success && result.data?.waf_event) {
                const wafEvent = result.data.waf_event;

                // Add timestamp if not present
                if (!wafEvent.timestamp) {
                    wafEvent.timestamp = new Date().toISOString();
                }

                // Add to input guard events
                setWafEvents(prev => ({
                    ...prev,
                    inputGuard: [wafEvent, ...prev.inputGuard]
                }));

                return wafEvent;
            }
        } catch (error) {
            console.error('Input Guard error:', error);
        }
        return null;
    };

    /**
     * Run Output Guard analysis on AI-generated output
     */
    const runOutputGuard = async (aiOutput, agentName = 'Unknown Agent', queryType = 'general') => {
        try {
            const result = await sentinelAPI.analyzeOutputGuard(aiOutput, agentName, queryType);

            if (result.success && result.data?.waf_event) {
                const wafEvent = result.data.waf_event;

                // Add timestamp if not present
                if (!wafEvent.timestamp) {
                    wafEvent.timestamp = new Date().toISOString();
                }

                // Add to output guard events
                setWafEvents(prev => ({
                    ...prev,
                    outputGuard: [wafEvent, ...prev.outputGuard]
                }));

                return wafEvent;
            }
        } catch (error) {
            console.error('Output Guard error:', error);
        }
        return null;
    };

    /**
     * Run Behavior Guard analysis on agent behavior
     */
    const runBehaviorGuard = async (behaviorData) => {
        try {
            const result = await sentinelAPI.analyzeBehaviorGuard(behaviorData);

            if (result.success && result.data?.waf_event) {
                const wafEvent = result.data.waf_event;

                // Add timestamp if not present
                if (!wafEvent.timestamp) {
                    wafEvent.timestamp = new Date().toISOString();
                }

                // Add to behavior violations
                setWafEvents(prev => ({
                    ...prev,
                    behaviorViolations: [wafEvent, ...prev.behaviorViolations]
                }));

                return wafEvent;
            }
        } catch (error) {
            console.error('Behavior Guard error:', error);
        }
        return null;
    };

    /**
     * Analyze artifact with WAF integration
     */
    const updateAnalysisReport = async (report, artifactMeta = null) => {
        setAnalysisReport(report);
        if (artifactMeta) setLastArtifact(artifactMeta);
        setError(null);

        // Run Input Guard on the artifact content
        if (artifactMeta?.contentPreview) {
            await runInputGuard(
                artifactMeta.contentPreview,
                artifactMeta.type || 'unknown',
                'artifact_submission'
            );
        }

        // Run Output Guard on the analysis summary
        if (report?.summary) {
            await runOutputGuard(
                report.summary,
                'Risk Agent',
                'security_analysis'
            );
        }

        // Run Output Guard on findings
        if (report?.findings && report.findings.length > 0) {
            for (const finding of report.findings.slice(0, 3)) { // Limit to first 3 findings
                if (finding.description) {
                    await runOutputGuard(
                        finding.description,
                        finding.agent_name || 'Unknown Agent',
                        'finding_description'
                    );
                }
            }
        }
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
        runInputGuard,
        runOutputGuard,
        runBehaviorGuard,
    };

    return (
        <AnalysisContext.Provider value={value}>
            {children}
        </AnalysisContext.Provider>
    );
};

export default AnalysisContext;
