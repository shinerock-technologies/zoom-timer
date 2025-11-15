# Camera Mode Implementation Guide

## What is Camera Mode?

Camera Mode allows your timer to appear directly on your video feed (like an overlay on your camera), visible to all meeting participants. This is different from the regular app view which only shows in the sidebar.

## How It Works

When you enable Camera Mode:

1. **Your video feed is captured** - The app uses `drawParticipant()` to draw your camera feed
2. **Timer overlay is added on top** - The app uses `drawWebView()` to draw the timer on top of your video
3. **Everyone sees it** - All meeting participants see the timer on your video feed

## Implementation Details

### 1. Manifest Configuration (`manifest.json`)

```json
{
  "capabilities": [
    "drawParticipant",
    "drawWebView",
    "runRenderingContext",
    "getUserContext"
  ],
  "apis": {
    "drawParticipant": {},
    "drawWebView": {},
    "runRenderingContext": {},
    "closeRenderingContext": {},
    "getUserContext": {}
  },
  "modules": {
    "camera": {
      "main": "/",
      "label": "Timer Overlay"
    }
  }
}
```

### 2. Entering Camera Mode (App.jsx)

```javascript
// Enter camera mode
await zoomSdk.runRenderingContext({ view: "camera" });

// Get user's participant UUID
const userContext = await zoomSdk.getUserContext();

// Draw participant video (layer 1 - bottom)
await zoomSdk.drawParticipant({
  participantUUID: userContext.participantUUID,
  x: 0,
  y: 0,
  width: 1280,
  height: 720,
  zIndex: 1,
});

// Draw timer overlay (layer 2 - on top)
await zoomSdk.drawWebView({
  x: 0,
  y: 0,
  width: 1280,
  height: 720,
  zIndex: 2,
});
```

### 3. Timer Overlay HTML (`public/timer-overlay.html`)

The overlay is a separate HTML file that:

- Has a transparent background
- Shows the timer in the top-left corner
- Listens for timer updates via `postMessage`
- Updates colors based on time remaining (green → yellow → orange → red)

### 4. Communication Between App and Overlay

The main app sends timer updates to the overlay:

```javascript
overlayFrame.contentWindow.postMessage(
  {
    type: "UPDATE_TIMER",
    timer: activeTimer,
  },
  "*"
);
```

The overlay receives and displays the updates:

```javascript
window.addEventListener("message", (event) => {
  const { type, timer } = event.data;
  if (type === "UPDATE_TIMER") {
    updateTimerDisplay(timer);
  }
});
```

## How to Use

1. **Start your Zoom meeting**
2. **Open the Multi Timer app** from the Apps panel
3. **Create or load a timer room**
4. **Click the "Canvas" button** in the top-right corner
5. **The timer will appear on your video feed** - visible to all participants

## Important Notes

- **Only you see the controls** - Other participants only see the timer overlay on your video
- **Camera Mode requires Zoom Client 5.13.1+** and Zoom Apps SDK 0.16.11+
- **CEF (Chromium Embedded Framework)** may need to be installed the first time you use Camera Mode
- **Only one app can use Camera Mode at a time** - If another app is using it, you'll get an error

## Troubleshooting

### Timer doesn't appear on video

- Make sure you clicked the "Canvas" button
- Check the browser console for errors
- Try toggling Camera Mode off and on again

### "Camera mode error" message

- Another app might be using Camera Mode
- Try closing other Zoom apps and retry
- Make sure your Zoom client is version 5.13.1 or later

### Overlay shows but doesn't update

- Check that the timer is running
- Look for postMessage errors in the console
- Verify the overlay HTML is loading correctly

## Technical Architecture

```
┌─────────────────────────────────────┐
│   Main App (App.jsx)                │
│   - Timer logic                     │
│   - Camera Mode control             │
│   - Sends updates via postMessage   │
└──────────────┬──────────────────────┘
               │
               │ postMessage
               ▼
┌─────────────────────────────────────┐
│   Overlay (timer-overlay.html)      │
│   - Transparent background          │
│   - Timer display                   │
│   - Color changes                   │
└─────────────────────────────────────┘
               │
               │ drawWebView (zIndex: 2)
               ▼
┌─────────────────────────────────────┐
│   Video Feed                        │
│   - Your camera                     │
│   - drawParticipant (zIndex: 1)    │
└─────────────────────────────────────┘
```

## Next Steps

- Test in a real Zoom meeting
- Adjust overlay position/size if needed
- Add more overlay customization options
- Consider adding participant name or meeting info
