<script>
  import { onMount } from 'svelte';

  // Get the current base URL
  let baseUrl = '';
  onMount(() => {
    baseUrl = window.location.origin;
  });
</script>

<div class="p-8 max-w-4xl mx-auto">
  <h1 class="text-3xl font-bold mb-6">Solar Window Embedding Guide</h1>
  
  <div class="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
    <h2 class="text-xl font-semibold mb-4">Quick Setup</h2>
    <p class="mb-4">Follow these steps to embed Solar Window in your application:</p>
    
    <ol class="list-decimal pl-6 space-y-4">
      <li>
        <strong>Add the embedding script</strong> to your HTML:
        <pre class="bg-gray-100 p-3 rounded mt-2 overflow-x-auto">
          <code>&lt;script src="{baseUrl}/lib/embed.js"&gt;&lt;/script&gt;</code>
        </pre>
      </li>
      
      <li>
        <strong>Create a container</strong> for the Solar Window:
        <pre class="bg-gray-100 p-3 rounded mt-2 overflow-x-auto">
          <code>&lt;div id="solar-window-container"&gt;&lt;/div&gt;</code>
        </pre>
      </li>
      
      <li>
        <strong>Initialize</strong> the embedding:
        <pre class="bg-gray-100 p-3 rounded mt-2 overflow-x-auto">
          <code>
const solarWindow = SolarWindow.embed({
  containerId: 'solar-window-container',
  height: '600px',
  width: '100%',
  defaultLocation: '303 S Technology Ct'
});
          </code>
        </pre>
      </li>
    </ol>
  </div>
  
  <div class="mb-8">
    <h2 class="text-2xl font-semibold mb-4">Communication API</h2>
    <p class="mb-4">
      Solar Window communicates with your application using the postMessage API.
      Here's how to listen for events:
    </p>
    
    <pre class="bg-gray-100 p-3 rounded overflow-x-auto mb-6">
      <code>
// Listen for state updates
solarWindow.onMessage('STATE_UPDATE', (payload) => {
  console.log('Solar Window state:', payload);
});

// Listen for user interactions
solarWindow.onMessage('INTERACTION', (payload) => {
  console.log('User interaction:', payload);
});

// Send commands to Solar Window
solarWindow.sendMessage('COMMAND', 'INITIALIZE');
solarWindow.sendMessage('STATE_REQUEST', '');
      </code>
    </pre>
  </div>
  
  <div class="mb-8">
    <h2 class="text-2xl font-semibold mb-4">Test Your Integration</h2>
    <p class="mb-4">
      You can test the integration using our <a href="/embed-test" class="text-blue-600 underline">embedding test page</a>.
    </p>
  </div>
  
  <div class="mb-8">
    <h2 class="text-2xl font-semibold mb-4">Need More Details?</h2>
    <p>
      For more detailed information, example code, and troubleshooting, view our 
      <a href="https://github.com/yourusername/solar-window/blob/main/EMBEDDING.md" class="text-blue-600 underline">
        complete documentation on GitHub
      </a>.
    </p>
  </div>
</div>

<style>
  :global(body) {
    background-color: #f9fafb;
    color: #1f2937;
  }
  
  pre {
    font-family: ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro", "Fira Mono", "Droid Sans Mono", "Courier New", monospace;
  }
</style> 