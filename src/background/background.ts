import { SessionManager } from './sessionManager';
import { BackgroundFocusTracker } from './focusTracker';
import { BackgroundWildfireController } from './wildfireController';
import { SessionStorage } from '../shared/storage/sessionStorage';
import { ForestStorage } from '../shared/storage/forestStorage';
import { FocusMonitor } from '../shared/monitoring/focusMonitor';
import { ActivityEvent } from '../shared/types';

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Verdant Focus Forest installed');
});

// Resume session on startup if active
chrome.runtime.onStartup.addListener(async () => {
  const resumed = await SessionManager.resumeSession();
  if (resumed) {
    BackgroundFocusTracker.startMonitoring();
    BackgroundWildfireController.startMonitoring();
  }
});

// Start monitoring when extension loads
(async () => {
  const session = await SessionStorage.getSessionState();
  if (session.active) {
    BackgroundFocusTracker.startMonitoring();
    BackgroundWildfireController.startMonitoring();
  }
})();

// ALWAYS run analysis every 20 seconds, regardless of session state
console.log('🚀 Starting automatic focus analysis (every 20 seconds)');
setInterval(async () => {
  try {
    const session = await SessionStorage.getSessionState();
    if (session.active && !session.paused) {
      console.log('⏰ Auto-analysis running...');
      await BackgroundFocusTracker.performFocusTick();
    } else {
      console.log('⏸️ Session not active, skipping analysis');
    }
  } catch (error) {
    console.error('Auto-analysis error:', error);
  }
}, 20000);

// Listen for messages from popup/content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case 'startSession':
          const sessionId = await SessionManager.startSession();
          BackgroundFocusTracker.startMonitoring();
          BackgroundWildfireController.startMonitoring();
          sendResponse({ success: true, sessionId });
          break;

        case 'endSession':
          await SessionManager.endSession();
          BackgroundFocusTracker.stopMonitoring();
          BackgroundWildfireController.stopMonitoring();
          sendResponse({ success: true });
          break;

        case 'getSessionData':
          const session = await SessionStorage.getSessionState();
          sendResponse({ success: true, data: session });
          break;

        case 'getForestData':
          const forest = await ForestStorage.getForestState();
          sendResponse({ success: true, data: forest });
          break;

        case 'getFocusMetrics':
          const metrics = await FocusMonitor.getFocusMetrics();
          sendResponse({ success: true, data: metrics });
          break;

        case 'userActivity':
          const activityEvent: ActivityEvent = {
            type: message.eventType,
            timestamp: Date.now(),
            data: message.data
          };
          await BackgroundFocusTracker.handleActivity(activityEvent);
          sendResponse({ success: true });
          break;

        case 'tabChanged':
          await BackgroundFocusTracker.handleTabChange(message.tabId, message.url);
          sendResponse({ success: true });
          break;

        case 'triggerFocusAnalysis':
          try {
            // Manually trigger a focus analysis
            await BackgroundFocusTracker.performFocusTick();
            sendResponse({ success: true, message: 'Analysis completed' });
          } catch (error: any) {
            sendResponse({ success: false, error: error.message });
          }
          break;

        case 'testAPI':
          try {
            const config = await chrome.storage.local.get('apiConfig');
            const apiConfig = config.apiConfig || {};
            
            if (apiConfig.provider === 'mock' || !apiConfig.apiKey) {
              sendResponse({ 
                success: true, 
                message: 'Using mock mode (no API key set). Set an OpenAI API key to test.' 
              });
              break;
            }
            
            // Test OpenAI API directly
            const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiConfig.apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  { role: 'user', content: 'Say "API test successful" if you can read this.' }
                ],
                max_tokens: 20
              })
            });
            
            if (!testResponse.ok) {
              const errorData = await testResponse.json();
              sendResponse({ 
                success: false, 
                error: `API Error: ${testResponse.status} - ${errorData.error?.message || 'Unknown error'}` 
              });
              break;
            }
            
            const result = await testResponse.json();
            sendResponse({ 
              success: true, 
              message: 'OpenAI API is working! ✓',
              response: result.choices[0].message.content
            });
          } catch (error: any) {
            sendResponse({ 
              success: false, 
              error: `Connection error: ${error.message}` 
            });
          }
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ success: false, error: String(error) });
    }
  })();
  
  return true; // Keep message channel open for async response
});

// Monitor tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      await BackgroundFocusTracker.handleTabChange(activeInfo.tabId, tab.url);
    }
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
});

// Monitor URL changes
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.url) {
    try {
      await BackgroundFocusTracker.handleTabChange(tabId, tab.url);
    } catch (error) {
      console.error('Error handling URL change:', error);
    }
  }
});

// Monitor window focus
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  try {
    const focused = windowId !== chrome.windows.WINDOW_ID_NONE;
    await FocusMonitor.updateWindowFocus(focused);
    
    if (focused) {
      // User returned, resume activity
      const activityEvent: ActivityEvent = {
        type: 'tab_switch',
        timestamp: Date.now()
      };
      await BackgroundFocusTracker.handleActivity(activityEvent);
    }
  } catch (error) {
    console.error('Error handling window focus:', error);
  }
});

// Monitor idle state
chrome.idle.onStateChanged.addListener(async (state) => {
  try {
    const session = await SessionStorage.getSessionState();
    if (!session.active) return;

    if (state === 'idle' || state === 'locked') {
      await SessionStorage.setPaused(true);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: 'Verdant - Come back!',
        message: 'Your forest growth has paused. Return to continue!'
      });
    } else {
      await SessionStorage.setPaused(false);
      const activityEvent: ActivityEvent = {
        type: 'keyboard',
        timestamp: Date.now()
      };
      await BackgroundFocusTracker.handleActivity(activityEvent);
    }
  } catch (error) {
    console.error('Error handling idle state:', error);
  }
});

// Set idle detection interval
chrome.idle.setDetectionInterval(60);

