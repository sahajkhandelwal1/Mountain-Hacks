import { FocusMonitor } from '../shared/monitoring/focusMonitor';
import { SessionStorage } from '../shared/storage/sessionStorage';
import { ForestStorage } from '../shared/storage/forestStorage';
import { SessionManager } from './sessionManager';
import { BackgroundWildfireController } from './wildfireController';
import { ActivityEvent } from '../shared/types';
import { DistractionDetector } from '../shared/monitoring/distractionDetector';
import { WildfireController } from '../shared/forest/Wildfire';

export class BackgroundFocusTracker {
  private static focusTickInterval: number | null = null;
  private static lowFocusStartTime: number | null = null;
  private static readonly WILDFIRE_TRIGGER_DURATION = 60000; // 60 seconds

  static startMonitoring(): void {
    // Focus tick every 1 minute
    this.focusTickInterval = window.setInterval(async () => {
      await this.performFocusTick();
    }, 60000);
  }

  static stopMonitoring(): void {
    if (this.focusTickInterval !== null) {
      clearInterval(this.focusTickInterval);
      this.focusTickInterval = null;
    }
    this.lowFocusStartTime = null;
  }

  private static async performFocusTick(): Promise<void> {
    const session = await SessionStorage.getSessionState();
    if (!session.active || session.paused) {
      return;
    }

    // Get current focus metrics
    const metrics = await FocusMonitor.getFocusMetrics();
    
    // Calculate distraction score based on current URL and activity
    const distractionScore = await FocusMonitor.calculateDistractionScore(
      metrics.activeUrl,
      metrics.tabSwitchCount,
      metrics.timeOnDistractingSites
    );

    // Update distraction score
    await FocusMonitor.updateFocusMetrics({ distractionScore });

    // Update session focus score (convert 0-1 to 0-100)
    const focusScore = distractionScore * 100;
    await SessionStorage.updateFocusScore(focusScore);

    // Check for inactivity
    const isInactive = await FocusMonitor.checkInactivity();
    if (isInactive) {
      await SessionStorage.setPaused(true);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: 'Verdant - Come back!',
        message: 'Your forest growth has paused. Return to continue!'
      });
      return;
    } else {
      await SessionStorage.setPaused(false);
    }

    // If focused, add tree
    if (focusScore > 50 && !isInactive) {
      await SessionStorage.incrementFocusedMinutes();
      await SessionManager.addTreeOnFocusTick(focusScore);
    }

    // Check for wildfire trigger
    if (distractionScore < 0.3) {
      if (this.lowFocusStartTime === null) {
        this.lowFocusStartTime = Date.now();
      } else {
        const lowFocusDuration = Date.now() - this.lowFocusStartTime;
        if (lowFocusDuration >= this.WILDFIRE_TRIGGER_DURATION) {
          // Trigger wildfire
          const forestState = await ForestStorage.getForestState();
          if (!forestState.wildfire.active) {
            await BackgroundWildfireController.triggerWildfire();
            chrome.notifications.create({
              type: 'basic',
              iconUrl: chrome.runtime.getURL('icons/icon128.png'),
              title: '🔥 Wildfire Alert!',
              message: 'A wildfire is starting! Refocus to save your trees!'
            });
          }
        }
      }
    } else {
      // Reset low focus timer if focus improves
      this.lowFocusStartTime = null;
      
      // If focus improves and wildfire is active, stop it
      const forestState = await ForestStorage.getForestState();
      if (forestState.wildfire.active && focusScore > 70) {
        await WildfireController.stopWildfire();
        await WildfireController.recoverTrees();
      }
    }

    // Reset counters for next tick
    await FocusMonitor.resetTabSwitchCount();
  }

  static async handleActivity(event: ActivityEvent): Promise<void> {
    await FocusMonitor.updateActivity(event);
    await SessionStorage.updateActivityTimestamp();
    
    // Resume if paused
    const session = await SessionStorage.getSessionState();
    if (session.paused) {
      await SessionStorage.setPaused(false);
    }
  }

  static async handleTabChange(tabId: number, url: string): Promise<void> {
    await FocusMonitor.updateTabInfo(tabId, url);
    
    // Check if it's a distraction site
    const { isDistraction, penalty } = await DistractionDetector.isDistractionSite(url);
    if (isDistraction) {
      await SessionStorage.incrementDistractionCount();
      
      // Update focus score immediately
      const session = await SessionStorage.getSessionState();
      const newScore = Math.max(0, session.focusScore - penalty * 100);
      await SessionStorage.updateFocusScore(newScore);
    }
  }
}


