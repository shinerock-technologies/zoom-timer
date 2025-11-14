# Zoom Multi Timer App

A React-based Zoom App with multiple customizable timers.

## Setup Steps

### 1. Start the Development Server

The server is already running at http://localhost:3000

### 2. Configure Your Zoom App

1. Go to https://marketplace.zoom.us/develop
2. Click "Build App" → Choose "Zoom Apps"
3. Fill in basic information:

   - App Name: Multi Timer
   - Description: Add multiple customizable timers to your Zoom meetings

4. **App Credentials** section:

5. **Features** section:

   - Enable "In-Meeting" capability
   - Set Home URL: `http://localhost:3000`
   - Add required scopes:
     - `getMeetingContext`
     - `showNotification`
     - `shareApp`

6. **Installation** section:
   - Click "Add" to install the app to your account
   - This is CRITICAL - the app won't show in meetings until installed!

### 3. Test in Zoom Meeting

1. Start a Zoom meeting (desktop client)
2. Click "Apps" in the meeting toolbar
3. Look for "Multi Timer" in your installed apps
4. Click to launch

### 4. If App Doesn't Appear

- Make sure you clicked "Add" or "Install" in the Zoom Marketplace
- Check that "In-Meeting" is enabled in Features
- Verify the Home URL is exactly `http://localhost:3000`
- Try restarting your Zoom client
- Check the browser console for errors

## Features

- Add multiple timers with custom titles
- Set minutes and seconds for each timer
- Start, pause, reset, and delete timers
- Visual feedback for running/finished timers
- Zoom notifications when timers complete

## Development

```bash
npm run dev    # Start development server
npm run build  # Build for production
```

# zoom-timer

# zoom-timer

# zoom-timer

# zoom-timer

# zoom-timer
