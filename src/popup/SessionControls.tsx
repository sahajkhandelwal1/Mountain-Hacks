import React from 'react';
import { SessionState } from '../shared/types';

interface SessionControlsProps {
  session: SessionState;
  onStartSession: () => void;
  onEndSession: () => void;
}

export const SessionControls: React.FC<SessionControlsProps> = ({
  session,
  onStartSession,
  onEndSession
}) => {
  return (
    <div className="session-controls">
      {!session.active ? (
        <button className="btn btn-start" onClick={onStartSession}>
          Start Session
        </button>
      ) : (
        <button className="btn btn-end" onClick={onEndSession}>
          End Session
        </button>
      )}
      {session.active && session.paused && (
        <div className="paused-indicator">⏸️ Paused</div>
      )}
    </div>
  );
};

