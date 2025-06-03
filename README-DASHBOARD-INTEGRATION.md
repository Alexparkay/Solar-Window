# Solar Window Dashboard Integration

This guide explains how to connect your Solar Window app with your dashboard application. Follow these steps to set up a seamless integration.

## Step 1: Start the Solar Window Application

1. Make sure your Solar Window application is running:
   ```bash
   npm run dev
   ```

2. Note the URL where it's running (typically http://localhost:5174 or similar)

## Step 2: Update Your Dashboard Configuration

In your dashboard application's `EnergyUsageEstimation.tsx` file, update the `SOLAR_WINDOW_URL` constant with the actual URL of your Solar Window application:

```typescript
// Replace this:
const SOLAR_WINDOW_URL = "https://your-solar-window-url";

// With this (using the actual URL where Solar Window is running):
const SOLAR_WINDOW_URL = "http://localhost:5174";
```

## Step 3: Test the Integration

1. Start your dashboard application
2. Navigate to the page that includes the Solar Window integration
3. You should see the Solar Window app embedded in your dashboard
4. Try clicking on different buildings to see solar analysis data flow between the applications

## Troubleshooting

### CORS Issues

If you encounter CORS errors in the browser console, make sure:

1. The Solar Window app is allowing cross-origin requests (this is already configured)
2. You're using the correct URL for the Solar Window app
3. Both applications are using the same protocol (both HTTP or both HTTPS)

### Communication Issues

If the applications aren't communicating properly:

1. Check the browser console for errors
2. Verify that the embedding script is loading correctly
3. Make sure the iframe has the correct src attribute
4. Test with the `/embed-test` page in the Solar Window app to verify communication is working

### Loading the Embedding Script

The embedding script should be loaded in your dashboard's HTML:

```html
<script src="http://localhost:5174/lib/embed.js"></script>
```

## Production Deployment

When deploying to production:

1. Deploy both applications to their respective servers
2. Update the `SOLAR_WINDOW_URL` in your dashboard to point to the production URL of the Solar Window app
3. Configure proper CORS headers on both applications
4. Use HTTPS for both applications
5. Update any hardcoded URLs in both applications

## Available Methods

The Solar Window embedding API provides these methods:

### Dashboard to Solar Window:

```javascript
// Initialize the Solar Window app
solarWindow.sendMessage('COMMAND', 'INITIALIZE');

// Refresh the Solar Window app
solarWindow.sendMessage('COMMAND', 'REFRESH');

// Request the current state
solarWindow.sendMessage('STATE_REQUEST', '');
```

### Solar Window to Dashboard:

```javascript
// Listen for when the app is ready
solarWindow.onMessage('ENGINE_READY', (payload) => {
  console.log('Solar Window is ready:', payload);
});

// Listen for state updates (solar analysis data)
solarWindow.onMessage('STATE_UPDATE', (payload) => {
  console.log('Solar Window state:', payload);
  // Update your dashboard UI with this data
});

// Listen for user interactions
solarWindow.onMessage('INTERACTION', (payload) => {
  console.log('User interaction:', payload);
  // React to user actions in the Solar Window app
});
```

## Need Help?

For additional help and documentation, visit the embedding guide in the Solar Window app at `/embed` or refer to the `EMBEDDING.md` file in the repository. 