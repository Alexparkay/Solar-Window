# Embedding Solar Window in Your Dashboard

This guide explains how to embed the Solar Window application into your dashboard or other web applications.

## Quick Start

1. Create a container element in your HTML:

   ```html
   <div id="solar-window-container"></div>
   ```

2. Add a script tag to load the Solar Window embedding helper:

   ```html
   <script src="https://your-solar-window-url/lib/embed.js"></script>
   ```

3. Initialize the embedding:
   ```javascript
   const solarWindow = SolarWindow.embed({
     containerId: 'solar-window-container',
     apiKey: 'YOUR_GOOGLE_MAPS_API_KEY', // Optional
     height: '600px',
     width: '100%',
     defaultLocation: '303 S Technology Ct', // Optional
   });
   ```

## Manual Embedding (Alternative)

If you prefer more control, you can manually embed the Solar Window application:

1. Create an iframe:

   ```html
   <iframe
     id="solar-window-iframe"
     src="https://your-solar-window-url"
     style="width: 100%; height: 600px; border: none;"
     allowfullscreen
   ></iframe>
   ```

2. Set up communication:

   ```javascript
   const iframe = document.getElementById('solar-window-iframe');

   // Send message to Solar Window
   function sendToSolarWindow(type, payload) {
     iframe.contentWindow.postMessage({ type, payload }, 'https://your-solar-window-url');
   }

   // Listen for messages from Solar Window
   window.addEventListener('message', (event) => {
     if (event.origin === 'https://your-solar-window-url') {
       const { type, payload } = event.data;
       console.log('Message from Solar Window:', type, payload);

       // Handle different message types
       switch (type) {
         case 'ENGINE_READY':
           console.log('Solar Window is ready');
           sendToSolarWindow('COMMAND', 'INITIALIZE');
           break;

         case 'STATE_UPDATE':
           console.log('Solar Window state:', payload);
           break;

         case 'INTERACTION':
           console.log('User interaction:', payload);
           break;
       }
     }
   });
   ```

## Communication Protocol

The Solar Window application communicates with the parent application using the `postMessage` API.

### Messages from Dashboard to Solar Window

| Message Type    | Payload        | Description                                       |
| --------------- | -------------- | ------------------------------------------------- |
| `COMMAND`       | `"INITIALIZE"` | Initialize the Solar Window app                   |
| `COMMAND`       | `"REFRESH"`    | Refresh the Solar Window app                      |
| `STATE_REQUEST` | (empty)        | Request the current state of the Solar Window app |

### Messages from Solar Window to Dashboard

| Message Type   | Payload                  | Description                               |
| -------------- | ------------------------ | ----------------------------------------- |
| `ENGINE_READY` | Version and capabilities | Sent when the Solar Window app is ready   |
| `STATE_UPDATE` | Current state object     | Sent when the state changes               |
| `INTERACTION`  | Interaction details      | Sent when the user interacts with the app |

### State Object Structure

The state object contains information about the current state of the Solar Window app:

```javascript
{
  location: { lat: number, lng: number },
  address: string,
  buildingInsights: object, // Building insights data
  solarPotential: object    // Solar potential data
}
```

## API Reference

### SolarWindow.embed(options)

Creates an embedded instance of the Solar Window application.

**Parameters:**

- `options` (Object): Configuration options
  - `containerId` (string): ID of the container element
  - `apiKey` (string, optional): Google Maps API key
  - `height` (string, optional): Height of the iframe (default: '600px')
  - `width` (string, optional): Width of the iframe (default: '100%')
  - `defaultLocation` (string, optional): Default location to use

**Returns:** An object with the following methods:

- `sendMessage(type, payload)`: Send a message to the Solar Window app
- `onMessage(type, handler)`: Register a handler for a specific message type
- `getMessages()`: Get all messages received from the Solar Window app
- `getIframe()`: Get the iframe element

## Example: React Integration

```jsx
import React, { useEffect, useRef } from 'react';

const SolarWindowWidget = () => {
  const containerRef = useRef(null);
  const solarWindowRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && window.SolarWindow) {
      solarWindowRef.current = window.SolarWindow.embed({
        containerId: 'solar-window-container',
        height: '600px',
        width: '100%',
      });

      // Listen for state updates
      solarWindowRef.current.onMessage('STATE_UPDATE', (payload) => {
        console.log('Solar Window state:', payload);
      });

      // Listen for interactions
      solarWindowRef.current.onMessage('INTERACTION', (payload) => {
        console.log('User interaction:', payload);
      });
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  const requestState = () => {
    if (solarWindowRef.current) {
      solarWindowRef.current.sendMessage('STATE_REQUEST', '');
    }
  };

  return (
    <div>
      <div id="solar-window-container" ref={containerRef}></div>
      <button onClick={requestState}>Get Current State</button>
    </div>
  );
};

export default SolarWindowWidget;
```

## Example: Vue Integration

```vue
<template>
  <div>
    <div id="solar-window-container"></div>
    <button @click="requestState">Get Current State</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      solarWindow: null,
    };
  },
  mounted() {
    if (window.SolarWindow) {
      this.solarWindow = window.SolarWindow.embed({
        containerId: 'solar-window-container',
        height: '600px',
        width: '100%',
      });

      this.solarWindow.onMessage('STATE_UPDATE', this.handleStateUpdate);
      this.solarWindow.onMessage('INTERACTION', this.handleInteraction);
    }
  },
  beforeUnmount() {
    // Cleanup if needed
  },
  methods: {
    requestState() {
      if (this.solarWindow) {
        this.solarWindow.sendMessage('STATE_REQUEST', '');
      }
    },
    handleStateUpdate(payload) {
      console.log('Solar Window state:', payload);
    },
    handleInteraction(payload) {
      console.log('User interaction:', payload);
    },
  },
};
</script>
```

## Security Considerations

When embedding the Solar Window app in a production environment, consider these security aspects:

1. Use HTTPS for both the parent and child applications
2. Implement authentication if needed
3. Validate the origin of messages in both directions
4. Apply proper Content Security Policy (CSP) headers

## Troubleshooting

### The iframe doesn't load

- Check that the URL is correct and accessible
- Ensure there are no CORS issues

### Communication doesn't work

- Check browser console for errors
- Verify that the origins match or are properly configured
- Make sure both applications are using HTTPS (or both HTTP for local development)

### Solar Window appears but doesn't initialize

- Check that the Google Maps API key is valid
- Verify that the initialization sequence is correct
