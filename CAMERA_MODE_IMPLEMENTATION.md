# Camera Mode Implementation Summary

## What Was Implemented

Camera Mode allows the timer to appear directly on your video feed, visible to all meeting participants. This uses Zoom's Layers API to draw the timer overlay on top of your camera video.

## Files Modified

### 1. `manifest.json`

**Added capabilities:**

- `drawWebView` - Draw HTML overlay on video
- `clearWebView` - Clear the overlay
- `getUserContext` - Get participant UUID

**Added APIs:**

- `drawWebView: {}`
- `clearWebView: {}`
- `getUserContext: {}`

**Already had:**

- `drawParticipant` - Draw participant video
- `runRenderingContext` - Enter camera mode
- `closeRenderingContext` - Exit camera mode

### 2. `src/App.jsx`

**Added state variables:**

```javascript
const [cameraMode, setCameraMode] = useState(false);
const [renderingContext, setRenderingContext] = useState(null);
```

**Updated SDK config:**
Added capabilities to the `zoomSdk.config()` call:

- `drawWebView`
- `clearWebView`
- `runRenderingContext`
- `closeRenderingContext`
- `getUserContext`

**Added Camera Mode effect:**
New `useEffect` hook that:

1. Enters camera mode when `canvasEnabled` is true
2. Gets user's participant UUID
3. Draws participant video (zIndex: 1)
4. Draws timer overlay (zIndex: 2)
5. Exits camera mode when `canvasEnabled` is false

**Added overlay update effect:**
New `useEffect` hook that:

1. Sends timer updates to overlay via `postMessage`
2. Updates whenever `activeTimer` changes
3. Hides overlay when no active timer

### 3. `public/timer-overlay.html`

**Complete rewrite** to create a standalone overlay:

**HTML Structure:**

- Transparent background
- Timer box in top-left corner
- Timer display element

**CSS Styling:**

- Green timer (default)
- Yellow timer (25% remaining)
- Orange timer (10% remaining)
- Red pulsing timer (5% remaining)
- Smooth animations

**JavaScript:**

- Listens for `postMessage` from main app
- Updates timer display
- Changes colors based on percentage remaining
- Handles show/hide

## How It Works

### Architecture

```
Main App (App.jsx)
    ↓
    ├─ Enters Camera Mode
    │  └─ zoomSdk.runRenderingContext({ view: "camera" })
    │
    ├─ Draws Video Layer (zIndex: 1)
    │  └─ zoomSdk.drawParticipant({ participantUUID, ... })
    │
    ├─ Draws Overlay Layer (zIndex: 2)
    │  └─ zoomSdk.drawWebView({ x, y, width, height, zIndex: 2 })
    │
    └─ Sends Timer Updates
       └─ postMessage({ type: 'UPDATE_TIMER', timer })
           ↓
       Overlay (timer-overlay.html)
           └─ Updates display
           └─ Changes colors
```

### Layer Stack

```
┌─────────────────────────────────┐
│  Timer Overlay (zIndex: 2)      │  ← drawWebView
│  - Transparent background       │
│  - Timer box in corner          │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  Video Feed (zIndex: 1)         │  ← drawParticipant
│  - Your camera                  │
└─────────────────────────────────┘
```

### Communication Flow

```
Timer State Changes in App
    ↓
activeTimer updates
    ↓
useEffect triggers
    ↓
postMessage sent to overlay iframe
    ↓
Overlay receives message
    ↓
Updates timer display
    ↓
Changes color based on time remaining
```

## Key Features

### 1. Automatic Color Changes

- **Green** (75-100% time remaining)
- **Yellow** (10-25% time remaining)
- **Orange** (5-10% time remaining)
- **Red with pulse** (0-5% time remaining)

### 2. Real-time Updates

- Timer updates every second
- Smooth color transitions
- No lag or flicker

### 3. Clean Entry/Exit

- Enters camera mode when Canvas button clicked
- Exits camera mode when Canvas button clicked again
- Cleans up properly on disable

### 4. Error Handling

- Catches camera mode errors
- Logs detailed error messages
- Automatically disables on error
- Provides user feedback

## Testing Checklist

- [ ] Canvas button toggles camera mode
- [ ] Timer appears on video feed
- [ ] Timer counts down correctly
- [ ] Colors change at right percentages
- [ ] Overlay hides when no active timer
- [ ] Overlay updates when switching timers
- [ ] Camera mode exits cleanly
- [ ] No errors in console
- [ ] Works with multiple timers
- [ ] Other participants can see overlay

## Known Limitations

1. **Only one app can use Camera Mode at a time**

   - If another app is using it, you'll get an error
   - Solution: Close other apps first

2. **Requires Zoom Client 5.13.1+**

   - Older clients don't support Camera Mode
   - Check version in Zoom → About

3. **CEF installation on first use**

   - Chromium Embedded Framework may need to install
   - Can take a few seconds the first time
   - Automatic, no user action needed

4. **Fixed overlay position**
   - Currently top-left corner only
   - Can be customized in timer-overlay.html

## Future Enhancements

Possible improvements:

- [ ] Draggable overlay position
- [ ] Resizable overlay
- [ ] Show timer title on overlay
- [ ] Progress bar visualization
- [ ] Multiple overlay styles
- [ ] Overlay position presets (corners, center, etc.)
- [ ] Transparency control
- [ ] Font size adjustment
- [ ] Custom color themes

## Debugging Tips

### Enable verbose logging

Add to App.jsx:

```javascript
console.log("Camera mode state:", { canvasEnabled, cameraMode, showOverlay });
console.log("Active timer:", activeTimer);
```

### Check overlay loading

In browser DevTools:

1. Network tab → Look for timer-overlay.html
2. Should return 200 OK
3. Check Response preview

### Verify postMessage

In timer-overlay.html, add:

```javascript
window.addEventListener("message", (event) => {
  console.log("Overlay received:", event.data);
  // ... rest of code
});
```

### Test without Camera Mode

The overlay also works in the app (not on video):

- Shows at bottom of app when Canvas enabled
- Good for testing overlay logic without Camera Mode

## Resources

- **Zoom Layers API Docs**: [Camera Mode Documentation]
- **Implementation Guide**: `CAMERA_MODE_GUIDE.md`
- **Testing Guide**: `TESTING_CAMERA_MODE.md`
- **Zoom Apps SDK**: https://marketplace.zoom.us/docs/zoom-apps/

## Support

If you encounter issues:

1. Check console for errors
2. Verify Zoom client version
3. Review manifest.json capabilities
4. Test with simple timer first
5. Check TESTING_CAMERA_MODE.md for troubleshooting
