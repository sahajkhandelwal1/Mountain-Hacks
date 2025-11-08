// DOM Elements
const startBtn = document.getElementById('startBtn');
const endBtn = document.getElementById('endBtn');
const sessionTimeEl = document.getElementById('sessionTime');
const focusScoreEl = document.getElementById('focusScore');
const treeCountEl = document.getElementById('treeCount');
const canvas = document.getElementById('forestCanvas');
const ctx = canvas.getContext('2d');
const wildfireWarning = document.getElementById('wildfire-warning');

let sessionData = {};
let updateInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSessionData();
  initializeCanvas();
  startUpdateLoop();
});

// Start session
startBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ action: 'startSession' });
  startBtn.classList.add('hidden');
  endBtn.classList.remove('hidden');
  await loadSessionData();
});

// End session
endBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ action: 'endSession' });
  endBtn.classList.add('hidden');
  startBtn.classList.remove('hidden');
  await loadSessionData();
  clearCanvas();
});

// Load session data
async function loadSessionData() {
  const response = await chrome.runtime.sendMessage({ action: 'getSessionData' });
  sessionData = response;
  
  if (sessionData.active) {
    startBtn.classList.add('hidden');
    endBtn.classList.remove('hidden');
  } else {
    startBtn.classList.remove('hidden');
    endBtn.classList.add('hidden');
  }
  
  updateUI();
}

// Update UI
function updateUI() {
  // Session time
  if (sessionData.active && sessionData.startTime) {
    const elapsed = Date.now() - sessionData.startTime;
    sessionTimeEl.textContent = formatTime(elapsed);
  } else {
    sessionTimeEl.textContent = '00:00:00';
  }
  
  // Focus score
  focusScoreEl.textContent = `${sessionData.focusScore || 100}%`;
  
  // Tree count
  treeCountEl.textContent = sessionData.treeCount || 0;
  
  // Render forest
  if (sessionData.active) {
    renderForest();
  }
}

// Format time
function formatTime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function pad(num) {
  return String(num).padStart(2, '0');
}

// Update loop
function startUpdateLoop() {
  updateInterval = setInterval(async () => {
    await loadSessionData();
  }, 1000);
}

// Initialize canvas
function initializeCanvas() {
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Ground
  ctx.fillStyle = '#90EE90';
  ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
}

// Render forest
function renderForest() {
  // Clear canvas
  clearCanvas();
  
  // Draw trees based on tree count
  const treeCount = sessionData.treeCount || 0;
  for (let i = 0; i < Math.min(treeCount, 20); i++) {
    drawTree(50 + (i % 10) * 35, 250 - Math.floor(i / 10) * 80);
  }
  
  // Draw animals (every 5 trees)
  for (let i = 0; i < Math.floor(treeCount / 5); i++) {
    drawAnimal(100 + i * 80, 260);
  }
  
  // Draw wildfire if focus score is low
  if (sessionData.focusScore < 70) {
    wildfireWarning.classList.remove('hidden');
    drawWildfire();
  } else {
    wildfireWarning.classList.add('hidden');
  }
}

// Draw tree
function drawTree(x, y) {
  // Trunk
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(x - 5, y - 30, 10, 30);
  
  // Foliage
  ctx.fillStyle = '#228B22';
  ctx.beginPath();
  ctx.arc(x, y - 35, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - 10, y - 30, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 10, y - 30, 12, 0, Math.PI * 2);
  ctx.fill();
}

// Draw animal
function drawAnimal(x, y) {
  // Simple deer silhouette
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(x, y - 10, 20, 10);
  ctx.fillRect(x + 5, y - 15, 10, 5);
}

// Draw wildfire
function drawWildfire() {
  const firePositions = [[350, 250], [320, 260], [340, 240]];
  
  firePositions.forEach(([x, y]) => {
    ctx.fillStyle = 'rgba(255, 69, 0, 0.7)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 5, y + 15);
    ctx.lineTo(x + 5, y + 15);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Clear canvas
function clearCanvas() {
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#90EE90';
  ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
}

// Listen for wildfire events
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'wildfireTriggered') {
    wildfireWarning.classList.remove('hidden');
    setTimeout(() => {
      wildfireWarning.classList.add('hidden');
    }, 3000);
  }
});
