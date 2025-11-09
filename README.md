# 🌲 Verdant — Focus Forest Extension

A Chrome extension that gamifies focus by growing a beautiful forest ecosystem while you work. Get distracted? Watch wildfires spread through your creation with stunning visual effects!

## 🎯 Overview

**Problem:** Browser distractions kill productivity and focus.

**Solution:** Verdant turns focus into a visual, gamified experience where:
- 🌳 **Dynamic Forest Growth**: Your focused work grows a beautiful 2D forest with 6 unique tree types
- 🔥 **Wildfire System**: Visiting distraction sites triggers spreading wildfires with animated flames and visual effects
- 🎨 **Beautiful New Tab**: Custom new tab page with misty forest background, centered trees, and ground textures
- 📊 **AI-Powered Focus Analysis**: OpenAI integration analyzes your browsing patterns and provides personalized suggestions
- 💾 **Persistent Sessions**: Sessions continue across browser restarts until manually ended
- 🎮 **Demo Controls**: Test wildfire button for easy demonstration

## 🚀 Features

### Visual Experience
- **Beautiful New Tab Page**: Custom new tab with misty forest background and centered search bar
- **6 Unique Tree Types**: Randomly selected tree sprites (tree1-tree6) for variety
- **Dynamic Forest Rendering**: Canvas-based 2D forest with proper aspect ratios and scaling
- **Ground Textures**: Brown earth with soil texture, specks, and pebbles
- **Centered Layout**: Trees positioned perfectly under the logo and search bar
- **Blurred Background**: Subtle 4px blur on background for depth

### Wildfire System
- **Animated Flames**: Multi-layered fire animations on burning trees
- **Visual Effects**: 
  - Red/orange gradient overlay
  - Pulsing red glow from bottom
  - Rising fire particles
  - Smoke effects
  - Glowing title text
- **Wildfire Alert Banner**: Animated warning with progress bar
- **Tree Fade**: Burning trees become transparent and charred
- **Demo Button**: Test wildfire effects with one click

### AI Integration
- **OpenAI-Powered Analysis**: Real-time focus analysis using GPT models
- **Website Classification**: Automatic categorization of visited sites
- **Personalized Suggestions**: AI-generated tips to improve focus
- **Focus Reasoning**: Detailed explanations of your focus score
- **Mock Mode**: Works without API key for testing

### Core Mechanics
- **Focus Scoring**: Real-time focus score (0-100%) based on browsing behavior
- **Tree Growth**: Trees grow from saplings to full size (450px tall)
- **Fast Growth**: 5px per tick for demo purposes
- **Session Tracking**: Timer, tree count, and focused minutes
- **Persistent State**: Sessions survive browser restarts

### Technical Features
- **React + TypeScript**: Modern frontend with type safety
- **Vite Build System**: Fast development and optimized builds
- **Tailwind CSS**: Utility-first styling
- **Chrome Manifest V3**: Latest extension standards
- **Service Worker**: Background monitoring and processing
- **Canvas Rendering**: High-performance 2D graphics
- **Local Storage**: Session and forest state persistence

## 📁 Project Structure

```
Mountain-Hacks/
├── src/
│   ├── background/
│   │   ├── background.ts           # Main service worker
│   │   ├── sessionManager.ts       # Session lifecycle management
│   │   ├── focusTracker.ts         # Focus monitoring and analysis
│   │   └── wildfireController.ts   # Wildfire spread logic
│   ├── popup/
│   │   ├── Popup.tsx              # Main popup component
│   │   ├── SessionControls.tsx    # Start/end session buttons
│   │   ├── StatsPanel.tsx         # Statistics display
│   │   ├── FocusInsights.tsx      # AI analysis display
│   │   ├── APISettings.tsx        # OpenAI API configuration
│   │   └── DebugPanel.tsx         # Development debugging
│   ├── newtab/
│   │   ├── NewTab.tsx             # Custom new tab page
│   │   └── ForestCanvasP5.tsx     # P5.js forest renderer
│   ├── shared/
│   │   ├── forest/
│   │   │   ├── ImageForestRenderer.ts  # Canvas-based tree rendering
│   │   │   ├── CanvasForestRenderer.ts # Alternative renderer
│   │   │   └── Wildfire.ts            # Wildfire mechanics
│   │   ├── api/
│   │   │   ├── llmFocusAnalyzer.ts    # OpenAI integration
│   │   │   ├── websiteClassifier.ts   # Site categorization
│   │   │   └── aiAssets.ts            # AI asset generation
│   │   ├── storage/
│   │   │   ├── sessionStorage.ts      # Session state management
│   │   │   └── forestStorage.ts       # Forest state management
│   │   ├── monitoring/
│   │   │   └── focusMonitor.ts        # Focus metrics tracking
│   │   └── types/
│   │       └── index.ts               # TypeScript type definitions
│   └── styles/
│       ├── popup.css                  # Popup styling
│       └── newtab.css                 # New tab styling
├── public/
│   ├── images/
│   │   ├── tree1.png - tree6.png     # Tree sprites
│   │   ├── misty-forest-bg.png       # Background image
│   │   └── misty-forest-main-bg.png  # Alternative background
│   └── icons/                         # Extension icons
├── manifest.json                      # Extension manifest
├── vite.config.ts                     # Vite configuration
├── tailwind.config.js                 # Tailwind CSS config
└── tsconfig.json                      # TypeScript config
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Extension

```bash
npm run build
```

This creates a `dist/` folder with the compiled extension.

### 3. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist/` folder
5. The Verdant icon should appear in your extensions toolbar

