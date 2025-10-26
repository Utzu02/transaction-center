// SSE Service for Hackathon Stream
let eventSource = null;
const subscribers = {};

const sseService = {
  isConnected: () => {
    return eventSource !== null;
  },

  connect: (streamUrl, apiKey) => {
    if (eventSource && eventSource.readyState === EventSource.OPEN) {
      console.log('SSE already connected.');
      return;
    }

    // For SSE with headers, we need to use fetch with EventSource polyfill
    // Or use a library like eventsource (npm package)
    // For now, we'll use native EventSource with URL params
    
    // Construct URL with API key as query param (if backend supports it)
    // Otherwise, we'll need to use fetch API
    const url = new URL(streamUrl);
    
    try {
      // Native EventSource (doesn't support custom headers in browser)
      // We'll use fetch with stream processing instead
      sseService.connectWithFetch(streamUrl, apiKey);
    } catch (error) {
      console.error('Failed to connect to SSE stream:', error);
      sseService.publish('connection', { status: 'error', error: error.message });
    }
  },

  connectWithFetch: async (streamUrl, apiKey) => {
    try {
      const response = await fetch(streamUrl, {
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'text/event-stream',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('SSE connected');
      sseService.publish('connection', { status: 'connected' });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Read stream
      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('SSE stream ended');
            sseService.publish('connection', { status: 'disconnected' });
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6); // Remove 'data: ' prefix
              try {
                const transaction = JSON.parse(data);
                sseService.publish('transaction', transaction);
              } catch (e) {
                console.error('Failed to parse SSE data:', e, data);
              }
            }
          }
        }
      };

      // Store reader for cleanup
      eventSource = { reader, abort: () => reader.cancel() };
      
      processStream().catch(error => {
        console.error('Stream processing error:', error);
        sseService.publish('connection', { status: 'error', error: error.message });
      });

    } catch (error) {
      console.error('Failed to connect with fetch:', error);
      sseService.publish('connection', { status: 'error', error: error.message });
    }
  },

  disconnect: () => {
    if (eventSource) {
      if (eventSource.abort) {
        eventSource.abort();
      } else if (eventSource.close) {
        eventSource.close();
      }
      eventSource = null;
      console.log('SSE disconnected');
      sseService.publish('connection', { status: 'disconnected' });
    }
  },

  subscribe: (eventType, callback) => {
    if (!subscribers[eventType]) {
      subscribers[eventType] = [];
    }
    subscribers[eventType].push(callback);
    return () => sseService.unsubscribe(eventType, callback); // Return cleanup function
  },

  unsubscribe: (eventType, callback) => {
    if (subscribers[eventType]) {
      const index = subscribers[eventType].indexOf(callback);
      if (index > -1) {
        subscribers[eventType].splice(index, 1);
      }
    }
  },

  publish: (eventType, data) => {
    if (subscribers[eventType]) {
      subscribers[eventType].forEach(callback => callback(data));
    }
  },

  // Flag a transaction as fraud or legitimate
  flagTransaction: async (flagUrl, apiKey, transNum, flagValue) => {
    // Use environment variable if not provided
    const url = flagUrl || import.meta.env.VITE_FLAG_URL;
    const key = apiKey || import.meta.env.VITE_API_KEY;

    if (!url || !key) {
      console.error('Flag URL or API Key not provided');
      return { success: false, reason: 'Missing flag URL or API key' };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-Key': key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trans_num: transNum,
          flag_value: flagValue, // 0 = legitimate, 1 = fraud
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to flag transaction:', error);
      return { success: false, reason: error.message };
    }
  },

  // Get flag URL from environment
  getFlagUrl: () => import.meta.env.VITE_FLAG_URL,

  // Get API Key from environment
  getApiKey: () => import.meta.env.VITE_API_KEY
};

export default sseService;

