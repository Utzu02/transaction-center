// API Service for Backend Communication
const resolveBaseUrl = () => {
  const candidates = [
    import.meta.env.BACK_URL,
    import.meta.env.VITE_BACK_URL,
    import.meta.env.VITE_API_BASE_URL,
  ];

  const configured = candidates.find((value) => Boolean(value && value.trim()));
  const fallback = 'http://localhost:5050';

  return (configured || fallback).replace(/\/$/, '');
};

const API_BASE_URL = resolveBaseUrl();

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  buildUrl(endpoint = '') {
    if (!endpoint) {
      return this.baseUrl;
    }

    const sanitizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${sanitizedEndpoint}`;
  }

  // Helper to normalize transaction data
  normalizeTransaction(transaction) {
    if (!transaction) return transaction;
    
    // Ensure isFraud property exists for frontend consistency
    if (transaction.is_fraud !== undefined && transaction.isFraud === undefined) {
      transaction.isFraud = transaction.is_fraud;
    } else if (transaction.isFraud === undefined) {
      transaction.isFraud = false;
    }
    
    return transaction;
  }

  // Helper method for API calls
  async request(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ==================== TRANSACTIONS ====================
  
  /**
   * Get all transactions with optional filters
   * @param {Object} filters - Filter parameters (status, limit, offset, etc.)
   */
  async getTransactions(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await this.request(`/api/transactions?${params}`);
    
    // Normalize transactions to include isFraud property
    if (response.success && response.transactions) {
      response.transactions = response.transactions.map(t => this.normalizeTransaction(t));
    }
    
    return response;
  }

  /**
   * Get a single transaction by ID
   * @param {string} id - Transaction ID
   */
  async getTransaction(id) {
    const transaction = await this.request(`/api/transactions/${id}`);
    return this.normalizeTransaction(transaction);
  }

  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data to create
   */
  async createTransaction(transactionData) {
    return this.request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  /**
   * Get recent transactions
   * @param {number} limit - Number of transactions to fetch
   */
  async getRecentTransactions(limit = 10) {
    const response = await this.request(`/api/transactions/recent?limit=${limit}`);
    
    // Normalize transactions to include isFraud property
    if (response.success && response.transactions) {
      response.transactions = response.transactions.map(t => this.normalizeTransaction(t));
    }
    
    return response;
  }

  /**
   * Get transactions by status
   * @param {string} status - 'accepted', 'blocked', or 'pending'
   * @param {number} limit - Number of transactions
   */
  async getTransactionsByStatus(status, limit = 100) {
    const response = await this.request(`/api/transactions?status=${status}&limit=${limit}`);
    
    // Normalize transactions to include isFraud property
    if (response.success && response.transactions) {
      response.transactions = response.transactions.map(t => this.normalizeTransaction(t));
    }
    
    return response;
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats() {
    return this.request('/api/transactions/stats');
  }

  /**
   * Delete a transaction
   * @param {string} transNum - Transaction number
   */
  async deleteTransaction(transNum) {
    return this.request(`/api/transactions/${transNum}`, {
      method: 'DELETE',
    });
  }

  /**
   * Delete all transactions
   */
  async deleteAllTransactions() {
    return this.request('/api/transactions/delete-all', {
      method: 'DELETE',
    });
  }

  // ==================== ANALYTICS ====================

  /**
   * Get analytics summary
   */
  async getAnalytics() {
    return this.request('/api/analytics');
  }

  /**
   * Get fraud statistics
   */
  async getFraudStats() {
    return this.request('/api/analytics/fraud-stats');
  }

  /**
   * Get fraud patterns for a specific time window
   * @param {number} hours - Time window in hours
   * @param {number} topN - Number of top patterns to return
   */
  async getFraudPatterns(hours = 1, topN = 5) {
    return this.request(`/api/analytics/fraud-patterns?hours=${hours}&top_n=${topN}`);
  }

  /**
   * Get age segment analysis
   */
  async getAgeSegmentAnalysis() {
    return this.request('/api/analytics/age-segments');
  }

  /**
   * Get alerts for a time window
   * @param {number} hours - Time window in hours
   */
  async getAlerts(hours = 2) {
    return this.request(`/api/analytics/alerts?hours=${hours}`);
  }

  /**
   * Get transaction trends
   */
  async getTransactionTrends() {
    return this.request('/api/analytics/trends');
  }

  // ==================== FRAUD DETECTION ====================

  /**
   * Flag a transaction as fraud or legitimate
   * @param {string} transNum - Transaction number
   * @param {number} flagValue - 0 for legitimate, 1 for fraud
   */
  async flagTransaction(transNum, flagValue) {
    return this.request('/api/flag', {
      method: 'POST',
      body: JSON.stringify({
        trans_num: transNum,
        flag_value: flagValue,
      }),
    });
  }

  /**
   * Predict fraud for a new transaction
   * @param {Object} transaction - Transaction data
   */
  async predictFraud(transaction) {
    return this.request('/api/predict', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  // ==================== DASHBOARD ====================

  /**
   * Get dashboard summary data
   */
  async getDashboardSummary() {
    return this.request('/api/dashboard/summary');
  }

  /**
   * Get live statistics
   */
  async getLiveStats() {
    return this.request('/api/dashboard/live-stats');
  }

  // ==================== NOTIFICATIONS ====================

  /**
   * Get all notifications
   * @param {Object} filters - Filter parameters (limit, include_read, type)
   */
  async getNotifications(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/notifications?${params}`);
  }

  /**
   * Create a notification
   * @param {Object} notificationData - Notification data
   */
  async createNotification(notificationData) {
    return this.request('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  }

  /**
   * Mark notification as read
   * @param {string} id - Notification ID
   */
  async markNotificationRead(id) {
    return this.request(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  /**
   * Delete a notification
   * @param {string} id - Notification ID
   */
  async deleteNotification(id) {
    return this.request(`/api/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Delete all notifications
   */
  async deleteAllNotifications() {
    return this.request('/api/notifications/delete-all', {
      method: 'DELETE',
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead() {
    return this.request('/api/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  // ==================== UTILITY ====================

  /**
   * Health check
   */
  async healthCheck() {
    return this.request('/api/health');
  }

  /**
   * Get model information
   */
  async getModelInfo() {
    return this.request('/api/model/info');
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;
