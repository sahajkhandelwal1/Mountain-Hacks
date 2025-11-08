import { SessionState, STORAGE_KEYS } from '../types';

export class SessionStorage {
  static async getSessionState(): Promise<SessionState> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SESSION_STATE);
    return result[STORAGE_KEYS.SESSION_STATE] || this.getDefaultSessionState();
  }

  static async setSessionState(state: SessionState): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.SESSION_STATE]: state });
  }

  static async updateSessionState(updates: Partial<SessionState>): Promise<void> {
    const current = await this.getSessionState();
    await this.setSessionState({ ...current, ...updates });
  }

  static async startSession(sessionId: string): Promise<void> {
    const state: SessionState = {
      active: true,
      sessionId,
      startTime: Date.now(),
      endTime: null,
      focusScore: 100,
      focusedMinutes: 0,
      distractionCount: 0,
      lastActivityTimestamp: Date.now(),
      paused: false
    };
    await this.setSessionState(state);
  }

  static async endSession(): Promise<void> {
    const current = await this.getSessionState();
    await this.updateSessionState({
      active: false,
      endTime: Date.now()
    });
  }

  static async resumeSession(): Promise<SessionState | null> {
    const state = await this.getSessionState();
    if (state.active && state.startTime) {
      // Update last activity timestamp
      state.lastActivityTimestamp = Date.now();
      await this.setSessionState(state);
      return state;
    }
    return null;
  }

  static async updateFocusScore(score: number): Promise<void> {
    await this.updateSessionState({ focusScore: Math.max(0, Math.min(100, score)) });
  }

  static async incrementDistractionCount(): Promise<void> {
    const current = await this.getSessionState();
    await this.updateSessionState({ distractionCount: current.distractionCount + 1 });
  }

  static async updateActivityTimestamp(): Promise<void> {
    await this.updateSessionState({ lastActivityTimestamp: Date.now() });
  }

  static async setPaused(paused: boolean): Promise<void> {
    await this.updateSessionState({ paused });
  }

  static async incrementFocusedMinutes(): Promise<void> {
    const current = await this.getSessionState();
    await this.updateSessionState({ focusedMinutes: current.focusedMinutes + 1 });
  }

  static getDefaultSessionState(): SessionState {
    return {
      active: false,
      sessionId: '',
      startTime: null,
      endTime: null,
      focusScore: 100,
      focusedMinutes: 0,
      distractionCount: 0,
      lastActivityTimestamp: Date.now(),
      paused: false
    };
  }

  static async clearSession(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEYS.SESSION_STATE);
  }
}

