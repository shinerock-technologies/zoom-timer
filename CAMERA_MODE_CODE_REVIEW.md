# Camera Mode Code Review & Changes

## Issues Found & Fixed

### ❌ Issue 1: Calling `config()` Twice

**Problem**: The code was calling `zoomSdk.config()` twice:

- Once at app initialization (line ~650)
- Again inside camera mode (line ~717)

**Why it's wrong**: According to Zoom docs, you should only call `config()` once at initialization.

**Fix**: Removed the second `config()` call. We don't need it to get render target dimensions.

### ⚠️ Issue 2: Hardcoded Dimensions

**Current**: Using hardcoded `1280x720`

```javascript
width: 1280,
height: 720,
```

**Docs recommend**: Using `config.media.renderTarget.width/height`

**Decision**: Kept hardcoded for now because:

- 1280x720 is the standard camera mode resolution
- We'd need to store config from initialization to use it here
- Can be changed later if needed

### ✅ Issue 3: Wait Time for CEF

**Changed**: Increased wait time from 1 second to 2 seconds

```javascript
await new Promise((resolve) => setTimeout(resolve, 2000));
```

**Why**: First-time CEF installation can take longer. 2 seconds is safer.

## Current Camera Mode Flow

```javascript
// 1. Enter camera mode
await zoomSdk.runRenderingContext({ view: "camera" });

// 2. Wait for CEF to load
await new Promise((resolve) => setTimeout(resolve, 2000));

// 3. Get participant UUID
const userContext = await zoomSdk.getUserContext();

// 4. Draw participant video (bottom layer)
await zoomSdk.drawParticipant({
  participantUUID: userContext.participantUUID,
  x: 0,
  y: 0,
  width: 1280,
  height: 720,
  zIndex: 1, // Bottom layer
});

// 5. Draw WebView overlay (top layer)
await zoomSdk.drawWebView({
  x: 0,
  y: 0,
  width: 1280,
  height: 720,
  zIndex: 2, // Top layer - shows timer-overlay.html
});
```

## What Each API Does

### `runRenderingContext({ view: "camera" })`

- Switches from sidebar to camera mode
- Installs CEF if needed (first time only)
- Returns control to your app to draw layers

### `getUserContext()`

- Gets current user's `participantUUID`
- Needed to identify which video feed to draw
- Only works after SDK is configured

### `drawParticipant()`

- Draws a participant's video feed
- Uses `participantUUID` to identify the participant
- `zIndex: 1` puts it on the bottom layer
- If no video, shows avatar/name fallback

### `drawWebView()`

- Draws an HTML page on top of the video
- Renders `timer-overlay.html` in this case
- `zIndex: 2` puts it above the participant video
- Transparent background allows video to show through

## Layer Stack Visualization

```
┌─────────────────────────────────────┐
│  WebView (zIndex: 2)                │  ← timer-overlay.html
│  - Transparent background           │
│  - Timer box in top-left            │
│  - Updates via postMessage          │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Participant Video (zIndex: 1)      │  ← Your camera feed
│  - Full screen 1280x720             │
│  - Live video stream                │
└─────────────────────────────────────┘
```

## Potential Improvements

### 1. Use `onRenderedAppOpened` Event

Instead of `setTimeout`, listen for the event:

```javascript
zoomSdk.onRenderedAppOpened((event) => {
  console.log("Rendering context ready:", event);
  // Now safe to call drawParticipant/drawWebView
});
```

### 2. Check `runningContext`

Verify we're actually in camera mode:

```javascript
const context = await zoomSdk.getRunningContext();
if (context === "inCamera") {
  // Safe to draw
}
```

### 3. Use Dynamic Dimensions

Store config at initialization and use it:

```javascript
// At initialization
const configResponse = await zoomSdk.config({...});
const renderTarget = configResponse.media?.renderTarget;

// In camera mode
width: renderTarget?.width || 1280,
height: renderTarget?.height || 720,
```

### 4. Add Error Recovery

```javascript
try {
  await zoomSdk.drawParticipant({...});
} catch (err) {
  if (err.message.includes("not in camera mode")) {
    // Retry entering camera mode
  }
}
```

## Testing Checklist

- [ ] Canvas button toggles camera mode
- [ ] Console shows all success logs
- [ ] No errors in console
- [ ] Timer appears on video feed
- [ ] Timer updates in real-time
- [ ] Colors change correctly
- [ ] Overlay hides when Canvas disabled
- [ ] Works after toggling on/off multiple times

## Common Errors & Solutions

### "must call zoomSdk.config before using other API methods"

**Cause**: Trying to use APIs before SDK is configured
**Solution**: Check `zoomReady` state before entering camera mode ✅ (Fixed)

### "Cannot access 'activeTimer' before initialization"

**Cause**: useEffect hook placed after variable definition
**Solution**: Move all hooks to top of component ✅ (Fixed)

### "Rendered more hooks than during the previous render"

**Cause**: Conditional hooks or hooks after return
**Solution**: Keep all hooks at top level ✅ (Fixed)

### "Another app is using camera mode"

**Cause**: Only one app can use camera mode at a time
**Solution**: Close other Zoom apps first

### Timer doesn't appear on video

**Possible causes**:

1. CEF not loaded yet → Increase wait time
2. drawWebView failed → Check console for errors
3. timer-overlay.html not loading → Check Network tab
4. postMessage not working → Check overlay console

## Next Steps

1. **Test in real Zoom meeting**

   - Click Canvas button
   - Check console logs
   - Verify timer appears on video

2. **If it doesn't work**:

   - Share console logs
   - Check Zoom client version (need 5.13.1+)
   - Try increasing wait time to 3-4 seconds
   - Check if CEF installed successfully

3. **If it works**:
   - Test with multiple timers
   - Test color changes
   - Test with other participants
   - Customize overlay position/style

## Code Location

**File**: `zoom-timer-app/src/App.jsx`
**Lines**: ~677-755 (Camera Mode effect)
**Lines**: ~757-785 (Overlay update effect)

## Documentation

- Full guide: `CAMERA_MODE_GUIDE.md`
- Testing: `TESTING_CAMERA_MODE.md`
- Quick start: `CAMERA_MODE_QUICK_START.md`