### 4. Configure OpenAI API (Optional)

1. Click the extension icon
2. Scroll to "API Settings"
3. Enter your OpenAI API key
4. Click "Save API Key"

Without an API key, the extension runs in mock mode with simulated analysis.

### 5. Development Mode

For development with hot reload:
```bash
npm run dev
```

Then load the `dist/` folder in Chrome and rebuild when making changes.

## 🎮 How to Use

### Starting a Session

1. **Open New Tab**: See your beautiful forest on the new tab page
2. **Start Session**: Click "Start Session" in the controls (top-right)
3. **Watch Trees Grow**: Trees appear and grow as you stay focused
4. **Check Stats**: Scroll down to see session time, focus score, and tree count

### During a Session

- **Stay Focused**: Browse productive sites to maintain high focus score
- **Avoid Distractions**: Social media and entertainment sites lower your score
- **Watch AI Analysis**: See real-time focus insights in the popup
- **Monitor Wildfires**: If focus drops too low, wildfires start spreading

### Wildfire System

- **Triggers**: Low focus score or visiting distraction sites
- **Visual Effects**: 
  - Animated flames on trees
  - Red/orange screen overlay
  - Fire particles rising
  - Warning banner at top
- **Recovery**: Return to focused work to stop the spread

### Demo Mode

- **Test Fire Button**: Click "🔥 Test Fire" to see wildfire effects
- **Stop Fire**: Click again to stop the wildfire
- **Perfect for Demos**: Show off the visual effects instantly

### Ending a Session

1. **Click "End Session"** in the controls
2. **View Final Stats**: See your total trees, time, and focus score
3. **Forest Persists**: Your forest remains visible until next session

## 🔧 Customization

### Adjust Tree Growth Rate

In `src/background/sessionManager.ts`:
```typescript
const growthRate = 5; // pixels per tick (default: 5)
const maxHeight = 200; // maximum tree height (default: 200)
```

### Modify Tree Positioning

In `src/shared/forest/ImageForestRenderer.ts`:
```typescript
const forestWidth = 800; // spread width (default: 800)
const offsetX = (tree.x - 960) * (forestWidth / 500); // adjust spread
```

### Change Tree Appearance

In `src/shared/forest/ImageForestRenderer.ts`:
```typescript
const targetHeight = maturityScale * depthScale * 450; // tree height (default: 450)
this.ctx.filter = 'brightness(0.85) contrast(1.1)'; // adjust brightness/contrast
```

### Customize Wildfire Effects

In `src/newtab/NewTab.tsx`:
```typescript
// Adjust overlay intensity
style={{ opacity: wildfireLevel * 0.8 }}

// Change fire particle count
{[...Array(Math.floor(wildfireLevel * 20))].map(...)}
```

### Modify Ground Appearance

In `src/shared/forest/ImageForestRenderer.ts`:
```typescript
gradient.addColorStop(0, 'rgba(70, 45, 20, 0.35)'); // ground color
// Add more texture elements in drawGround()
```

## 🎨 Recent Updates

### Visual Improvements
- ✅ Centered tree positioning under logo and search bar
- ✅ 6 unique tree types with random selection
- ✅ Proper aspect ratio maintenance (no squished trees)
- ✅ Taller trees (450px) with better visibility
- ✅ Brown ground with texture (soil, specks, pebbles)
- ✅ Darker trees (brightness 0.85) for better contrast
- ✅ Blurred background (4px) for depth
- ✅ Dark gradient behind trees for pop

### Wildfire Effects
- ✅ Animated flames on burning trees
- ✅ Multi-layered fire (orange + red)
- ✅ Fire particles rising from forest
- ✅ Red/orange screen overlay
- ✅ Pulsing glow effect
- ✅ Smoke gradient
- ✅ Glowing title text
- ✅ Warning banner with progress bar
- ✅ Trees fade and darken when burning
- ✅ Demo test button

### Technical Improvements
- ✅ React + TypeScript migration
- ✅ Vite build system
- ✅ Tailwind CSS integration
- ✅ OpenAI API integration
- ✅ Website classification system
- ✅ Focus analysis with reasoning
- ✅ Persistent session state
- ✅ Canvas-based rendering

## 🎨 Future Enhancements

- [ ] Multiple forest biomes (desert, jungle, snow)
- [ ] Animal animations and interactions
- [ ] Sound effects for fire and growth
- [ ] Leaderboard and achievements
- [ ] Daily/weekly forest statistics
- [ ] Export forest as image
- [ ] Social sharing features
- [ ] More tree varieties
- [ ] Weather effects (rain, snow)
- [ ] Day/night cycle

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
