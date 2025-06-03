/**
 * Solar Window Embedding Helper
 *
 * This script provides a simple way to embed the Solar Window application
 * in another application.
 *
 * Usage:
 * 1. Include this script in your parent application:
 *    <script src="https://your-solar-window-app.com/lib/embed.js"></script>
 *
 * 2. Create a container element with an ID:
 *    <div id="solar-window-container"></div>
 *
 * 3. Initialize the embedding:
 *    <script>
 *      SolarWindow.embed({
 *        containerId: 'solar-window-container',
 *        apiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
 *        height: '600px',
 *        width: '100%',
 *        defaultLocation: '303 S Technology Ct'
 *      });
 *    </script>
 */

/** @typedef {Object} EmbedOptions
 * @property {string} containerId - ID of the container element
 * @property {string} [apiKey] - Optional Google Maps API key
 * @property {string} [height] - Height of the iframe (default: 600px)
 * @property {string} [width] - Width of the iframe (default: 100%)
 * @property {string} [defaultLocation] - Optional default location to use
 */

/** @typedef {Object} SolarWindowInstance
 * @property {function(string, any): void} sendMessage - Sends a message to the Solar Window application
 * @property {function(string, Function): void} onMessage - Registers a handler for a specific message type
 * @property {function(): Array<any>} getMessages - Gets the messages received from the Solar Window application
 * @property {function(): HTMLIFrameElement} getIframe - Gets the iframe element
 */

const SolarWindow = {
  /**
   * Embeds the Solar Window application in a container
   * @param {EmbedOptions} options Configuration options
   * @returns {SolarWindowInstance} The Solar Window instance
   */
  embed: function (options) {
    const containerId = options.containerId || 'solar-window-container';
    const apiKey = options.apiKey || '';
    const height = options.height || '600px';
    const width = options.width || '100%';
    const defaultLocation = options.defaultLocation || '';

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container element with ID "${containerId}" not found`);
      throw new Error(`Container element with ID "${containerId}" not found`);
    }

    // Build the embed URL
    let embedUrl = window.location.origin;
    const params = new URLSearchParams();

    if (apiKey) {
      params.append('apiKey', apiKey);
    }

    if (defaultLocation) {
      params.append('location', defaultLocation);
    }

    if (params.toString()) {
      embedUrl += '?' + params.toString();
    }

    // Create the iframe
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.style.width = width;
    iframe.style.height = height;
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.allowFullscreen = true;

    container.appendChild(iframe);

    // Create the communication handler
    /** @type {Array<any>} */
    const messages = [];
    /** @type {Record<string, Function[]>} */
    const messageHandlers = {};

    window.addEventListener('message', (event) => {
      if (event.source === iframe.contentWindow) {
        const message = event.data;
        messages.push(message);

        // Call any registered handlers for this message type
        if (messageHandlers[message.type]) {
          messageHandlers[message.type].forEach(
            /** @type {Function} */ (handler) => handler(message.payload),
          );
        }

        // Call any registered handlers for all messages
        if (messageHandlers['all']) {
          messageHandlers['all'].forEach(/** @type {Function} */ (handler) => handler(message));
        }
      }
    });

    return {
      /**
       * Sends a message to the Solar Window application
       * @param {string} type Message type
       * @param {any} payload Message payload
       */
      sendMessage: function (type, payload) {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type, payload }, embedUrl);
        }
      },

      /**
       * Registers a handler for a specific message type
       * @param {string} type Message type to listen for, or 'all' for all messages
       * @param {Function} handler Handler function
       */
      onMessage: function (type, handler) {
        if (!messageHandlers[type]) {
          messageHandlers[type] = [];
        }
        messageHandlers[type].push(handler);
      },

      /**
       * Gets the messages received from the Solar Window application
       * @returns {Array<any>} Array of messages
       */
      getMessages: function () {
        return [...messages];
      },

      /**
       * Gets the iframe element
       * @returns {HTMLIFrameElement} The iframe element
       */
      getIframe: function () {
        return iframe;
      },
    };
  },
};

// Make it available globally
if (typeof window !== 'undefined') {
  // @ts-expect-error - Adding SolarWindow to global window object
  window.SolarWindow = SolarWindow;
}

export default SolarWindow;
