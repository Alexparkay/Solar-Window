<script lang="ts">
  import { onMount } from 'svelte';
  
  let iframeElement: HTMLIFrameElement;
  let messages: any[] = [];
  
  // Send a message to the iframe
  function sendMessage(type: string, payload: any) {
    iframeElement.contentWindow?.postMessage(
      { type, payload },
      window.location.origin
    );
  }
  
  onMount(() => {
    // Listen for messages from the iframe
    window.addEventListener('message', (event) => {
      if (event.source === iframeElement.contentWindow) {
        messages = [...messages, event.data];
        console.log('Received message:', event.data);
      }
    });
  });
</script>

<div class="p-4 max-w-7xl mx-auto">
  <h1 class="text-2xl font-bold mb-4">Solar Window Embedding Test</h1>
  
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div class="lg:col-span-2">
      <iframe
        bind:this={iframeElement}
        src="/"
        title="Solar Window"
        class="w-full h-[600px] border border-gray-300 rounded"
      ></iframe>
    </div>
    
    <div class="bg-gray-100 p-4 rounded">
      <h2 class="text-xl font-bold mb-2">Communication Panel</h2>
      
      <div class="mb-4">
        <h3 class="font-semibold mb-2">Controls</h3>
        <div class="flex flex-col gap-2">
          <button
            class="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            on:click={() => sendMessage('COMMAND', 'INITIALIZE')}
          >
            Initialize
          </button>
          
          <button
            class="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            on:click={() => sendMessage('STATE_REQUEST', '')}
          >
            Request State
          </button>
          
          <button
            class="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            on:click={() => sendMessage('COMMAND', 'REFRESH')}
          >
            Refresh
          </button>
        </div>
      </div>
      
      <div>
        <h3 class="font-semibold mb-2">Messages from Solar Window</h3>
        <div class="bg-white p-2 rounded h-64 overflow-y-auto text-sm">
          {#if messages.length === 0}
            <p class="text-gray-500">No messages received yet</p>
          {:else}
            {#each messages as message, i}
              <div class="mb-2 pb-2 border-b border-gray-200">
                <div class="font-medium">{message.type}</div>
                <pre class="text-xs overflow-x-auto">{JSON.stringify(message.payload, null, 2)}</pre>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </div>
  </div>
</div> 