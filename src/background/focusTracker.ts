import { FocusMonitor } from '../shared/monitoring/focusMonitor';
import { SessionStorage } from '../shared/storage/sessionStorage';
import { ForestStorage } from '../shared/storage/forestStorage';
import { SessionManager } from './sessionManager';
import { BackgroundWildfireController } from './wildfireController';
import { ActivityEvent } from '../shared/types';
import { DistractionDetector } from '../shared/monitoring/distractionDetector';
import { WildfireController } from '../shared/forest/Wildfire';
import { LLMFocusAnalyzer, FocusAnalysisRequest } from '../shared/api/llmFocusAnalyzer';

export class BackgroundFocusTracker {
  private static focusTickInterval: number | null = null;
  private static lowFocusStartTime: number | null = null;
  private static readonly WILDFIRE_TRIGGER_DURATION = 60000; // 60 seconds

  static startMonitoring(): void {
    // Focus tick every 10 seconds for responsive feedback
    this.focusTickInterval = window.setInterval(async () => {
      await this.performFocusTick();
    }, 10000);
  }

  static stopMonitoring(): void {
    if (this.focusTickInterval !== null) {
      clearInterval(this.focusTickInterval);
      this.focusTickInterval = null;
    }
    this.lowFocusStartTime = null;
  }

  static async performFocusTick(): Promise<void> {
    const session = await SessionStorage.getSessionState();
    if (!session.active || session.paused) {
      return;
    }

    // Get current focus metrics
    const metrics = await FocusMonitor.getFocusMetrics();
    
    // Use LLM to analyze focus (falls back to heuristics if no API key)
    const analysisData: FocusAnalysisRequest = {
      currentUrl: metrics.activeUrl || '',
      tabSwitchCount: metrics.tabSwitchCount || 0,
      timeOnCurrentSite: Date.now() - (metrics.lastActivityTimestamp || Date.now()),
      recentUrls: [], // Could track this in future
      userActivity: {
        mouseMovements: 0,
        keystrokes: 0,
        scrolls: 0
      },
      sessionDuration: session.startTime ? Date.now() - session.startTime : 0,
      distractionSiteVisits: Math.floor((metrics.timeOnDistractingSites || 0) / 60000)
    };

    const analysis = await LLMFocusAnalyzer.analyzeFocus(analysisData);
    const focusScore = analysis.focusScore;
    
    console.log('LLM Focus Analysis:', analysis);
    
    // Calculate distraction score (inverse of focus score, 0-1 scale)
    const distractionScore = (100 - focusScore) / 100;

    // Update metrics
    await FocusMonitor.updateFocusMetrics({ distractionScore });
    
    // Store LLM suggestions for display
    await chrome.storage.local.set({ 
      lastFocusAnalysis: analysis,
      lastAnalysisTime: Date.now()
    });
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

    // Always grow trees passively when session is active
    if (!isInactive) {
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
    // Increment tab switch counter
    await FocusMonitor.incrementTabSwitch();
    
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


