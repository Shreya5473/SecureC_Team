import { getApiUrl, getWsUrl } from '../config';

/**
 * API Service for Sentinel Backend
 * Handles all communication with the FastAPI backend
 */

class SentinelAPI {
    /**
     * Analyze an artifact using the multi-agent system
     * @param {Object} artifactData - The artifact data to analyze
     * @param {string} artifactData.artifact_type - Type: 'code', 'architecture', 'logs', 'api_spec'
     * @param {string} artifactData.content - The content to analyze
     * @param {Object} artifactData.metadata - Optional metadata
     * @returns {Promise<Object>} Security report with findings
     */
    async analyzeArtifact(artifactData) {
        try {
            const response = await fetch(getApiUrl('/analyze'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(artifactData),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return {
                success: true,
                data,
            };
        } catch (error) {
            console.error('Error analyzing artifact:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Connect to WebSocket for real-time agent monitoring
     * @param {Function} onMessage - Callback for incoming messages
     * @param {Function} onError - Callback for errors
     * @returns {WebSocket} WebSocket connection
     */
    connectMonitor(onMessage, onError) {
        try {
            const ws = new WebSocket(getWsUrl('/ws/monitor'));

            ws.onopen = () => {
                console.log('WebSocket connected to agent monitor');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    onMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                if (onError) onError(error);
            };

            ws.onclose = () => {
                console.log('WebSocket connection closed');
            };

            return ws;
        } catch (error) {
            console.error('Error creating WebSocket:', error);
            if (onError) onError(error);
            return null;
        }
    }

    /**
     * Analyze PDF via multipart upload
     * @param {File} file - PDF file
     */
    async analyzePdfUpload(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch(getApiUrl('/analyze/pdf/upload'), {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('PDF upload analysis error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Analyze PDF from URL
     * @param {string} url - PDF URL
     */
    async analyzePdfUrl(url) {
        try {
            const response = await fetch(getApiUrl('/analyze/pdf/url'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });
            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('PDF URL analysis error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Analyze GitHub link (repo, file, commit, PR)
     * @param {string} url - GitHub URL
     */
    async analyzeGitHub(url) {
        try {
            const response = await fetch(getApiUrl('/analyze/github'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });
            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('GitHub analysis error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * WAF: Analyze user input for security threats
     * @param {string} userInput - User input to analyze
     * @param {string} artifactType - Type of artifact
     * @param {string} source - Source of input
     */
    async analyzeInputGuard(userInput, artifactType = 'unknown', source = 'direct') {
        try {
            const response = await fetch(getApiUrl('/waf/input-guard'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_input: userInput,
                    artifact_type: artifactType,
                    source: source
                }),
            });
            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('Input Guard analysis error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * WAF: Analyze AI output for sensitive data
     * @param {string} aiOutput - AI-generated output to analyze
     * @param {string} agentName - Name of the agent that generated the output
     * @param {string} queryType - Type of query
     */
    async analyzeOutputGuard(aiOutput, agentName = 'Unknown Agent', queryType = 'general') {
        try {
            const response = await fetch(getApiUrl('/waf/output-guard'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ai_output: aiOutput,
                    agent_name: agentName,
                    query_type: queryType
                }),
            });
            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('Output Guard analysis error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * WAF: Analyze agent behavior for policy violations
     * @param {Object} behaviorData - Agent behavior data
     */
    async analyzeBehaviorGuard(behaviorData) {
        try {
            const response = await fetch(getApiUrl('/waf/behavior-guard'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(behaviorData),
            });
            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('Behavior Guard analysis error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * WAF: Test all guards
     */
    async testWaf() {
        try {
            const response = await fetch(getApiUrl('/waf/test'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('WAF test error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check backend health
     * @returns {Promise<Object>} Health status
     */
    async checkHealth() {
        try {
            const response = await fetch(getApiUrl('/'));
            const data = await response.json();
            return {
                success: true,
                data,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

// Export singleton instance
export const sentinelAPI = new SentinelAPI();
export default sentinelAPI;
