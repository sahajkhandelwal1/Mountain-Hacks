// Session state
let sessionActive = false;
let sessionStartTime = null;
let focusScore = 100;
let treeCount = 0;
let distractionCount = 0;

// Distraction sites (configurable)
const distractionSites = [
  'youtube.com',
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'reddit.com',
  'tiktok.com',
  'netflix.com'
];

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Verdant Focus Forest installed');
  chrome.storage.local.set({
    sessionActive: false,
    sessionData: {},
    distractionSites: distractionSites
  });
});

// Listen for session start/end
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startSession') {
    startSession();
    sendResponse({ success: true });
  } else if (message.action === 'endSession') {
    endSession();
    sendResponse({ success: true });
  } else if (message.action === 'getSessionData') {
    getSessionData().then(data => sendResponse(data));
    return true; // Async response
  } else if (message.action === 'triggerWildfire') {
    triggerWildfire();
    sendResponse({ success: true });
  }
});

// Monitor tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!sessionActive) return;
  
  const tab = await chrome.tabs.get(activeInfo.tabId);
  checkForDistraction(tab.url);
});

// Monitor URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!sessionActive) return;
  if (changeInfo.url) {
    checkForDistraction(changeInfo.url);
  }
});

// Monitor idle state
chrome.idle.onStateChanged.addListener((state) => {
  if (!sessionActive) return;
  
  if (state === 'idle' || state === 'locked') {
    console.log('User idle - pausing forest growth');
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Verdant - Come back!',
      message: 'Your forest growth has paused. Return to continue!'
    });
  }
});

function startSession() {
  sessionActive = true;
  sessionStartTime = Date.now();
  focusScore = 100;
  treeCount = 0;
  distractionCount = 0;
  
  chrome.storage.local.set({
    sessionActive: true,
    sessionStartTime: sessionStartTime,
    focusScore: focusScore,
    treeCount: treeCount
  });
  
  // Set idle detection to 60 seconds
  chrome.idle.setDetectionInterval(60);
}

function endSession() {
  sessionActive = false;
  
  chrome.storage.local.set({
    sessionActive: false,
    lastSessionData: {
      duration: Date.now() - sessionStartTime,
      focusScore: focusScore,
      treeCount: treeCount,
      distractionCount: distractionCount
    }
  });
  
  sessionStartTime = null;
}

async function getSessionData() {
  const data = await chrome.storage.local.get([
    'sessionActive',
    'sessionStartTime',
    'focusScore',
    'treeCount'
  ]);
  
  return {
    active: data.sessionActive || false,
    startTime: data.sessionStartTime || null,
    focusScore: data.focusScore || 100,
    treeCount: data.treeCount || 0
  };
}

function checkForDistraction(url) {
  if (!url) return;
  
  const isDistraction = distractionSites.some(site => url.includes(site));
  
  if (isDistraction) {
    distractionCount++;
    focusScore = Math.max(0, focusScore - 10);
    
    chrome.storage.local.set({ focusScore: focusScore });
    
    // Trigger wildfire
    chrome.runtime.sendMessage({ action: 'wildfireTriggered' });
    
    // Block the site (redirect)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.update(tabs[0].id, {
          url: chrome.runtime.getURL('blocked.html')
        });
      }
    });
  }
}

function triggerWildfire() {
  console.log('Wildfire triggered!');
  // This will be handled by the popup UI
}

// Tree growth interval
setInterval(async () => {
  if (sessionActive) {
    treeCount++;
    chrome.storage.local.set({ treeCount: treeCount });
  }
}, 30000); // Every 30 seconds of focus
