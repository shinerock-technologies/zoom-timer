# How to Sideload Your Zoom App (Skip Marketplace!)

## Method 1: Using Zoom CLI (Easiest)

### 1. Install Zoom Apps CLI

```bash
npm install -g @zoom/appcli
```

### 2. Start your dev server (already running)

Your app is at http://localhost:3000

### 3. Run the Zoom Apps CLI

```bash
cd zoom-timer-app
zoom-apps run
```

This will:

- Automatically configure your app
- Open it in development mode
- No marketplace needed!

---

## Method 2: Manual Sideload via Zoom Desktop

### 1. Enable Developer Mode in Zoom

**On Mac:**

1. Open Terminal
2. Run:

```bash
defaults write us.zoom.xos ZoomEnableDevelopMenu YES
```

3. Restart Zoom

**On Windows:**

1. Open Registry Editor
2. Navigate to: `HKEY_CURRENT_USER\Software\Zoom\Zoom Meetings`
3. Create DWORD: `ZoomEnableDevelopMenu` = `1`
4. Restart Zoom

### 2. Load Your App

1. Start a Zoom meeting
2. In Zoom menu bar, click **Develop** → **Load App**
3. Select your `manifest.json` file from `zoom-timer-app/manifest.json`
4. Your app will load in the meeting!

---

## Method 3: Use Zoom's Test Environment

### 1. In Zoom Marketplace (https://marketplace.zoom.us/develop)

1. Go to your app
2. Under "Local Test" or "Development":
   - Enable "Development Mode"
   - Add your email as a test user
3. In "Features":
   - Just enable "In-Meeting"
   - Set Home URL: `http://localhost:3000`
   - **Don't worry about the validation error** - it works in dev mode!
4. Click "Save"

### 2. In Zoom Desktop Client

1. Start a meeting
2. Click "Apps"
3. Your app should appear under "Development" or with a "DEV" badge
4. Click to launch!

---

## Troubleshooting

**App doesn't appear?**

- Make sure dev server is running: `npm run dev`
- Check http://localhost:3000 loads in your browser
- Restart Zoom client

**Can't find Developer menu?**

- Make sure you enabled developer mode (Method 2, Step 1)
- Restart Zoom completely

**Still not working?**

- Try Method 1 (Zoom CLI) - it's the most reliable
