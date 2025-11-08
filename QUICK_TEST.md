# Quick Testing Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create Placeholder Icons (Required!)

The extension needs icon files. You can create simple placeholders:

**Option A: Use Image Editor**
- Create 3 PNG files: `icon16.png`, `icon48.png`, `icon128.png`
- Place them in the `icons/` folder
- They can be simple colored squares or the Verdant logo

**Option B: Use Online Tool**
- Go to https://www.favicon-generator.org/ or similar
- Generate icons and download
- Place in `icons/` folder

**Option C: Quick Python Script** (if you have Python):
```python
from PIL import Image

sizes = [16, 48, 128]
for size in sizes:
    img = Image.new('RGB', (size, size), color='#228B22')  # Forest green
    img.save(f'icons/icon{size}.png')
```

## Step 3: Build the Extension

```bash
npm run build
```

Wait for build to complete. You should see:
- `dist/` folder created
- Files compiled successfully
- Icons copied (if they exist)

## Step 4: Load in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **"Load unpacked"**
5. Select the **`dist/`** folder
6. Extension should appear in your list

## Step 5: Test Features

### Test Popup
- Click the extension icon in toolbar
- Should see popup with forest canvas

### Test Session
- Click **"Start Session"**
- Wait 1-2 minutes
- Trees should start appearing

### Test Wildfire
- Visit youtube.com or facebook.com
- Stay for 60+ seconds
- Should see wildfire warning and fire in forest

### Test New Tab
- Open new tab (Ctrl+T)
- Should see full Verdant new tab page

## Troubleshooting

**Extension won't load?**
- Check that `dist/` folder exists
- Verify `manifest.json` is in `dist/`
- Make sure icons exist in `dist/icons/`

**Popup is blank?**
- Open browser console (F12)
- Check for errors
- Reload extension

**No trees growing?**
- Make sure session is started
- Wait 1-2 minutes (trees grow on focus ticks)
- Check background script console

**Wildfire not triggering?**
- Stay on distraction site for 60+ seconds
- Check focus score is dropping
- Check background script for logs

## Check Console for Errors

1. **Popup Console**: Right-click popup → Inspect
2. **Background Console**: chrome://extensions → Click "Service worker"
3. **Page Console**: F12 on any webpage

Look for any red error messages and share them if you need help!

