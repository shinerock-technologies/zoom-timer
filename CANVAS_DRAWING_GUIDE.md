# Canvas Drawing Feature Guide

## ⚠️ Important Notice

The canvas drawing feature uses Zoom's `drawParticipant` and `drawWebView` APIs to display timer overlays.

**Status**: Active - Feature is implemented and ready to test in Zoom meetings.

## Overview

The timer app includes experimental support for displaying the active timer on the Zoom canvas for all meeting participants to see.

## How to Use

### 1. Enable Canvas Drawing

- Click the **Canvas** button in the top-right header
- The button will turn blue when active
- The active timer will now be displayed as an overlay on the Zoom canvas

### 2. What Gets Displayed

- Timer title and remaining time (e.g., "⏱ Focus Session: 25:00")
- Position: Top-left corner of the canvas (5% from left, 5% from top)
- Font size: 36px
- Color changes based on alert thresholds:
  - **White** (#ffffff) - Normal state
  - **Orange** (#ffaa00) - Warning alert (25% remaining)
  - **Dark Orange** (#ff6600) - Urgent alert (10% remaining)
  - **Red** (#ff0000) - Critical alert (5% remaining)

### 3. Disable Canvas Drawing

- Click the **Canvas** button again to turn it off
- The overlay will be removed from the canvas

## Technical Implementation

### Zoom SDK Configuration

The app requests these drawing capabilities:

- `drawText` - Draw text overlays
- `drawShape` - Draw shapes (reserved for future use)
- `drawImage` - Draw images (reserved for future use)
- `removeText` - Remove text overlays
- `removeShape` - Remove shapes
- `removeImage` - Remove images
- `clearDrawing` - Clear all drawings

### Manifest Permissions

The `manifest.json` includes:

```json
"capabilities": [
  "drawText",
  "removeText",
  "clearDrawing"
]
```

### Drawing Updates

- The canvas updates every 1 second when enabled
- Updates automatically when timer changes
- Clears when canvas is disabled or no active timer

## Important Notes

### ⚠️ Meeting Requirements

Canvas drawing **ONLY works** when:

1. You are in an **active Zoom meeting**
2. The host has **enabled app overlays**
3. You're running the app in the meeting (not in preview mode)

### Testing

- Canvas drawing will NOT show in the Zoom desktop "App Preview" outside meetings
- You must test in an actual meeting to see the overlay
- Other participants will see the overlay if they have the app installed

### Troubleshooting

**Drawing not showing?**

1. Check that you're in an active meeting
2. Verify the Canvas button is active (blue)
3. Ensure you have an active timer running
4. Check browser console for any errors

**Permission errors?**

1. Go to Zoom Marketplace → Your App → Scopes/Permissions
2. Enable "Draw Overlays" and "In-Meeting Experiences"
3. Reinstall/reload the app

## Future Enhancements

- Customizable position (top-left, top-right, bottom-left, bottom-right)
- Adjustable font size
- Custom colors
- Background overlay for better visibility
- Multiple timer display options
