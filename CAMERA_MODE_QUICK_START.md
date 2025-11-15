# Camera Mode - Quick Start

## 🎯 Goal

Show your timer directly on your video feed, visible to all meeting participants.

## ⚡ Quick Steps

1. **Start dev server**

   ```bash
   npm run dev
   ```

2. **Open Zoom meeting** and launch the Multi Timer app

3. **Create a timer** (or use Testing template)

4. **Click the "Canvas" button** (top-right corner)

5. **Start the timer** - It now appears on your video! 🎉

## 🎨 What You'll See

### On Your Video Feed

```
┌─────────────────────────────┐
│ ┌─────────┐                 │
│ │ 04:55   │  ← Timer overlay│
│ └─────────┘                 │
│                             │
│     Your Video Feed         │
│                             │
└─────────────────────────────┘
```

### Color Changes

- 🟢 **Green** - Plenty of time (75-100%)
- 🟡 **Yellow** - Getting low (10-25%)
- 🟠 **Orange** - Almost done (5-10%)
- 🔴 **Red (pulsing)** - Final seconds (0-5%)

## 🔧 Implementation Files

| File                        | What Changed                                       |
| --------------------------- | -------------------------------------------------- |
| `manifest.json`             | Added `drawWebView`, `getUserContext` capabilities |
| `src/App.jsx`               | Added Camera Mode logic (~line 680)                |
| `public/timer-overlay.html` | Complete overlay implementation                    |

## 📋 Key Code Snippets

### Enter Camera Mode

```javascript
await zoomSdk.runRenderingContext({ view: "camera" });
await zoomSdk.drawParticipant({
  participantUUID,
  x: 0,
  y: 0,
  width: 1280,
  height: 720,
  zIndex: 1,
});
await zoomSdk.drawWebView({ x: 0, y: 0, width: 1280, height: 720, zIndex: 2 });
```

### Update Overlay

```javascript
overlayFrame.contentWindow.postMessage(
  {
    type: "UPDATE_TIMER",
    timer: activeTimer,
  },
  "*"
);
```

## ✅ Testing Checklist

- [ ] Canvas button turns blue when active
- [ ] Timer appears on video (top-left)
- [ ] Timer counts down
- [ ] Colors change correctly
- [ ] Works with multiple timers
- [ ] Overlay hides when Canvas disabled

## 🐛 Common Issues

| Problem                | Solution                                |
| ---------------------- | --------------------------------------- |
| "Camera mode error"    | Close other Zoom apps using Camera Mode |
| Timer doesn't show     | Check console, toggle Canvas off/on     |
| Overlay doesn't update | Verify postMessage in console           |
| Wrong Zoom version     | Need Zoom Client 5.13.1+                |

## 📚 More Info

- **Full Guide**: `CAMERA_MODE_GUIDE.md`
- **Testing**: `TESTING_CAMERA_MODE.md`
- **Implementation**: `CAMERA_MODE_IMPLEMENTATION.md`

## 🚀 Next Steps

1. Test in a real meeting
2. Ask participants what they see
3. Customize overlay position/style
4. Add more features (title, progress bar, etc.)

---

**That's it!** Your timer now appears on your video feed for everyone to see. 🎊
