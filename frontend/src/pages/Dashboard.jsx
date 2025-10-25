import { useState, useEffect, useRef } from 'react';
import { CreditCard, AlertTriangle, TrendingUp, Upload, Play, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/common/ToastContainer';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import AnalyticsCard from '../components/dashboard/AnalyticsCard';
import TransactionList from '../components/dashboard/TransactionList';
import LiveMonitor from '../components/dashboard/LiveMonitor';
import Button from '../components/common/Button';
import websocketService from '../services/websocket';
import sseService from '../services/sse';
import { formatTransaction } from '../utils/fraudDetection';

const Dashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const lastNotificationRef = useRef(0);
  
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionType, setConnectionType] = useState('sse');
  const [streamConfig, setStreamConfig] = useState({ 
    url: import.meta.env.VITE_STREAM_URL || 'https://95.217.75.14:8443/stream', 
    apiKey: import.meta.env.VITE_API_KEY || '' 
  });
  const [liveStats, setLiveStats] = useState({
    processed: 0,
    fraudDetected: 0,
    reported: 0,
    avgResponseTime: 0,
    detectionRate: 0
  });
  const [processedTransactions, setProcessedTransactions] = useState([]);

  // Handle start monitoring
  const handleStartMonitoring = () => {
    const url = streamConfig.url.trim();
    const key = streamConfig.apiKey.trim();
    
    if (!url) {
      toast.showError('Please configure the stream URL in Settings first', 3000);
      navigate('/settings');
      return;
    }

    if (connectionType === 'sse' && !key) {
      toast.showError('⚠️ API Key is required for SSE connection. Please add it in Settings.', 4000);
      navigate('/settings');
      return;
    }

    // Auto-prepend protocol if not present
    let finalUrl = url;
    if (connectionType === 'websocket') {
      if (!finalUrl.startsWith('ws://') && !finalUrl.startsWith('wss://')) {
        finalUrl = 'ws://' + finalUrl;
      }
    } else {
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
      }
    }

    // Show connecting toast immediately
    toast.showInfo('🔄 Connecting to fraud detection stream...', 3000);
    setIsConnecting(true);
    
    try {
      if (connectionType === 'sse') {
        sseService.connect(finalUrl, key);
      } else {
        websocketService.connect(finalUrl);
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.showError(`Failed to start monitoring: ${error.message}`, 4000);
      setIsConnecting(false);
    }
  };

  // Handle stop monitoring
  const handleStopMonitoring = () => {
    websocketService.disconnect();
    sseService.disconnect();
    setIsMonitoring(false);
    setConnectionStatus('disconnected');
    toast.showInfo('Monitoring stopped', 2000);
  };

  // Load configuration from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('monitorConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setStreamConfig(config.streamConfig || streamConfig);
        setConnectionType(config.connectionType || connectionType);
      } catch (e) {
        console.error('Failed to load saved config:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Subscribe to connection events for both services
    const handleConnection = (data) => {
      setConnectionStatus(data.status);
      
      // Handle connection success or failure
      if (data.status === 'connected') {
        setIsConnecting(false);
        setIsMonitoring(true);
      } else if (data.status === 'error') {
        setIsConnecting(false);
        setIsMonitoring(false);
        toast.showError(`❌ Connection failed: ${data.error || 'Unknown error'}`, 4000);
      }
    };

    // Subscribe to transaction events for both services
    const handleTransaction = (transaction) => {
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
          ).catch(error => {
            console.error('Failed to flag transaction:', error);
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


  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if it's a CSV file
    if (!file.name.endsWith('.csv')) {
      toast.showError('Please select a CSV file', 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');
        
        // Skip header line
        const dataLines = lines.slice(1).filter(line => line.trim());
        
        let imported = 0;
        const newTransactions = [];

        dataLines.forEach((line) => {
          // Parse CSV line (handle quoted fields)
          const fields = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (!fields || fields.length < 10) return;

          // Clean fields (remove quotes)
          const cleanFields = fields.map(f => f.replace(/^"(.*)"$/, '$1').trim());

          // Map CSV columns to transaction object
          const transaction = {
            trans_date_trans_time: cleanFields[0],
            cc_num: cleanFields[1],
            merchant: cleanFields[2],
            category: cleanFields[3],
            amt: parseFloat(cleanFields[4]) || 0,
            first: cleanFields[5],
            last: cleanFields[6],
            gender: cleanFields[7],
            street: cleanFields[8],
            city: cleanFields[9],
            state: cleanFields[10] || '',
            zip: cleanFields[11] || '',
            lat: parseFloat(cleanFields[12]) || 0,
            long: parseFloat(cleanFields[13]) || 0,
            city_pop: parseInt(cleanFields[14]) || 0,
            job: cleanFields[15] || '',
            dob: cleanFields[16] || '',
            trans_num: cleanFields[17] || `TXN-${Date.now()}-${imported}`,
            unix_time: parseInt(cleanFields[18]) || Date.now(),
            merch_lat: parseFloat(cleanFields[19]) || 0,
            merch_long: parseFloat(cleanFields[20]) || 0,
            is_fraud: parseInt(cleanFields[21]) || 0
          };

          // Format using our fraud detection utility
          const formattedTransaction = formatTransaction(transaction);
          newTransactions.push(formattedTransaction);
          imported++;
        });

        // Add to processed transactions
        setProcessedTransactions(prev => [...newTransactions, ...prev].slice(0, 100));

        // Update stats
        setLiveStats(prev => {
          const fraudCount = newTransactions.filter(t => t.isFraud).length;
          const newProcessed = prev.processed + imported;
          const newFraudDetected = prev.fraudDetected + fraudCount;

          return {
            ...prev,
            processed: newProcessed,
            fraudDetected: newFraudDetected,
            reported: newFraudDetected,
            detectionRate: newProcessed > 0 ? ((newFraudDetected / newProcessed) * 100).toFixed(1) : '0'
          };
        });

        toast.showSuccess(`Successfully imported ${imported} transactions`, 3000);
      } catch (error) {
        console.error('CSV import error:', error);
        toast.showError('Failed to import CSV file. Please check the format.', 4000);
      }
    };

    reader.onerror = () => {
      toast.showError('Failed to read file', 3000);
    };

    reader.readAsText(file);
    
    // Reset input so the same file can be selected again
    event.target.value = '';
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

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Page Title with Action Buttons */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Real-Time Fraud Detection Dashboard</h1>
                <p className="text-gray-600">AI/ML SIEM for POS Fraud Alerting System - Live Monitor</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Import CSV Button */}
                <label htmlFor="csv-import">
                  <input
                    id="csv-import"
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    className="hidden"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => document.getElementById('csv-import').click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Import CSV
                  </Button>
                </label>
                
                {/* Start/Stop Monitoring Buttons */}
                {isConnecting ? (
                  <Button
                    variant="success"
                    disabled
                    className="flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Monitoring...
                  </Button>
                ) : isMonitoring ? (
                  <Button
                    variant="danger"
                    onClick={handleStopMonitoring}
                    className="flex items-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    Stop Monitoring
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleStartMonitoring}
                    className="flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Monitoring
                  </Button>
                )}
              </div>
            </div>

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
              maxRows={5}
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

