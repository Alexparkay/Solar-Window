// Types for communication with parent dashboard
export interface DashboardMessage {
  type: 'COMMAND' | 'STATE_REQUEST';
  payload: any;
  auth?: string;
}

export interface EngineMessage {
  type: 'STATE_UPDATE' | 'ENGINE_READY' | 'INTERACTION';
  payload: any;
  timestamp: number;
}

// State that can be shared with the parent dashboard
export interface SolarEngineState {
  location?: { lat: number; lng: number };
  address?: string;
  buildingInsights?: any;
  solarPotential?: any;
}

let parentOrigin = '*'; // Will be set on first message
let engineState: SolarEngineState = {};
let isIframe = false;

// Initialize communication with parent dashboard
export function initCommunication() {
  // Check if running in an iframe
  try {
    isIframe = window.self !== window.top;
  } catch (e) {
    // If we can't access window.top, we're definitely in an iframe with different origin
    isIframe = true;
  }

  if (!isIframe) {
    console.log('Not running in iframe, communication disabled');
    return;
  }

  // Set up message listener
  window.addEventListener('message', handleParentMessage);
  
  // Notify parent that we're ready
  setTimeout(() => {
    sendToDashboard({
      type: 'ENGINE_READY',
      payload: {
        version: '1.0.0',
        capabilities: ['solar-analysis', 'map-interaction']
      },
      timestamp: Date.now()
    });
  }, 1000);
}

// Handle incoming messages from parent dashboard
function handleParentMessage(event: MessageEvent<DashboardMessage>) {
  // Store the origin of the parent for future communication
  if (parentOrigin === '*') {
    parentOrigin = event.origin;
  }

  // Process message
  const message = event.data;
  
  switch (message.type) {
    case 'COMMAND':
      handleCommand(message.payload);
      break;
      
    case 'STATE_REQUEST':
      sendStateUpdate();
      break;
      
    default:
      console.warn('Unknown message type:', message.type);
  }
}

// Handle commands from parent dashboard
function handleCommand(command: string) {
  console.log('Received command:', command);
  
  switch (command) {
    case 'INITIALIZE':
      // No specific initialization needed beyond what's done at startup
      break;
      
    case 'REFRESH':
      window.location.reload();
      break;
      
    default:
      console.warn('Unknown command:', command);
  }
}

// Send messages to parent dashboard
export function sendToDashboard(message: EngineMessage) {
  if (!isIframe) return;
  
  try {
    window.parent.postMessage(message, parentOrigin);
  } catch (e) {
    console.error('Failed to send message to dashboard:', e);
  }
}

// Send current state to parent dashboard
export function sendStateUpdate() {
  sendToDashboard({
    type: 'STATE_UPDATE',
    payload: engineState,
    timestamp: Date.now()
  });
}

// Update the engine state and optionally notify parent
export function updateEngineState(newState: Partial<SolarEngineState>, notify = true) {
  engineState = { ...engineState, ...newState };
  
  if (notify) {
    sendStateUpdate();
  }
}

// Send interaction events to parent dashboard
export function sendInteraction(action: string, data?: any) {
  sendToDashboard({
    type: 'INTERACTION',
    payload: {
      action,
      data,
      timestamp: Date.now()
    },
    timestamp: Date.now()
  });
} 