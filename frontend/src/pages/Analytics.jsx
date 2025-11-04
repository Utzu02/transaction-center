import { useState, useEffect } from 'react';
import { Activity, DollarSign, Users, CreditCard, TrendingUp, Shield } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import Card from '../components/common/Card';
import LiveTransactionFeed from '../components/dashboard/LiveTransactionFeed';
import FraudPatterns from '../components/dashboard/FraudPatterns';
import AgeSegmentAnalysis from '../components/dashboard/AgeSegmentAnalysis';
import AlertsTimeline from '../components/dashboard/AlertsTimeline';
import sseService from '../services/sse';
import websocketService from '../services/websocket';
import apiService from '../services/api';
import { formatTransaction } from '../utils/fraudDetection';
import { formatCurrency, formatPercent, toNumber } from '../utils/formatters';
import { BarChart, Bar, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Legend } from 'recharts';

const Analytics = () => {
  const [processedTransactions, setProcessedTransactions] = useState([]);
  const [dbTransactions, setDbTransactions] = useState([]);
  const [riskDistribution, setRiskDistribution] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liveStats, setLiveStats] = useState({
    processed: 0,
    fraudDetected: 0,
    reported: 0,
    avgResponseTime: 0,
    detectionRate: 0
  });


  const RISK_BUCKETS = [
    { name: 'Legitimate', key: 'low', color: '#22c55e' },
    { name: 'Medium Risk', key: 'medium', color: '#f59e0b' },
    { name: 'High Risk', key: 'high', color: '#ef4444' },
    { name: 'Unscored', key: 'unscored', color: '#9ca3af' },
  ];

  const isFraudish = (t) => {
    const s = String(t.status ?? '').toLowerCase();
    return Boolean(t.is_fraud || t.isFraud || t.fraud || ['blocked', 'unknown', 'fraud', 'declined'].includes(s));
  };

  const pickRiskScore01 = (t) => {
    const raw =
      t.fraud_probability ??
      t.confidence ??
      t.risk_score ??
      t.score ??
      t.anomaly_score;

    if (raw == null) return undefined;
    const n = Number(raw);
    if (!Number.isFinite(n)) return undefined;
    if (n > 1) return Math.max(0, Math.min(1, n / 100)); // scale 0..100 -> 0..1
    return Math.max(0, Math.min(1, n)); // clamp 0..1
  };

  const bucketFor = (t) => {
    const score = pickRiskScore01(t);
    if (score == null) return isFraudish(t) ? 'high' : 'unscored';
    if (score >= 0.7 || isFraudish(t)) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  };

  const computeRiskDistribution = (txs) => {
    const counts = { low: 0, medium: 0, high: 0, unscored: 0 };
    for (const t of txs) counts[bucketFor(t)] += 1;

    return RISK_BUCKETS
      .map(b => ({ name: b.name, value: counts[b.key], count: counts[b.key], color: b.color }))
      .filter(d => d.count > 0);
  };

  // Fetch transactions from database
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.getTransactions({ limit: 1000 });
        if (response.success && response.transactions) {
          setDbTransactions(response.transactions);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
  const all = [...dbTransactions, ...processedTransactions];
  setRiskDistribution(computeRiskDistribution(all));
}, [dbTransactions, processedTransactions]);

  // Subscribe to real-time transactions
  useEffect(() => {
    const handleTransaction = (transaction) => {
      const formattedTransaction = formatTransaction(transaction);
      setProcessedTransactions(prev => [...prev, formattedTransaction].slice(-100));

      setLiveStats(prev => {
        const newProcessed = prev.processed + 1;
        const newFraudDetected = formattedTransaction.isFraud
          ? prev.fraudDetected + 1
          : prev.fraudDetected;

        return {
          ...prev,
          processed: newProcessed,
          fraudDetected: newFraudDetected,
          reported: newFraudDetected,
          detectionRate: newProcessed > 0 ? Number(((newFraudDetected / newProcessed) * 100).toFixed(1)) : 0
        };
      });
    };

    websocketService.subscribe('transaction', handleTransaction);
    sseService.subscribe('transaction', handleTransaction);

    return () => {
      // Cleanup handled by Dashboard
    };
  }, []);

  // Calculate monthly data from real transactions
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    if (dbTransactions.length === 0) return;

    // Group transactions by month
    const monthGroups = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    dbTransactions.forEach(t => {
      let date;
      if (t.created_at) {
        date = new Date(t.created_at);
      } else if (t.trans_date) {
        date = new Date(t.trans_date);
      } else if (t.unix_time) {
        date = new Date(t.unix_time * 1000);
      } else {
        return;
      }

      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthLabel = monthNames[date.getMonth()];

      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = {
          month: monthLabel,
          year: date.getFullYear(),
          transactions: 0,
          fraud: 0,
          revenue: 0,
          sortKey: date.getTime()
        };
      }

      monthGroups[monthKey].transactions++;
      if (t.is_fraud || t.isFraud) {
        monthGroups[monthKey].fraud++;
      }
      monthGroups[monthKey].revenue += parseFloat(t.amt || t.amount || 0);
    });

    // Convert to array and sort by date
    const monthlyArray = Object.values(monthGroups)
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(-6) // Last 6 months
      .map(m => ({
        month: m.month,
        transactions: m.transactions,
        fraud: m.fraud,
        revenue: Math.round(m.revenue)
      }));

    setMonthlyData(monthlyArray);
  }, [dbTransactions]);

  // Calculate real metrics from transactions
  const metrics = [
      {
      title: 'Average Transaction Value',
      value: dbTransactions.length > 0
        ? formatCurrency(dbTransactions.reduce((sum, t) => sum + (parseFloat(t.amt || t.amount || 0)), 0) / dbTransactions.length)
        : '$0.00',
      icon: DollarSign,
      color: 'primary'
    },
    {
      title: 'Total Transactions',
      value: (dbTransactions.length + liveStats.processed).toLocaleString(),
      icon: CreditCard,
      color: 'success'
    },
    {
      title: 'Fraud Detected',
      value: (dbTransactions.filter(t => t.is_fraud || t.isFraud || t.status === 'blocked' || t.status === 'unknown').length + liveStats.fraudDetected).toLocaleString(),
      icon: Shield,
      color: 'warning'
    },
    {
      title: 'Fraud Rate',
      value: dbTransactions.length > 0
        ? formatPercent(dbTransactions.filter(t => t.is_fraud || t.isFraud || t.status === 'blocked' || t.status === 'unknown').length / dbTransactions.length, 1)
        : '0%',
      icon: Activity,
      color: 'danger'
    },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">Analytics & Business Intelligence</h1>
              <p className="text-gray-600">Real-time fraud analysis and comprehensive insights</p>
            </div>


            {/* Top 5 Fraud Patterns & Alerts Timeline */}
            <div className="grid lg:grid-cols-2 gap-6">
              <FraudPatterns transactions={[...dbTransactions, ...processedTransactions]} />
              <AlertsTimeline transactions={[...dbTransactions, ...processedTransactions]} />
            </div>

            {/* Age Segment Analysis & Live Transaction Feed */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
              <AgeSegmentAnalysis transactions={[...dbTransactions, ...processedTransactions]} />
              <LiveTransactionFeed transactions={[...dbTransactions, ...processedTransactions].slice(-20)} />
            </div>

            {/* Historical Analytics */}
            <Card>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Historical Analytics</h2>
                <p className="text-gray-600">Long-term trends and statistical analysis</p>
              </div>

              {/* Metrics Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {metrics.map((metric, index) => (
                  <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl hover:border-blue-200 transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{metric.title}</p>
                        <h3 className="text-3xl font-bold text-gray-900">{metric.value}</h3>
                      </div>
                      <div className={`p-3 rounded-lg bg-${metric.color}-50 text-${metric.color}-600`}>
                        <metric.icon className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Transaction Trends */}
                <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-blue-200 p-6 hover:shadow-2xl hover:border-blue-300 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        Transaction Trends
                      </h3>
                      <p className="text-xs text-gray-600">
                        {isLoading ? 'Loading...' : monthlyData.length > 0 ? `Last ${monthlyData.length} month${monthlyData.length > 1 ? 's' : ''}` : 'No data yet'}
                      </p>
                    </div>
                  </div>
                  {isLoading || monthlyData.length === 0 ? (
                    <div className="flex items-center justify-center h-[320px]">
                      <div className="text-center text-gray-500">
                        <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No data available yet</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={monthlyData}>
                        <defs>
                          <linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                        <XAxis
                          dataKey="month"
                          stroke="#6366f1"
                          style={{ fontSize: '12px', fontWeight: '600' }}
                        />
                        <YAxis
                          stroke="#6366f1"
                          style={{ fontSize: '12px', fontWeight: '600' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '2px solid #0ea5e9',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="transactions"
                          stroke="#0ea5e9"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorTrans)"
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Risk Distribution - Pie Chart */}
                <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-purple-200 p-6 hover:shadow-2xl hover:border-purple-300 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Risk Distribution
                      </h3>
                      <p className="text-xs text-gray-600">
                        {isLoading ? 'Loading...' : dbTransactions.length === 0 ? 'No data yet' : `Based on ${dbTransactions.length} transaction${dbTransactions.length > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                  {isLoading ? (
                    <div className="flex items-center justify-center h-[320px]">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={riskDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, count, percent }) => {
                            // Only show label if percentage is > 5%
                            if (percent < 0.05) return '';
                            return `${name}\n${count} (${formatPercent(percent, 1)})`;
                          }}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          isAnimationActive={false}
                        >
                          {riskDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '2px solid #9333ea',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value, name, props) => {
                            const total = riskDistribution.reduce((sum, item) => sum + item.value, 0) || 1;
                            return [
                              `${value} transactions (${formatPercent(value / total, 1)})`,
                              props.payload.name
                            ];
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value, entry) => {
                            const item = entry.payload;
                            return `${item.name}: ${item.count}`;
                          }}
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Analytics;
