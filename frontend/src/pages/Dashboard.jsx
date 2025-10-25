import { useState, useEffect } from 'react';
import { CreditCard, AlertTriangle, TrendingUp } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import AnalyticsCard from '../components/dashboard/AnalyticsCard';
import TransactionList from '../components/dashboard/TransactionList';
import FraudAlert from '../components/dashboard/FraudAlert';
import LiveMonitor from '../components/dashboard/LiveMonitor';
import LiveMonitorControl from '../components/dashboard/LiveMonitorControl';
import FraudPatterns from '../components/dashboard/FraudPatterns';
import AgeSegmentAnalysis from '../components/dashboard/AgeSegmentAnalysis';
import AlertsTimeline from '../components/dashboard/AlertsTimeline';
import Card from '../components/common/Card';
import websocketService from '../services/websocket';
import sseService from '../services/sse';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [connectionType, setConnectionType] = useState('websocket');
  const [streamConfig, setStreamConfig] = useState({ url: '', apiKey: '' });
  const [liveStats, setLiveStats] = useState({
    processed: 0,
    fraudDetected: 0,
    reported: 0,
    avgResponseTime: 0,
    detectionRate: 0
  });

  useEffect(() => {
    // Subscribe to connection events for both services
    const handleConnection = (data) => {
      setConnectionStatus(data.status);
    };

    // Subscribe to transaction events for both services
    const handleTransaction = (transaction) => {
      console.log('Received transaction:', transaction);
      
      setLiveStats(prev => {
        const newProcessed = prev.processed + 1;
        const newFraudDetected = transaction.is_fraud || transaction.flag_value === 1 
          ? prev.fraudDetected + 1 
          : prev.fraudDetected;
        
        return {
          ...prev,
          processed: newProcessed,
          fraudDetected: newFraudDetected,
          reported: newFraudDetected, // In hackathon, we report all detected fraud
          detectionRate: newProcessed > 0 ? ((newFraudDetected / newProcessed) * 100).toFixed(1) : '0'
        };
      });

      // Auto-flag high-value transactions (example logic)
      if (connectionType === 'sse' && transaction.amt && parseFloat(transaction.amt) > 150) {
        console.log(`🚨 High value transaction detected: $${transaction.amt}`);
        // Optionally auto-flag here
        // sseService.flagTransaction(flagUrl, apiKey, transaction.trans_num, 1);
      }
    };

    websocketService.subscribe('connection', handleConnection);
    websocketService.subscribe('transaction', handleTransaction);
    sseService.subscribe('connection', handleConnection);
    sseService.subscribe('transaction', handleTransaction);

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
      sseService.disconnect();
    };
  }, [connectionType]);

  const handleStartMonitoring = (config) => {
    const { url, apiKey, type } = config;
    
    setConnectionType(type);
    setStreamConfig({ url, apiKey });
    
    if (type === 'sse') {
      console.log('Starting SSE connection to:', url);
      sseService.connect(url, apiKey);
    } else {
      console.log('Starting WebSocket connection to:', url);
      websocketService.connect(url);
    }
    
    setIsMonitoring(true);
    
    // Reset stats
    setLiveStats({
      processed: 0,
      fraudDetected: 0,
      reported: 0,
      avgResponseTime: 0,
      detectionRate: 0
    });
  };

  const handleStopMonitoring = () => {
    if (connectionType === 'sse') {
      sseService.disconnect();
    } else {
      websocketService.disconnect();
    }
    setIsMonitoring(false);
    setConnectionStatus('disconnected');
  };

  // Mock data for charts
  const chartData = [
    { name: 'Mon', transactions: 4000, fraud: 240 },
    { name: 'Tue', transactions: 3000, fraud: 139 },
    { name: 'Wed', transactions: 2000, fraud: 98 },
    { name: 'Thu', transactions: 2780, fraud: 390 },
    { name: 'Fri', transactions: 1890, fraud: 480 },
    { name: 'Sat', transactions: 2390, fraud: 380 },
    { name: 'Sun', transactions: 3490, fraud: 430 },
  ];

  const mockAlerts = [
    {
      title: 'Suspicious Transaction Detected',
      description: 'Multiple failed payment attempts from the same IP in the last 5 minutes.',
      severity: 'high',
      time: '2 minutes ago',
      transactionId: 'TXN-001238',
      amount: '€2,500.00'
    },
    {
      title: 'Unusual Pattern Identified',
      description: 'Unusually large amount compared to customer history.',
      severity: 'medium',
      time: '15 minutes ago',
      transactionId: 'TXN-001235',
      amount: '€856.00'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Page Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Real-Time Fraud Detection Dashboard</h1>
              <p className="text-gray-600">AI/ML SIEM for POS Fraud Alerting System - Live Monitor</p>
            </div>

            {/* Live Monitor Control */}
            <LiveMonitorControl 
              onStart={handleStartMonitoring}
              onStop={handleStopMonitoring}
              isRunning={isMonitoring}
            />

            {/* Live Monitor Stats */}
            {isMonitoring && <LiveMonitor connectionStatus={connectionStatus} stats={liveStats} />}

            {/* Analytics Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnalyticsCard
                title="Total Transactions"
                value="12,456"
                icon={CreditCard}
                color="primary"
              />
              <AnalyticsCard
                title="Fraud Detected"
                value="387"
                icon={AlertTriangle}
                color="danger"
              />
              <AnalyticsCard
                title="Detection Rate"
                value="98.5%"
                icon={TrendingUp}
                color="success"
              />
            </div>

            {/* Business Intelligence - Hackathon Questions */}
            <FraudPatterns />
            
            <AlertsTimeline />
            
            <AgeSegmentAnalysis />

            {/* Alerts */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Active Alerts</h2>
              <div className="space-y-4">
                {mockAlerts.map((alert, index) => (
                  <FraudAlert key={index} alert={alert} />
                ))}
              </div>
            </div>

            {/* Transaction List */}
            <TransactionList />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

