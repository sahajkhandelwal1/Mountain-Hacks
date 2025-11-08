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
    console.log('🎯 Focus monitoring started - analysis every 10 seconds');
    
    // Run first analysis immediately
    this.performFocusTick().catch(err => console.error('Initial focus tick error:', err));
    
    // Focus tick every 10 seconds for responsive feedback
    this.focusTickInterval = window.setInterval(async () => {
      console.log('⏰ Running scheduled focus analysis...');
      await this.performFocusTick();
    }, 10000);
  }

  static stopMonitoring(): void {
    console.log('🛑 Focus monitoring stopped');
    if (this.focusTickInterval !== null) {
      clearInterval(this.focusTickInterval);
      this.focusTickInterval = null;
    }
    this.lowFocusStartTime = null;
  }

  static async performFocusTick(): Promise<void> {
    const session = await SessionStorage.getSessionState();
    if (!session.active || session.paused) {
      console.log('⏸️ Focus tick skipped - session not active or paused');
      return;
    }

    console.log('✅ Performing focus tick analysis...');
    
    // Get current focus metrics
    const metrics = await FocusMonitor.getFocusMetrics();
    
    // Use LLM to analyze focus (falls back to heuristics if no API key)
    const timeOnSite = Date.now() - (metrics.currentSiteArrivalTime || Date.now());
    
    // Use previous URL if currently on new tab page
    const isOnNewTab = metrics.activeUrl?.includes('chrome-extension://') || metrics.activeUrl?.includes('newtab.html');
    const urlToAnalyze = isOnNewTab && metrics.previousUrl ? metrics.previousUrl : (metrics.activeUrl || '');
    
    const analysisData: FocusAnalysisRequest = {
      currentUrl: urlToAnalyze,
      tabSwitchCount: metrics.tabSwitchCount || 0,
      timeOnCurrentSite: timeOnSite,
      recentUrls: [], // Could track this in future
      userActivity: {
        mouseMovements: 0,
        keystrokes: 0,
        scrolls: 0
      },
      sessionDuration: session.startTime ? Date.now() - session.startTime : 0,
      distractionSiteVisits: Math.floor((metrics.timeOnDistractingSites || 0) / 60000)
    };
    
    console.log(`📊 Analyzing: ${urlToAnalyze} (${isOnNewTab ? 'using previous URL' : 'current URL'}), Time: ${Math.floor(timeOnSite / 1000)}s`);

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
      // Calculate actual focused minutes from session start time
      if (session.startTime) {
        const elapsedMinutes = Math.floor((Date.now() - session.startTime) / 60000);
        await SessionStorage.setFocusedMinutes(elapsedMinutes);
      }
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
    const metrics = await FocusMonitor.getFocusMetrics();
    const previousUrl = metrics.activeUrl;
    
    // Only increment tab switch counter if switching to a different domain
    // This prevents counting refreshes or same-site navigation
    if (previousUrl) {
      try {
        const prevDomain = new URL(previousUrl).hostname;
        const newDomain = new URL(url).hostname;
        if (prevDomain !== newDomain) {
          await FocusMonitor.incrementTabSwitch();
        }
      } catch {
        // If URL parsing fails, count it as a switch
        await FocusMonitor.incrementTabSwitch();
      }
    }
    
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


