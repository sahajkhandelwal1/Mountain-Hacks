import React, { useState } from 'react';
import { SessionState, ForestState, FocusMetrics } from '../shared/types';
import { formatTime, formatMinutes } from '../shared/utils/helpers';

interface StatsPanelProps {
  session: SessionState;
  forest: ForestState;
  focusMetrics: FocusMetrics;
  showCharts?: boolean;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  session,
  forest,
  focusMetrics,
  showCharts = false
}) => {
  const [chartsVisible, setChartsVisible] = useState(showCharts);

  const sessionDuration = session.active && session.startTime
    ? Date.now() - session.startTime
    : 0;

  const treesGrown = forest.trees.filter(t => t.status === 'healthy').length;
  const treesBurned = forest.trees.filter(t => t.status === 'burnt').length;
  const treesBurning = forest.trees.filter(t => t.status === 'burning').length;
  const totalTrees = treesGrown + treesBurned + treesBurning;

  return (
    <div className="stats-panel">
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Session Time</span>
          <span className="stat-value">{formatTime(sessionDuration)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Focus Score</span>
          <span className="stat-value">{Math.round(session.focusScore)}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Trees Grown</span>
          <span className="stat-value">{treesGrown}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Focused Minutes</span>
          <span className="stat-value">{session.focusedMinutes}</span>
        </div>
      </div>

      {chartsVisible && (
        <div className="charts-container">
          <div className="chart-wrapper">
            <h3>Focus Score</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${session.focusScore}%`,
                  backgroundColor: session.focusScore > 70 ? '#228B22' : session.focusScore > 40 ? '#FFA500' : '#FF4500'
                }}
              />
              <span className="progress-label">{Math.round(session.focusScore)}%</span>
            </div>
          </div>
          <div className="chart-wrapper">
            <h3>Forest Status</h3>
            <div className="tree-stats">
              <div className="tree-stat-item">
                <div className="tree-stat-bar" style={{ 
                  width: totalTrees > 0 ? `${(treesGrown / totalTrees) * 100}%` : '0%',
                  backgroundColor: '#228B22'
                }} />
                <span>Healthy: {treesGrown}</span>
              </div>
              <div className="tree-stat-item">
                <div className="tree-stat-bar" style={{ 
                  width: totalTrees > 0 ? `${(treesBurning / totalTrees) * 100}%` : '0%',
                  backgroundColor: '#FF4500'
                }} />
                <span>Burning: {treesBurning}</span>
              </div>
              <div className="tree-stat-item">
                <div className="tree-stat-bar" style={{ 
                  width: totalTrees > 0 ? `${(treesBurned / totalTrees) * 100}%` : '0%',
                  backgroundColor: '#2F2F2F'
                }} />
                <span>Burnt: {treesBurned}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <button 
        className="btn-toggle-charts"
        onClick={() => setChartsVisible(!chartsVisible)}
      >
        {chartsVisible ? 'Hide Charts' : 'Show Charts'}
      </button>
    </div>
  );
};

