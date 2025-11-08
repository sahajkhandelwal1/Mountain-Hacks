import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { SessionState, ForestState, FocusMetrics } from '../shared/types';
import { formatTime, formatMinutes } from '../shared/utils/helpers';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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

  // Focus score chart data
  const focusScoreData = {
    labels: ['Focus Score'],
    datasets: [
      {
        label: 'Current Score',
        data: [session.focusScore],
        backgroundColor: 'rgba(34, 139, 34, 0.6)',
        borderColor: 'rgba(34, 139, 34, 1)',
        borderWidth: 2
      }
    ]
  };

  // Trees chart data
  const treesData = {
    labels: ['Healthy', 'Burning', 'Burnt'],
    datasets: [
      {
        label: 'Trees',
        data: [treesGrown, treesBurning, treesBurned],
        backgroundColor: [
          'rgba(34, 139, 34, 0.6)',
          'rgba(255, 69, 0, 0.6)',
          'rgba(47, 47, 47, 0.6)'
        ],
        borderColor: [
          'rgba(34, 139, 34, 1)',
          'rgba(255, 69, 0, 1)',
          'rgba(47, 47, 47, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

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
            <Bar data={focusScoreData} options={{ 
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: { beginAtZero: true, max: 100 }
              }
            }} />
          </div>
          <div className="chart-wrapper">
            <h3>Forest Status</h3>
            <Doughnut data={treesData} options={{ 
              responsive: true,
              maintainAspectRatio: false
            }} />
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

