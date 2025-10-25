# Backend Integration Guide

## Setup Steps

### 1. Create `.env` File

Create `/frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_STREAM_URL=https://95.217.75.14:8443/stream
VITE_FLAG_URL=https://95.217.75.14:8443/api/flag
VITE_API_KEY=your_api_key_here
```

### 2. Start Backend

```bash
cd backend
python api_server.py
```

### 3. Use API in Components

## Example: Fetch Transactions

### Option A: Using the API Service

```javascript
import { useEffect, useState } from 'react';
import apiService from '../services/api';

function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const data = await apiService.getTransactions({ 
          status: 'all', 
          limit: 100 
        });
        setTransactions(data.transactions);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTransactions();
  }, []);

  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {transactions.map(tx => (
        <div key={tx.id}>{tx.customer} - {tx.amount}</div>
      ))}
    </div>
  );
}
```

### Option B: Direct Fetch

```javascript
useEffect(() => {
  async function fetchData() {
    const response = await fetch('http://localhost:5000/api/transactions?limit=10');
    const data = await response.json();
    setTransactions(data.transactions);
  }
  fetchData();
}, []);
```

## Example: Fetch Analytics

```javascript
import apiService from '../services/api';

// In your component:
useEffect(() => {
  async function loadAnalytics() {
    const analytics = await apiService.getAnalytics();
    const fraudStats = await apiService.getFraudStats();
    const patterns = await apiService.getFraudPatterns(2, 5); // Last 2 hours, top 5
    
    // Update your state
    setAnalyticsData(analytics);
    setFraudData(fraudStats);
    setPatterns(patterns.patterns);
  }
  
  loadAnalytics();
}, []);
```

## Example: Real-time with Polling

For real-time updates without SSE:

```javascript
useEffect(() => {
  // Fetch initially
  fetchData();
  
  // Poll every 5 seconds
  const interval = setInterval(fetchData, 5000);
  
  // Cleanup
  return () => clearInterval(interval);
}, []);
```

## Available API Methods

```javascript
// Transactions
await apiService.getTransactions(filters);
await apiService.getTransaction(id);
await apiService.getRecentTransactions(limit);
await apiService.getTransactionsByStatus(status, limit);

// Analytics
await apiService.getAnalytics();
await apiService.getFraudStats();
await apiService.getFraudPatterns(hours, topN);
await apiService.getAgeSegmentAnalysis();
await apiService.getAlerts(hours);
await apiService.getTransactionTrends();

// Dashboard
await apiService.getDashboardSummary();
await apiService.getLiveStats();

// Fraud Detection
await apiService.flagTransaction(transNum, flagValue);
await apiService.predictFraud(transaction);

// Utility
await apiService.healthCheck();
await apiService.getModelInfo();
```

## Complete Example: Dashboard with Backend

```javascript
import { useState, useEffect } from 'react';
import apiService from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    processed: 0,
    fraudDetected: 0,
    detectionRate: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadDashboardData() {
    try {
      // Fetch multiple data in parallel
      const [summary, recentTx] = await Promise.all([
        apiService.getDashboardSummary(),
        apiService.getRecentTransactions(5)
      ]);
      
      setStats({
        processed: summary.total_transactions,
        fraudDetected: summary.fraud_detected,
        detectionRate: summary.detection_rate
      });
      
      setTransactions(recentTx.transactions || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="stats">
        <div>Total: {stats.processed}</div>
        <div>Fraud: {stats.fraudDetected}</div>
        <div>Rate: {stats.detectionRate}%</div>
      </div>
      
      <h2>Recent Transactions</h2>
      {transactions.map(tx => (
        <div key={tx.id}>{tx.customer} - {tx.amount}</div>
      ))}
    </div>
  );
};

export default Dashboard;
```

## Error Handling

```javascript
try {
  const data = await apiService.getTransactions();
  setTransactions(data.transactions);
} catch (error) {
  if (error.message.includes('503')) {
    console.error('Backend service unavailable');
    // Show user-friendly error
  } else if (error.message.includes('404')) {
    console.error('Endpoint not found');
  } else {
    console.error('Network error:', error);
  }
}
```

## Testing

### 1. Test Backend

```bash
# In backend directory
python api_server.py
```

Visit: http://localhost:5000/api/health

### 2. Test Frontend

```bash
# In frontend directory
npm run dev
```

Open browser console and check for API calls.

### 3. Debug

```javascript
// Add logging to API service
console.log('Fetching from:', API_BASE_URL + endpoint);
console.log('Response:', data);
```

## Next Steps

1. Replace mock data in `api_server.py` with your actual data source
2. Implement authentication if needed
3. Add error boundaries in React components
4. Implement loading states
5. Add toast notifications for API errors
6. Cache frequently accessed data
7. Implement infinite scroll/pagination for large datasets

## Troubleshooting

**CORS errors:**
- Backend must have `flask-cors` installed and enabled
- Check browser console for specific CORS errors

**No data showing:**
- Check if backend is running: `curl http://localhost:5000/api/health`
- Verify `.env` file exists and has correct URL
- Check browser console for errors

**Slow performance:**
- Implement caching
- Use pagination
- Debounce frequent API calls
- Use React Query or SWR for data fetching

