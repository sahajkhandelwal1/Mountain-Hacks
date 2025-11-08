import { FocusMetrics, ActivityEvent, STORAGE_KEYS } from '../types';
import { DistractionDetector } from './distractionDetector';

export class FocusMonitor {
  private static readonly FOCUS_TICK_INTERVAL = 60000; // 1 minute
  private static readonly INACTIVITY_THRESHOLD = 300000; // 5 minutes
  private static readonly WILDFIRE_TRIGGER_THRESHOLD = 0.3;
  private static readonly WILDFIRE_TRIGGER_DURATION = 60000; // 60 seconds

  static async getFocusMetrics(): Promise<FocusMetrics> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.FOCUS_METRICS);
    return result[STORAGE_KEYS.FOCUS_METRICS] || this.getDefaultFocusMetrics();
  }

  static async setFocusMetrics(metrics: FocusMetrics): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.FOCUS_METRICS]: metrics });
  }

  static async updateFocusMetrics(updates: Partial<FocusMetrics>): Promise<void> {
    const current = await this.getFocusMetrics();
    await this.setFocusMetrics({ ...current, ...updates });
  }

  static async calculateDistractionScore(url: string | null, tabSwitches: number, timeOnDistracting: number): Promise<number> {
    if (!url) return 1.0; // No URL = perfect focus (likely not loaded yet)

    const { isDistraction, penalty } = await DistractionDetector.isDistractionSite(url);
    
    // Base score starts at 1.0 (perfect focus)
    let score = 1.0;

    // Penalty for being on distraction site
    if (isDistraction) {
      score -= penalty;
    }

    // Penalty for frequent tab switching (indicates distraction)
    // More than 5 switches in a minute = distraction
    if (tabSwitches > 5) {
      score -= 0.1 * Math.min(1, tabSwitches / 10);
    }

    // Penalty for time spent on distracting sites
    // More than 30 seconds = significant penalty
    if (timeOnDistracting > 30) {
      score -= 0.15 * Math.min(1, timeOnDistracting / 120);
    }

    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  static async updateActivity(event: ActivityEvent): Promise<void> {
    const metrics = await this.getFocusMetrics();
    
    metrics.lastActivityTimestamp = event.timestamp;
    
    if (event.type === 'tab_switch') {
      metrics.tabSwitchCount += 1;
    }
    
    await this.setFocusMetrics(metrics);
  }

  static async updateTabInfo(tabId: number, url: string): Promise<void> {
    const metrics = await this.getFocusMetrics();
    
    if (metrics.activeTabId !== tabId) {
      metrics.activeTabId = tabId;
      metrics.activeUrl = url;
      // Reset tab switch count on new tab (we'll track switches separately)
    } else {
      metrics.activeUrl = url;
    }
    
    await this.setFocusMetrics(metrics);
  }

  static async updateVisibility(visible: boolean): Promise<void> {
    await this.updateFocusMetrics({ tabVisible: visible });
  }

  static async updateWindowFocus(focused: boolean): Promise<void> {
    await this.updateFocusMetrics({ windowFocused: focused });
  }

  static async checkInactivity(): Promise<boolean> {
    const metrics = await this.getFocusMetrics();
    const now = Date.now();
    const inactivityDuration = (now - metrics.lastActivityTimestamp) / 1000;
    
    metrics.inactivityDuration = inactivityDuration;
    await this.setFocusMetrics(metrics);
    
    return inactivityDuration > this.INACTIVITY_THRESHOLD / 1000;
  }

  static async shouldTriggerWildfire(): Promise<boolean> {
    const metrics = await this.getFocusMetrics();
    return metrics.distractionScore < this.WILDFIRE_TRIGGER_THRESHOLD;
  }

  static async resetTabSwitchCount(): Promise<void> {
    await this.updateFocusMetrics({ tabSwitchCount: 0 });
  }

  static async resetTimeOnDistractingSites(): Promise<void> {
    await this.updateFocusMetrics({ timeOnDistractingSites: 0 });
  }

  static getDefaultFocusMetrics(): FocusMetrics {
    return {
      activeTabId: null,
      activeUrl: null,
      windowFocused: true,
      tabVisible: true,
      lastActivityTimestamp: Date.now(),
      tabSwitchCount: 0,
      distractionScore: 1.0,
      timeOnDistractingSites: 0,
      inactivityDuration: 0
    };
  }

  static async clearFocusMetrics(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEYS.FOCUS_METRICS);
  }
}

