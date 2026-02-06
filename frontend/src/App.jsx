import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnalysisProvider } from './context/AnalysisContext';
import Layout from './components/layout/Layout';
import RiskSummary from './pages/RiskSummary';
import Remediation from './pages/Remediation';
import ThreatModeling from './pages/ThreatModeling';
import SecurityReview from './pages/SecurityReview';
import Overview from './pages/Overview';
import SocAlerts from './pages/SocAlerts';
import ArtifactInput from './pages/ArtifactInput';
import MLAnalytics from './pages/MLAnalytics';
import AIWaf from './pages/AIWaf';

function App() {
  return (
    <AnalysisProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/risk-summary" replace />} /> {/* Default to Risk Summary as per Image 1 prominence */}
            <Route path="/overview" element={<Overview />} />
            <Route path="/risk-summary" element={<RiskSummary />} />
            <Route path="/remediation" element={<Remediation />} />
            <Route path="/threat-modeling" element={<ThreatModeling />} />
            <Route path="/security-review" element={<SecurityReview />} />
            <Route path="/soc-alerts" element={<SocAlerts />} />
            <Route path="/add-artifact" element={<ArtifactInput />} />
            <Route path="/ml-analytics" element={<MLAnalytics />} />
            <Route path="/ai-waf" element={<AIWaf />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AnalysisProvider>
  );
}

export default App;
