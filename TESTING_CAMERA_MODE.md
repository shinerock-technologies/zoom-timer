# Testing Camera Mode - Quick Start

## Prerequisites

1. **Zoom Client 5.13.1 or later** installed
2. **Development server running** (`npm run dev`)
3. **App sideloaded** in Zoom (see SIDELOAD_INSTRUCTIONS.md)

## Step-by-Step Testing

### 1. Start a Zoom Meeting

```bash
# Make sure your dev server is running
cd zoom-timer-app
npm run dev
```

- Open Zoom and start a meeting (you can start a meeting by yourself for testing)
- Or join a test meeting

### 2. Open the Multi Timer App

- Click **Apps** in the Zoom toolbar
- Find **Multi Timer** in your apps list
- Click to open it in the sidebar

### 3. Create a Test Timer

Option A: Use the Testing template

- Click **New Room** → **Testing Room**
- This has 10, 20, and 30 second timers perfect for testing

Option B: Create a custom timer

- Click **New Room** → **Make Custom Timer Room**
- Add a timer with 30 seconds
- Click **Add Timer**

### 4. Enable Camera Mode

- Click the **Canvas** button in the top-right corner of the app
- The button should turn blue/active
- Watch the console for logs:
  ```
  Entering camera mode...
  Camera mode response: {...}
  User context: {...}
  Drew participant
  Drew WebView overlay
  ```

### 5. Start the Timer

- Click the **Play** button (▶) on the timer
- You should see:
  - Timer counting down in the app
  - **Timer overlay on your video feed** (top-left corner, green box)

### 6. Watch the Color Changes

As the timer counts down, the overlay should change colors:

- **Green** (75-100% remaining)
- **Yellow** (10-25% remaining)
- **Orange** (5-10% remaining)
- **Red with pulsing** (0-5% remaining)

### 7. Test Controls

- **Pause/Play**: Timer should pause/resume on video
- **+30/-30**: Time should adjust on video overlay
- **Next/Previous**: Should switch timers on video
- **Disable Canvas**: Click Canvas button again - overlay should disappear

## What You Should See

### In the App (Sidebar)

- Full timer controls
- Timer list
- Master controls
- Canvas button (active/blue when enabled)

### On Your Video Feed

- Small timer box in top-left corner
- Green border and text
- Time counting down
- Color changes as time runs out

### What Others See

- Your video feed with the timer overlay
- They do NOT see the app controls
- They only see the timer counting down on your video

## Troubleshooting

### "Camera mode error" in console

**Problem**: Another app is using Camera Mode

**Solution**:

1. Close all other Zoom apps
2. Click Canvas button to disable
3. Wait 2 seconds
4. Click Canvas button again to enable

### Timer doesn't appear on video

**Problem**: CEF not loaded or drawWebView failed

**Solution**:

1. Check console for specific error
2. Try toggling Canvas off/on
3. Restart Zoom if needed (first time may need CEF install)

### Overlay shows but doesn't update

**Problem**: postMessage communication issue

**Solution**:

1. Open browser DevTools (Cmd+Option+I on Mac)
2. Check for postMessage errors
3. Verify timer-overlay.html is loading
4. Check Network tab for 404 errors

### "getUserContext is not a function"

**Problem**: Capability not configured

**Solution**:

1. Check manifest.json has "getUserContext" in capabilities
2. Restart dev server
3. Reload app in Zoom

## Console Logs to Look For

### Success Path

```
Entering camera mode...
Camera mode response: {success: true}
User context: {participantUUID: "xxx..."}
Config: {...}
Drew participant
Drew WebView overlay
```

### If It Works

- No errors in console
- Timer visible on video
- Colors change as expected
- Controls work properly

## Advanced Testing

### Test with Multiple Timers

1. Load "Pomodoro" template (5 timers)
2. Enable Canvas
3. Start first timer
4. Use Next button to switch timers
5. Verify overlay updates for each timer

### Test Color Transitions

1. Create a 20-second timer
2. Enable Canvas and start
3. Watch color change at:
   - 5 seconds (25%) → Yellow
   - 2 seconds (10%) → Orange
   - 1 second (5%) → Red with pulse

### Test Edge Cases

- Enable Canvas with no timers → Should show nothing
- Enable Canvas, then delete all timers → Should hide overlay
- Switch rooms while Canvas enabled → Should update overlay
- Disable Canvas while timer running → Should remove overlay

## Next Steps

Once Camera Mode is working:

1. Test in a real meeting with other participants
2. Ask them what they see on your video
3. Adjust overlay position/size if needed (edit timer-overlay.html)
4. Customize colors or styling
5. Add more overlay features (timer title, progress bar, etc.)

## Need Help?

Check these files for implementation details:

- `CAMERA_MODE_GUIDE.md` - Full technical guide
- `src/App.jsx` - Camera Mode logic (line ~680)
- `public/timer-overlay.html` - Overlay HTML/CSS/JS
- `manifest.json` - Required capabilities

Look for console errors and check:

- Zoom client version (must be 5.13.1+)
- SDK version in package.json (must be 0.16.11+)
- All capabilities in manifest.json
