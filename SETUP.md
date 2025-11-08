# Verdant Focus Forest - Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Chrome or Edge browser

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the extension:
```bash
npm run build
```

3. Create icons (if not already present):
   - Create `icon16.png` (16x16 pixels)
   - Create `icon48.png` (48x48 pixels)
   - Create `icon128.png` (128x128 pixels)
   - Place them in the `icons/` directory

## Loading the Extension

1. Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist/` folder from this project
5. The Verdant extension should now be installed!

## Development

To build in watch mode (automatically rebuilds on file changes):
```bash
npm run dev
```

## Project Structure

- `src/popup/` - Extension popup UI (React)
- `src/newtab/` - New tab page (React)
- `src/background/` - Background service worker
- `src/content/` - Content scripts for activity tracking
- `src/shared/` - Shared utilities, types, and components
- `dist/` - Built extension (load this in Chrome)

## Features

- **Forest Growth**: Trees grow as you stay focused
- **Wildfire System**: Distractions trigger spreading wildfires
- **Focus Monitoring**: Tracks your activity and calculates focus scores
- **Session Persistence**: Sessions continue across browser restarts
- **Stats Dashboard**: View your focus metrics and forest statistics
- **New Tab Integration**: Full-screen forest view in new tabs

## API Configuration

The extension supports AI asset generation. To use real AI APIs:

1. Set your API key in the extension settings (future feature)
2. Configure the API provider (OpenAI DALL-E or Stability AI)
3. The mock implementation works out of the box for MVP

## Troubleshooting

- If icons don't load: Make sure icon files exist in `icons/` directory
- If extension doesn't load: Check browser console for errors
- If build fails: Make sure all dependencies are installed (`npm install`)

## Notes

- The extension uses Chrome Manifest V3
- Sessions persist in `chrome.storage.local`
- Focus monitoring runs every minute
- Wildfire triggers after 60 seconds of low focus (< 30%)

