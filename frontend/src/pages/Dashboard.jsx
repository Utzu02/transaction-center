import { useState, useEffect, useRef } from 'react';
import { CreditCard, AlertTriangle, TrendingUp } from 'lucide-react';
import { useToast } from '../components/common/ToastContainer';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import AnalyticsCard from '../components/dashboard/AnalyticsCard';
import TransactionList from '../components/dashboard/TransactionList';
import FraudAlert from '../components/dashboard/FraudAlert';
import LiveMonitor from '../components/dashboard/LiveMonitor';
import LiveMonitorControl from '../components/dashboard/LiveMonitorControl';
import Card from '../components/common/Card';
import websocketService from '../services/websocket';
import sseService from '../services/sse';
import { formatTransaction } from '../utils/fraudDetection';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const toast = useToast();
  const lastNotificationRef = useRef(0);
  
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
  const [processedTransactions, setProcessedTransactions] = useState([]);

  useEffect(() => {
    // Subscribe to connection events for both services
    const handleConnection = (data) => {
      setConnectionStatus(data.status);
    };

    // Subscribe to transaction events for both services
    const handleTransaction = (transaction) => {
      console.log('Received transaction:', transaction);
      
      // Format and analyze transaction
      const formattedTransaction = formatTransaction(transaction);
      const startTime = Date.now();
      
      // Store transaction
      setProcessedTransactions(prev => [...prev, formattedTransaction].slice(-100)); // Keep last 100
      
      // Update stats
      setLiveStats(prev => {
        const newProcessed = prev.processed + 1;
        const newFraudDetected = formattedTransaction.isFraud 
          ? prev.fraudDetected + 1 
          : prev.fraudDetected;
        
        const endTime = Date.now();
        const responseTime = (endTime - startTime) / 1000;
        
        return {
          ...prev,
          processed: newProcessed,
          fraudDetected: newFraudDetected,
          reported: newFraudDetected, // In hackathon, we report all detected fraud
          detectionRate: newProcessed > 0 ? ((newFraudDetected / newProcessed) * 100).toFixed(1) : '0',
          avgResponseTime: ((prev.avgResponseTime * (newProcessed - 1) + responseTime) / newProcessed).toFixed(2)
        };
      });

      // Auto-flag if fraud detected
      if (connectionType === 'sse' && formattedTransaction.isFraud) {
        console.log(`🚨 Fraud detected: Score ${formattedTransaction.riskScore} - Pattern: ${formattedTransaction.pattern}`);
        
        // Show notification (max once per 3 seconds to avoid spam)
        const now = Date.now();
        if (now - lastNotificationRef.current > 3000) {
          toast.showWarning(
            `Fraud Detected: $${formattedTransaction.amount.toFixed(2)} - ${formattedTransaction.pattern}`,
            4000
          );
          lastNotificationRef.current = now;
        }
        
        // Auto-flag to server
        if (streamConfig.apiKey && transaction.trans_num) {
          sseService.flagTransaction(
            streamConfig.url.replace('/stream', '/api/flag'),
            streamConfig.apiKey,
            transaction.trans_num,
            1 // Flag as fraud
          ).then(result => {
            console.log('Flag response:', result);
            if (result.success) {
              console.log('✅ Successfully flagged transaction');
            }
          });
        }
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
      toast.showInfo('Connecting to fraud detection stream...', 3000);
    } else {
      console.log('Starting WebSocket connection to:', url);
      websocketService.connect(url);
      toast.showInfo('Connecting to WebSocket stream...', 3000);
    }
    
    setIsMonitoring(true);
    setProcessedTransactions([]);
    
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
    toast.showInfo('Monitoring stopped', 2000);
  };

  // Show connection status notifications
  useEffect(() => {
    if (connectionStatus === 'connected') {
      toast.showSuccess('Connected to stream successfully!', 3000);
    } else if (connectionStatus === 'error') {
      toast.showError('Failed to connect to stream', 4000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionStatus]);

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
                value={liveStats.processed || "0"}
                icon={CreditCard}
                color="primary"
                tooltip="Total transactions processed and analyzed in real-time."
              />
              <AnalyticsCard
                title="Fraud Detected"
                value={liveStats.fraudDetected || "0"}
                icon={AlertTriangle}
                color="danger"
                tooltip="Fraudulent transactions flagged by AI/ML system based on risk patterns."
              />
              <AnalyticsCard
                title="Detection Rate"
                value={`${liveStats.detectionRate || "0"}%`}
                icon={TrendingUp}
                color="success"
                tooltip="Percentage of transactions identified as fraud. Target: high accuracy, low false positives."
              />
            </div>


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
            <TransactionList 
              transactions={processedTransactions.map(t => ({
                id: t.id,
                customer: t.customer,
                merchant: t.merchant,
                amount: `$${t.amount.toFixed(2)}`,
                category: t.category,
                location: t.location,
                riskScore: t.riskScore,
                status: t.isFraud ? 'blocked' : 'completed',
                date: t.timestamp ? new Date(t.timestamp * 1000).toISOString() : new Date().toISOString()
              }))}
              maxRows={10}
              showExport={true}
              showViewMore={true}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

