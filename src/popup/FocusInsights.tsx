import React, { useState, useEffect } from 'react';
import { FocusAnalysisResponse } from '../shared/api/llmFocusAnalyzer';

export const FocusInsights: React.FC = () => {
  const [analysis, setAnalysis] = useState<FocusAnalysisResponse | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [websiteScore, setWebsiteScore] = useState<number>(0);

  useEffect(() => {
    loadAnalysis();
    const interval = setInterval(loadAnalysis, 5000); // Update every 5s
    return () => clearInterval(interval);
  }, []);

  const loadAnalysis = async () => {
    try {
      const [analysisResult, metricsResult, classificationCache] = await Promise.all([
        chrome.storage.local.get(['lastFocusAnalysis', 'lastAnalysisTime']),
        chrome.runtime.sendMessage({ action: 'getFocusMetrics' }),
        chrome.storage.local.get(['websiteClassifications'])
      ]);
      
      if (analysisResult.lastFocusAnalysis) {
        setAnalysis(analysisResult.lastFocusAnalysis);
        setLastUpdate(analysisResult.lastAnalysisTime || 0);
      }
      
      if (metricsResult.success && metricsResult.data?.activeUrl) {
        const url = metricsResult.data.activeUrl;
        setCurrentUrl(url);
        
        // Get website classification score
        const domain = new URL(url).hostname.replace('www.', '');
        const classifications = classificationCache.websiteClassifications || {};
        const classification = classifications[domain];
        
        if (classification) {
          setWebsiteScore(classification.score);
        }
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
    }
  };

  if (!analysis) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#22c55e';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getDistractionIcon = (level: string) => {
    switch (level) {
      case 'low': return '✅';
      case 'medium': return '⚠️';
      case 'high': return '🔥';
      default: return '📊';
    }
  };

  return (
    <div className="focus-insights">
      <h3>🧠 AI Focus Analysis</h3>
      
      {currentUrl && (
        <div className="current-site-info">
          <strong>Current Site:</strong> {new URL(currentUrl).hostname}
          {websiteScore > 0 && (
            <span className="site-score" style={{ color: getScoreColor(websiteScore) }}>
              {' '}({websiteScore}/100)
            </span>
          )}
        </div>
      )}
      
      <div className="focus-score-display">
        <div 
          className="score-circle" 
          style={{ borderColor: getScoreColor(analysis.focusScore) }}
        >
          <span className="score-number">{Math.round(analysis.focusScore)}</span>
          <span className="score-label">Overall</span>
        </div>
        <div className="distraction-badge">
          {getDistractionIcon(analysis.distractionLevel)} {analysis.distractionLevel} distraction
        </div>
      </div>

      <div className="analysis-reasoning">
        <p>{analysis.reasoning}</p>
      </div>

      {analysis.suggestions && analysis.suggestions.length > 0 && (
        <div className="suggestions">
          <h4>💡 Suggestions:</h4>
          <ul>
            {analysis.suggestions.map((suggestion, i) => (
              <li key={i}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="last-update">
        Updated {Math.floor((Date.now() - lastUpdate) / 1000)}s ago
      </div>
    </div>
  );
};
