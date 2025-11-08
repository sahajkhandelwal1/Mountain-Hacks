# Verdant Focus Forest - Test Plan

## 1. Extension Loading
- [ ] Extension loads without errors
- [ ] No CSP violations in console
- [ ] Service worker registers successfully
- [ ] Icons display correctly

## 2. Session Management
- [ ] Click "Start Session" → session begins
- [ ] Forest appears with initial trees
- [ ] Timer starts counting
- [ ] Click "End Session" → session stops
- [ ] Session state persists after browser restart

## 3. Focus Monitoring
- [ ] Stay on productive site (docs.google.com) → focus score increases
- [ ] Switch to distracting site (youtube.com) → focus score decreases
- [ ] Trees grow when focused
- [ ] Focus score updates in stats panel

## 4. Wildfire Mechanics
- [ ] Visit distracting sites for 60s → wildfire starts
- [ ] Fire spreads to nearby trees
- [ ] Browser notification appears
- [ ] In-forest banner shows "Wildfire starting!"
- [ ] Return to focus → fire stops spreading
- [ ] Trees recover after refocusing

## 5. Inactivity Handling
- [ ] No keyboard/mouse input for 5 min → forest pauses
- [ ] Notification: "You've been inactive"
- [ ] Resume activity → forest growth continues
- [ ] Pause indicator shows in UI

## 6. Visual Elements
- [ ] Forest renders on new tab page
- [ ] Trees display with correct colors
- [ ] Animals appear in forest
- [ ] Burning trees show fire animation
- [ ] Smoke particles render
- [ ] Stats graphs display correctly

## 7. Persistence
- [ ] Close browser → reopen → session continues
- [ ] Forest state preserved
- [ ] Stats carry over
- [ ] Trees remain in same positions

## 8. Stats & Metrics
- [ ] Session duration updates
- [ ] Focus score displays
- [ ] Trees grown count accurate
- [ ] Toggle charts button works
- [ ] Progress bars animate

## Known Issues to Fix
1. "Extension context invalidated" - happens on reload (expected)
2. Need to test AI asset generation if backend exists
3. Verify notification permissions granted

## Demo Flow (for Hackathon)
1. Open extension → Start Session
2. Show forest growing on productive sites
3. Switch to YouTube → trigger wildfire
4. Show fire spreading + alerts
5. Return to docs → show recovery
6. Display stats panel with metrics
7. End session → show final forest state
