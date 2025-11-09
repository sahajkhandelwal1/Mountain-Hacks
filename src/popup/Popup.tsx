import React, { useState, useEffect } from 'react';
import { ForestCanvas } from '../shared/components/ForestCanvas';
import { SessionControls } from './SessionControls';
import { StatsPanel } from './StatsPanel';
import { FocusInsights } from './FocusInsights';
import { APISettings } from './APISettings';
import { DebugPanel } from './DebugPanel';
import { SessionState, ForestState, FocusMetrics } from '../shared/types';
import { SessionStorage } from '../shared/storage/sessionStorage';
import { ForestStorage } from '../shared/storage/forestStorage';
import { FocusMonitor } from '../shared/monitoring/focusMonitor';

export const Popup: React.FC = () => {
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

  const bgImage = chrome.runtime.getURL('images/misty-forest-main-bg.png');

  return (
    <div 
      className="bg-cover bg-center relative overflow-hidden"
      style={{ 
        backgroundImage: `url(${bgImage})`, 
        width: '380px', 
        height: '600px'
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/25" />
      
      {/* Scrollable Content Container */}
      <div className="relative z-10 h-full overflow-y-auto overflow-x-hidden p-6 space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-serif text-4xl text-white drop-shadow-lg mb-1">verdant</h1>
          <p className="text-white/80 text-sm">Grow your forest through focus</p>
        </div>

        {/* Wildfire Warning */}
        {hasWildfire && (
          <div className="bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-2xl p-3 text-center">
            <span className="text-red-200 font-medium">🔥 Wildfire spreading!</span>
          </div>
        )}

        {/* Session Controls */}
        <SessionControls
          session={session}
          onStartSession={handleStartSession}
          onEndSession={handleEndSession}
        />

        {/* Focus Insights */}
        {session.active && <FocusInsights />}

        {/* Stats Panel */}
        <StatsPanel
          session={session}
          forest={forest}
          focusMetrics={focusMetrics}
          showCharts={false}
        />

        {/* API Settings */}
        <APISettings />

        {/* Debug Panel */}
        <DebugPanel />
      </div>
    </div>
  );
};

