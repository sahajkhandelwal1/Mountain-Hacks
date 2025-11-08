# 🌲 Verdant — Focus Forest Extension (Wildfire Edition)

A Chrome extension that gamifies focus by growing a living forest ecosystem while you work. Get distracted? Watch wildfires spread through your creation!

## 🎯 Overview

**Problem:** Browser distractions kill productivity and focus.

**Solution:** Verdant turns focus into a visual, gamified experience where:
- 🌳 **Forest Growth**: Your focused work grows a 2D forest with AI-generated trees, animals, and decorations
- 🔥 **Wildfires**: Visiting distraction sites triggers spreading wildfires that destroy parts of your forest
- ⏸️ **Inactivity Handling**: No input pauses growth and triggers return notifications
- 💾 **Persistent Sessions**: Sessions continue across browser restarts until manually ended
- 🎮 **Interactive Controls**: Demo-ready Start/End session buttons

## 🚀 Features

### Core Mechanics
- **Dynamic Forest Rendering**: Canvas-based 2D forest that grows over time
- **Wildfire System**: Distractions trigger progressive fire spread
- **Focus Scoring**: Real-time focus score (0-100%) based on behavior
- **Tree Counter**: Visual progress indicator
- **Session Timer**: Track your focus sessions
- **Site Blocking**: Redirect from distraction sites to focus reminder

### Technical Features
- Chrome Manifest V3 compliant
- Service worker for persistent background monitoring
- Canvas rendering for dynamic visuals
- Local storage for session persistence
- Idle detection for inactivity handling
- Notification system for engagement

## 📁 Project Structure

```
Mountain-Hacks/
├── manifest.json          # Extension manifest
├── popup.html            # Main extension popup
├── popup.js              # Popup UI logic and rendering
├── background.js         # Service worker for monitoring
├── content.js            # Content script for activity tracking
├── blocked.html          # Distraction blocking page
├── styles/
│   └── popup.css         # Popup styling
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🛠️ Setup Instructions

### 1. Install Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `Mountain-Hacks` folder
5. The Verdant icon should appear in your extensions toolbar

### 2. Create Icons

Create placeholder icons or generate them:
```bash
mkdir icons
# Add your 16x16, 48x48, and 128x128 PNG icons
```

### 3. Start Developing

The extension is now loaded! Click the extension icon to:
- Start a focus session
- Watch your forest grow
- See wildfires when you get distracted

## 🎮 How to Use

1. **Start Session**: Click "Start Session" in the popup
2. **Stay Focused**: Work on allowed sites to grow trees
3. **Avoid Distractions**: Blocked sites trigger wildfires
4. **Watch Growth**: A new tree grows every 30 seconds of focus
5. **End Session**: Click "End Session" when done

## 🔧 Customization

### Add/Remove Blocked Sites

Edit `background.js`:
```javascript
const distractionSites = [
  'youtube.com',
  'facebook.com',
  'instagram.com',
  // Add your own here
];
```

### Adjust Tree Growth Rate

In `background.js`, modify the interval:
```javascript
setInterval(async () => {
  if (sessionActive) {
    treeCount++;
    chrome.storage.local.set({ treeCount: treeCount });
  }
}, 30000); // Change this value (milliseconds)
```

### Modify Wildfire Behavior

In `background.js`:
```javascript
function checkForDistraction(url) {
  if (isDistraction) {
    focusScore = Math.max(0, focusScore - 10); // Adjust penalty
  }
}
```

## 🎨 Future Enhancements

- [ ] AI-generated tree sprites using generative models
- [ ] Multiple forest biomes (desert, jungle, snow)
- [ ] Animal animations and interactions
- [ ] Leaderboard and achievements
- [ ] Daily/weekly forest statistics
- [ ] Export forest as image/NFT
- [ ] Social sharing features
- [ ] Custom sound effects

## 🤝 Contributing

This is a hackathon project for Mountain Hacks! Feel free to:
1. Fork the repository
2. Create feature branches
3. Submit pull requests
4. Report issues

## 📝 License

MIT License - Feel free to use and modify!

## 🏆 Mountain Hacks 2025

Built with focus and determination 🚀

---

**Made with 🌲 by Sahaj Khandelwal**
