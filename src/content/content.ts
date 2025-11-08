// Content script for tracking user activity

let lastActivityTime = Date.now();
let activityCheckInterval: number | null = null;

// Track mouse movement
document.addEventListener('mousemove', () => {
  reportActivity('mouse');
});

// Track keyboard input
document.addEventListener('keydown', () => {
  reportActivity('keyboard');
});

// Track clicks
document.addEventListener('click', () => {
  reportActivity('mouse');
});

// Track scrolling
let scrollTimeout: number | null = null;
document.addEventListener('scroll', () => {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  scrollTimeout = window.setTimeout(() => {
    reportActivity('scroll');
  }, 100);
});

// Track visibility changes
document.addEventListener('visibilitychange', () => {
  const visible = !document.hidden;
  chrome.runtime.sendMessage({
    action: 'userActivity',
    eventType: 'tab_switch',
    data: { visible }
  }).catch(() => {
    // Ignore errors if extension context is invalid
  });
});

// Report activity to background script
function reportActivity(type: 'mouse' | 'keyboard' | 'scroll'): void {
  const now = Date.now();
  // Throttle activity reports to once per second
  if (now - lastActivityTime < 1000) {
    return;
  }
  
  lastActivityTime = now;
  
  chrome.runtime.sendMessage({
    action: 'userActivity',
    eventType: type,
    data: { timestamp: now }
  }).catch(() => {
    // Ignore errors if extension context is invalid
  });
}

// Periodically check for inactivity
function startActivityMonitoring(): void {
  if (activityCheckInterval) {
    return;
  }
  
  activityCheckInterval = window.setInterval(() => {
    const timeSinceActivity = Date.now() - lastActivityTime;
    
    // If inactive for more than 5 minutes, notify background
    if (timeSinceActivity > 300000) {
      chrome.runtime.sendMessage({
        action: 'userActivity',
        eventType: 'keyboard',
        data: { inactive: true, duration: timeSinceActivity }
      }).catch(() => {
        // Ignore errors
      });
    }
  }, 60000); // Check every minute
}

// Start monitoring
startActivityMonitoring();

console.log('Verdant Focus Forest content script loaded');

