import { useState, useEffect, useRef } from 'react';
import { CreditCard, AlertTriangle, TrendingUp, Upload, Play, Square, Radio, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/common/ToastContainer';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import AnalyticsCard from '../components/dashboard/AnalyticsCard';
import TransactionList from '../components/dashboard/TransactionList';
import LiveMonitor from '../components/dashboard/LiveMonitor';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import websocketService from '../services/websocket';
import sseService from '../services/sse';
import apiService from '../services/api';
import { formatTransaction } from '../utils/fraudDetection';
import { formatCurrency, formatPercent } from '../utils/formatters';

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
  const [dbTransactions, setDbTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Fetch transactions from database
  const fetchDatabaseTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      console.log('📊 Fetching transactions from database...');
      const response = await apiService.getTransactions({ limit: 1000, sort_order: -1 });

      if (response.success && response.transactions) {
        console.log(`✅ Loaded ${response.transactions.length} transactions from database`);

        // Keep ALL original backend fields and add frontend helpers
        const formatted = response.transactions.map(tx => ({
          ...tx,  // Keep ALL original backend fields
          id: tx.trans_num || tx.id,
          amount: tx.amt,  // Keep amt field from backend
          riskScore: tx.risk_score || 0,
          timestamp: tx.unix_time || Math.floor(new Date(tx.created_at).getTime() / 1000),
          customer: tx.first && tx.last ? `${tx.first} ${tx.last}` : '',
          location: tx.city && tx.state ? `${tx.city}, ${tx.state}` : '',
          isFraud: tx.is_fraud || tx.isFraud || tx.status === 'blocked' || tx.status === 'unknown'
        }));

        setDbTransactions(formatted);
      }
    } catch (error) {
      console.error('❌ Error fetching database transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

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

  // Fetch database transactions on mount
  useEffect(() => {
    fetchDatabaseTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Send to backend for processing (fraud detection + save)
      // Backend will analyze, detect fraud, save to DB, and create alerts if needed
      const processTransaction = async () => {
        try {
          const result = await apiService.request('/api/transactions/process', {
            method: 'POST',
            body: JSON.stringify(transaction),
          });
          console.log(`✅ Transaction processed: ${transaction.trans_num}`, result);

          // Refresh DB transactions to show the newly saved transaction
          setTimeout(() => fetchDatabaseTransactions(), 500);
        } catch (error) {
          console.error('❌ Error processing transaction:', error);
        }
      };
      processTransaction();

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
          detectionRate: newProcessed > 0 ? Number(((newFraudDetected / newProcessed) * 100).toFixed(1)) : 0,
          avgResponseTime: Number(((prev.avgResponseTime * (newProcessed - 1) + responseTime) / newProcessed).toFixed(2))
        };
      });

      // Auto-flag if fraud detected
      if (connectionType === 'sse' && formattedTransaction.isFraud) {
        // Show notification (max once per 3 seconds to avoid spam)
        const now = Date.now();
        if (now - lastNotificationRef.current > 3000) {
          toast.showWarning(
            `Fraud Detected: ${formatCurrency(formattedTransaction.amount)} - ${formattedTransaction.pattern}`,
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

    // Cleanup on unmount - but don't auto-disconnect, only unsubscribe
    return () => {
      websocketService.unsubscribe('connection', handleConnection);
      websocketService.unsubscribe('transaction', handleTransaction);
      sseService.unsubscribe('connection', handleConnection);
      sseService.unsubscribe('transaction', handleTransaction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionType]); // Only re-run when connectionType changes


  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if it's a CSV file
    if (!file.name.endsWith('.csv')) {
      toast.showError('Please select a CSV file', 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');

        // Skip header line
        const dataLines = lines.slice(1).filter(line => line.trim());

        let imported = 0;
        let savedCount = 0;
        const newTransactions = [];

        // Use for...of to properly await async operations
        for (const line of dataLines) {
          // Parse CSV line with pipe delimiter (|)
          const fields = line.split('|');
          if (!fields || fields.length < 10) continue;

          // Clean fields (trim whitespace and remove quotes if any)
          const cleanFields = fields.map(f => f.trim().replace(/^"(.*)"$/, '$1'));

          // Split trans_date_trans_time if it exists
          const transDateTime = cleanFields[0] || '';
          const [trans_date, trans_time] = transDateTime.includes(' ')
            ? transDateTime.split(' ')
            : [cleanFields[0], ''];

          // Map CSV columns to transaction object
          const transaction = {
            trans_date: trans_date,
            trans_time: trans_time,
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
            unix_time: parseInt(cleanFields[18]) || Math.floor(Date.now() / 1000),
            merch_lat: parseFloat(cleanFields[19]) || 0,
            merch_long: parseFloat(cleanFields[20]) || 0,
            is_fraud: parseInt(cleanFields[21]) || 0,
            isFraud: parseInt(cleanFields[21]) || 0
          };

          // Save to database
          try {
            await apiService.createTransaction(transaction);
            console.log(`✅ Saved CSV transaction ${transaction.trans_num} to database`);
            savedCount++;
          } catch (error) {
            console.error(`❌ Failed to save CSV transaction: ${error.message}`);
          }

          // Format using our fraud detection utility
          const formattedTransaction = formatTransaction(transaction);
          newTransactions.push(formattedTransaction);
          imported++;
        }

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
              detectionRate: newProcessed > 0 ? Number(((newFraudDetected / newProcessed) * 100).toFixed(1)) : 0
            };
        });

        toast.showSuccess(`Successfully imported ${imported} transactions (${savedCount} saved to database)`, 4000);

        // Refresh database transactions to show newly imported data
        fetchDatabaseTransactions();
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
                <p className="text-gray-600">SIEM for POS Fraud Alerting System - Live Monitor</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Refresh Transactions Button */}
                <Button
                  variant="secondary"
                  onClick={fetchDatabaseTransactions}
                  disabled={isLoadingTransactions}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingTransactions ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>

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
              </div>
            </div>

            {/* External Stream Connection Card */}
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${isMonitoring ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Radio className={`w-6 h-6 ${isMonitoring ? 'text-green-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">External Hackathon Stream</h3>
                    <p className="text-sm text-gray-600">
                      {isMonitoring
                        ? `Connected to ${streamConfig.url}`
                        : 'Connect to receive live transactions from the hackathon server'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isConnecting ? (
                    <Button
                      variant="success"
                      disabled
                      className="flex items-center gap-2"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Connecting...
                    </Button>
                  ) : isMonitoring ? (
                    <Button
                      variant="danger"
                      onClick={handleStopMonitoring}
                      className="flex items-center gap-2"
                    >
                      <Square className="w-4 h-4" />
                      Disconnect Stream
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={handleStartMonitoring}
                      className="flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Connect to Stream
                    </Button>
                  )}
                </div>
              </div>
              {!streamConfig.url && !isMonitoring && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ No stream URL configured. Go to <button onClick={() => navigate('/settings')} className="underline font-semibold">Settings</button> to configure the external stream.
                  </p>
                </div>
              )}
            </Card>

            {/* Live Monitor Stats */}
            {isMonitoring && <LiveMonitor connectionStatus={connectionStatus} stats={liveStats} />}

            {/* Analytics Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnalyticsCard
                title="Total Transactions"
                value={dbTransactions.length.toLocaleString()}
                icon={CreditCard}
                color="primary"
                tooltip="Total transactions stored in the database."
                onViewAll={() => navigate('/transactions')}
                viewAllText="View All"
              />
              <AnalyticsCard
                title="Fraud Detected"
                value={dbTransactions
                  .filter(t => String(t.status ?? '').toLowerCase() === 'blocked')
                  .length
                  .toLocaleString()}
                icon={AlertTriangle}
                color="danger"
                tooltip="Fraudulent transactions flagged by AI/ML system based on risk patterns."
              />
              <AnalyticsCard
                title="Detection Rate"
                value={(() => {
                  const totalTx = dbTransactions.length;
                  const totalFraud = dbTransactions.filter(t => t.isFraud).length;
                  return totalTx > 0 ? formatPercent(totalFraud / totalTx, 1) : '0%';
                })()}
                icon={TrendingUp}
                color="success"
                tooltip="Percentage of transactions identified as fraud. Target: high accuracy, low false positives."
              />
            </div>

            {/* Transaction List - Most Recent First */}
            <TransactionList
                transactions={[
                // Merge database transactions with live stream transactions
                ...dbTransactions.map(t => ({
                  id: t.id,
                  customer: t.customer,
                  merchant: t.merchant,
                  amount: formatCurrency(t.amount),
                  category: t.category,
                  location: t.location,
                  riskScore: t.riskScore,
                  status: t.status,
                  date: t.created_at || (t.timestamp ? new Date(t.timestamp * 1000).toISOString() : new Date().toISOString()),
                  timestamp: t.timestamp || Math.floor(new Date(t.created_at).getTime() / 1000)
                })),
                ...processedTransactions.map(t => ({
                  id: t.id,
                  customer: t.customer,
                  merchant: t.merchant,
                  amount: formatCurrency(t.amount),
                  category: t.category,
                  location: t.location,
                  riskScore: t.riskScore,
                  status: t.isFraud ? 'blocked' : 'accepted',
                  date: t.timestamp ? new Date(t.timestamp * 1000).toISOString() : new Date().toISOString(),
                  timestamp: t.timestamp || Math.floor(Date.now() / 1000)
                }))
              ]
                // Sort by timestamp (most recent first) and take first 5
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 5)}
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
