import React, { useState, useEffect } from 'react';

interface DebugInfo {
  apiProvider: string;
  hasApiKey: boolean;
  lastAnalysisTime: number;
  lastAnalysis: any;
  lastClassification: any;
  currentUrl: string;
  focusScore: number;
  tabSwitches: number;
}

export const DebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded) {
      loadDebugInfo();
      const interval = setInterval(loadDebugInfo, 2000);
      return () => clearInterval(interval);
    }
  }, [expanded]);

  const loadDebugInfo = async () => {
    try {
      const [config, analysis, session, metrics] = await Promise.all([
        chrome.storage.local.get(['apiConfig']),
        chrome.storage.local.get(['lastFocusAnalysis', 'lastAnalysisTime']),
        chrome.runtime.sendMessage({ action: 'getSessionData' }),
        chrome.runtime.sendMessage({ action: 'getFocusMetrics' })
      ]);

      const apiConfig = config.apiConfig || {};
      
      setDebugInfo({
        apiProvider: apiConfig.provider || 'mock',
        hasApiKey: !!apiConfig.apiKey,
        lastAnalysisTime: analysis.lastAnalysisTime || 0,
        lastAnalysis: analysis.lastFocusAnalysis,
        lastClassification: null,
        currentUrl: metrics.data?.activeUrl || 'N/A',
        focusScore: session.data?.focusScore || 0,
        tabSwitches: metrics.data?.tabSwitchCount || 0
      });
    } catch (error) {
      console.error('Error loading debug info:', error);
    }
  };

  const testAPI = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'testAPI' });
      alert(response.success ? 'API is working!' : `API Error: ${response.error}`);
    } catch (error) {
      alert(`Test failed: ${error}`);
    }
  };

  const triggerAnalysis = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'triggerFocusAnalysis' });
      if (response.success) {
        alert('Analysis triggered! Check results in a moment.');
        setTimeout(loadDebugInfo, 2000);
      } else {
        alert(`Error: ${response.error}`);
      }
    } catch (error) {
      alert(`Failed: ${error}`);
    }
  };

  if (!expanded) {
    return (
      <button className="debug-toggle" onClick={() => setExpanded(true)}>
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <h3>🐛 Debug Info</h3>
        <button onClick={() => setExpanded(false)}>✕</button>
      </div>

      {debugInfo && (
        <div className="debug-content">
          <div className="debug-item">
            <strong>API Provider:</strong> {debugInfo.apiProvider}
            {debugInfo.apiProvider === 'openai' && (
              <span className={debugInfo.hasApiKey ? 'status-ok' : 'status-error'}>
                {debugInfo.hasApiKey ? ' ✓ Key Set' : ' ✗ No Key'}
              </span>
            )}
          </div>

          <div className="debug-item">
            <strong>Current URL:</strong> {debugInfo.currentUrl}
          </div>

          <div className="debug-item">
            <strong>Focus Score:</strong> {Math.round(debugInfo.focusScore)}
          </div>

          <div className="debug-item">
            <strong>Tab Switches:</strong> {debugInfo.tabSwitches}
          </div>

          <div className="debug-item">
            <strong>Last Analysis:</strong>{' '}
            {debugInfo.lastAnalysisTime > 0
              ? `${Math.floor((Date.now() - debugInfo.lastAnalysisTime) / 1000)}s ago`
              : 'Not yet run (waits 1 minute)'}
          </div>

          {debugInfo.lastAnalysis && (
            <div className="debug-item">
              <strong>Last Score:</strong> {debugInfo.lastAnalysis.focusScore}
              <br />
              <small>{debugInfo.lastAnalysis.reasoning}</small>
            </div>
          )}

          <div className="debug-buttons">
            <button className="btn-test-api" onClick={triggerAnalysis}>
              Run Analysis Now
            </button>
            <button className="btn-test-api" onClick={testAPI}>
              Test API
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
