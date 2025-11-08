# Testing Guide - Verdant Focus Forest Extension

## Quick Start Testing

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Icon Files (Required)

The extension needs icon files to load properly. Create these files in the `icons/` directory:

- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)  
- `icon128.png` (128x128 pixels)

**Quick fix**: You can create simple placeholder icons using any image editor, or use colored squares as placeholders. The extension will work without fancy icons, but Chrome requires them to be present.

### 3. Build the Extension

```bash
npm run build
```

This will:
- Compile TypeScript to JavaScript
- Bundle React components
- Create the `dist/` folder with all extension files
- Copy manifest, icons, and blocked.html

### 4. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the **`dist/`** folder from this project
5. The Verdant extension should appear in your extensions list

### 5. Test the Extension

#### A. Test Popup

1. Click the Verdant extension icon in the toolbar
2. You should see the popup with:
   - Forest canvas (initially empty)
   - Session controls (Start Session button)
   - Stats panel (showing 0s and defaults)

#### B. Start a Session

1. Click **"Start Session"** button
2. The button should change to **"End Session"**
3. Stats should show session time starting to count
4. Forest should remain empty initially (trees grow over time)

#### C. Test Focus Tracking

1. **Stay focused**: Browse productive websites (docs, articles, etc.)
2. Wait 1-2 minutes for focus ticks
3. Trees should start appearing in the forest canvas
4. Focus score should remain high (70-100%)

#### D. Test Wildfire System

1. Visit a distraction site (YouTube, Facebook, Twitter, etc.)
2. Stay on the distraction site for 60+ seconds
3. You should see:
   - Focus score decreasing
   - Wildfire warning appear
   - Browser notification: "🔥 Wildfire Alert!"
   - Fire spreading in the forest canvas

#### E. Test Recovery

1. After wildfire starts, navigate to a productive site
2. Stay focused for a minute
3. Fire should stop spreading
4. Focus score should increase
5. Recovery notification: "🌲 Fire Contained!"

#### F. Test New Tab Page

1. Open a new tab (Ctrl+T or Cmd+T)
2. You should see the full Verdant New Tab page with:
   - Larger forest canvas
   - Expanded stats panel
   - Charts (if toggled on)
   - Focus tips

#### G. Test Session Persistence

1. Start a session
2. Let it run for a few minutes (grow some trees)
3. Close the browser completely
4. Reopen the browser
5. Click the extension icon
6. Session should resume with:
   - Same session time
   - Trees still visible
   - Stats preserved

#### H. Test Inactivity Detection

1. Start a session
2. Stop using the browser for 5+ minutes
3. You should receive a notification: "Your forest growth has paused"
4. Return to the browser
5. Forest growth should resume

### 6. Check Browser Console for Errors

If something isn't working:

1. Open Chrome DevTools (F12)
2. Go to the **Console** tab
3. Check for any error messages
4. Common issues:
   - Missing icons → Create placeholder icons
   - Build errors → Run `npm run build` again
   - Extension not loading → Check manifest.json is in dist/

### 7. Test Background Script

1. Open `chrome://extensions/`
2. Find Verdant extension
3. Click **"Service worker"** or **"background page"** link
4. This opens the background script console
5. Check for errors or logs
6. You should see logs when:
   - Session starts
   - Focus ticks occur
   - Wildfires trigger

### 8. Test Content Script

1. Open any website
2. Open DevTools (F12)
3. Go to Console tab
4. You should see: "Verdant Focus Forest content script loaded"
5. Activity tracking should be working (no errors)

## Expected Behavior

### Focus Score Calculation

- **High focus (80-100%)**: Productive sites, minimal tab switching
- **Medium focus (50-80%)**: Some distractions, occasional tab switches
- **Low focus (0-50%)**: On distraction sites, frequent switching
- **Wildfire trigger**: Score < 30% for 60+ seconds

### Tree Growth

- Trees appear every ~30-60 seconds when focused
- Growth rate depends on focus score
- Animals appear every 5 trees
- Maximum ~20-30 trees visible at once

### Wildfire System

- Starts after 60 seconds of low focus
- Spreads to nearby trees (within 50 pixels)
- Escalates over time (spreads faster)
- Stops when focus improves (>70%)
- Trees can recover if fire stopped early

### Stats Panel

- **Session Time**: Total session duration
- **Focus Score**: Current focus percentage
- **Trees Grown**: Healthy trees count
- **Focused Minutes**: Time spent focused
- **Charts**: Toggle to show/hide (New Tab only)

## Troubleshooting

### Extension Won't Load

- **Check**: `dist/` folder exists and contains files
- **Check**: `manifest.json` is in `dist/`
- **Check**: Icons exist in `dist/icons/`
- **Fix**: Run `npm run build` again

### Popup is Blank

- **Check**: Browser console for React errors
- **Check**: Background script is running
- **Check**: Storage permissions are granted
- **Fix**: Reload extension in `chrome://extensions/`

### Forest Not Rendering

- **Check**: p5.js is loading (check console)
- **Check**: Canvas element exists in DOM
- **Check**: Forest state is being loaded
- **Fix**: Check browser console for errors

### Wildfire Not Triggering

- **Check**: You're on a distraction site for 60+ seconds
- **Check**: Focus score is dropping
- **Check**: Background script is running
- **Fix**: Check background console for logs

### Session Not Persisting

- **Check**: Storage permissions in manifest
- **Check**: chrome.storage.local is accessible
- **Check**: Session state is being saved
- **Fix**: Check browser console for storage errors

## Development Mode

For active development with auto-rebuild:

```bash
npm run dev
```

This watches for file changes and rebuilds automatically. After changes:
1. Go to `chrome://extensions/`
2. Click the reload icon on the Verdant extension
3. Test the changes

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Popup displays correctly
- [ ] Start Session button works
- [ ] Trees grow when focused
- [ ] Wildfire triggers on distractions
- [ ] Fire spreads and escalates
- [ ] Recovery works when refocused
- [ ] New Tab page displays
- [ ] Stats panel shows correct data
- [ ] Charts render (if toggled)
- [ ] Session persists across restarts
- [ ] Inactivity detection works
- [ ] Browser notifications appear
- [ ] No console errors

## Next Steps After Testing

1. **Customize distraction sites**: Edit `src/shared/monitoring/distractionDetector.ts`
2. **Adjust growth rates**: Modify focus tick intervals in `src/background/focusTracker.ts`
3. **Change wildfire behavior**: Edit `src/shared/forest/Wildfire.ts`
4. **Add real AI assets**: Configure API keys in `src/shared/api/config.ts`
5. **Customize styling**: Edit CSS files in `src/styles/`

## Support

If you encounter issues:
1. Check browser console for errors
2. Check background script console
3. Verify all dependencies are installed
4. Ensure build completed successfully
5. Check that icons exist

Happy testing! 🌲🔥

