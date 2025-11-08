import React, { useState, useEffect } from 'react';
import { ForestCanvas } from '../shared/components/ForestCanvas';
import { SessionControls } from '../popup/SessionControls';
import { StatsPanel } from '../popup/StatsPanel';
import { SessionState, ForestState, FocusMetrics } from '../shared/types';
import { SessionStorage } from '../shared/storage/sessionStorage';
import { ForestStorage } from '../shared/storage/forestStorage';
import { FocusMonitor } from '../shared/monitoring/focusMonitor';

export const NewTab: React.FC = () => {
  const [session, setSession] = useState<SessionState>(SessionStorage.getDefaultSessionState());
  const [forest, setForest] = useState<ForestState>(ForestStorage.getDefaultForestState());
  const [focusMetrics, setFocusMetrics] = useState<FocusMetrics>(FocusMonitor.getDefaultFocusMetrics());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [sessionData, forestData, metricsData] = await Promise.all([
        chrome.runtime.sendMessage({ action: 'getSessionData' }),
        chrome.runtime.sendMessage({ action: 'getForestData' }),
        chrome.runtime.sendMessage({ action: 'getFocusMetrics' })
      ]);

      if (sessionData.success) {
        setSession(sessionData.data);
      }
      if (forestData.success) {
        setForest(forestData.data);
      }
      if (metricsData.success) {
        setFocusMetrics(metricsData.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'startSession' });
      if (response.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handleEndSession = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'endSession' });
      if (response.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const hasWildfire = forest.wildfire.active;

  return (
    <div className="newtab-container">
      <header>
        <h1>🌲 Verdant Focus Forest</h1>
        <p className="subtitle">Grow your forest through focus</p>
      </header>

      <div className="main-content">
        <div className="forest-section">
          <div className="forest-container-full">
            <ForestCanvas
              width={800}
              height={600}
              forestState={forest}
            />
            {hasWildfire && (
              <div className="wildfire-warning-large">
                🔥 Wildfire spreading! Refocus to save your trees!
              </div>
            )}
          </div>
        </div>

        <div className="sidebar">
          <SessionControls
            session={session}
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
          />

          <StatsPanel
            session={session}
            forest={forest}
            focusMetrics={focusMetrics}
            showCharts={true}
          />

          {session.active && (
            <div className="focus-reminder">
              <h3>💡 Focus Tips</h3>
              <ul>
                <li>Stay on productive websites to grow trees</li>
                <li>Avoid distraction sites to prevent wildfires</li>
                <li>Keep working to see your forest flourish!</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

