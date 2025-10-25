// WebSocket service for real-time fraud detection
class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  connect(url = 'ws://localhost:8080/stream') {
    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.notifyListeners('connection', { status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners('transaction', data);
          
          // Auto-detect fraud and report back within 30 seconds
          if (data.is_fraud || this.detectFraud(data)) {
            this.reportFraud(data);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.notifyListeners('error', { error });
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.notifyListeners('connection', { status: 'disconnected' });
        this.attemptReconnect(url);
      };
    } catch (error) {
      console.error('Connection error:', error);
    }
  }

  // Simple fraud detection logic (can be enhanced)
  detectFraud(transaction) {
    // High amount threshold
    if (transaction.amt > 1000) return true;
    
    // Multiple transactions in short time
    // (would need transaction history)
    
    return false;
  }

  reportFraud(transaction) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'fraud_detected',
        transaction_id: transaction.transaction_id,
        timestamp: Date.now(),
        confidence: 0.95
      }));
    }
  }

  attemptReconnect(url) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => this.connect(url), this.reconnectDelay);
    }
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.unsubscribe(event, callback); // Return cleanup function
  }

  unsubscribe(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

export default new WebSocketService();

