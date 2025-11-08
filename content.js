// Content script for Verdant Focus Forest
// Monitors user activity and interactions

let lastActivityTime = Date.now();

// Track user activity
document.addEventListener('mousemove', () => {
  lastActivityTime = Date.now();
});

document.addEventListener('keydown', () => {
  lastActivityTime = Date.now();
});

document.addEventListener('click', () => {
  lastActivityTime = Date.now();
});

// Check for inactivity
setInterval(() => {
  const timeSinceActivity = Date.now() - lastActivityTime;
  
  // If inactive for more than 5 minutes, notify background
  if (timeSinceActivity > 300000) {
    chrome.runtime.sendMessage({ action: 'userInactive' });
  }
}, 60000); // Check every minute

console.log('Verdant Focus Forest content script loaded');
