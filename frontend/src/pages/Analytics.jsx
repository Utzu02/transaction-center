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
import { formatTransaction } from '../utils/fraudDetection';
import { BarChart, Bar, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Analytics = () => {
  const [processedTransactions, setProcessedTransactions] = useState([]);
  const [liveStats, setLiveStats] = useState({
    processed: 0,
    fraudDetected: 0,
    reported: 0,
    avgResponseTime: 0,
    detectionRate: 0
  });

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
          detectionRate: newProcessed > 0 ? ((newFraudDetected / newProcessed) * 100).toFixed(1) : '0'
        };
      });
    };

    websocketService.subscribe('transaction', handleTransaction);
    sseService.subscribe('transaction', handleTransaction);

    return () => {
      // Cleanup handled by Dashboard
    };
  }, []);

  const monthlyData = [
    { month: 'Jan', transactions: 4000, fraud: 240, revenue: 45000 },
    { month: 'Feb', transactions: 3000, fraud: 139, revenue: 38000 },
    { month: 'Mar', transactions: 2000, fraud: 98, revenue: 28000 },
    { month: 'Apr', transactions: 2780, fraud: 390, revenue: 35000 },
    { month: 'May', transactions: 1890, fraud: 480, revenue: 25000 },
    { month: 'Jun', transactions: 2390, fraud: 380, revenue: 32000 },
  ];

  const riskDistribution = [
    { risk: 'Low', count: 8500 },
    { risk: 'Medium', count: 2800 },
    { risk: 'High', count: 1200 },
  ];

  const metrics = [
    {
      title: 'Average Transaction Value',
      value: '€342.50',
      icon: DollarSign,
      color: 'primary'
    },
    {
      title: 'Active Users',
      value: '24,567',
      icon: Users,
      color: 'success'
    },
    {
      title: 'Transaction Volume',
      value: '156K',
      icon: CreditCard,
      color: 'warning'
    },
    {
      title: 'System Uptime',
      value: '99.9%',
      icon: Activity,
      color: 'success'
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
              <FraudPatterns transactions={processedTransactions} />
              <AlertsTimeline transactions={processedTransactions} />
            </div>

            {/* Age Segment Analysis & Live Transaction Feed */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
              <AgeSegmentAnalysis transactions={processedTransactions} />
              <LiveTransactionFeed transactions={processedTransactions.slice(-20)} />
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
                      <p className="text-xs text-gray-600">Monthly overview</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
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
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Risk Distribution */}
                <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-purple-200 p-6 hover:shadow-2xl hover:border-purple-300 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Risk Distribution
                      </h3>
                      <p className="text-xs text-gray-600">Security levels</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={riskDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" />
                      <XAxis 
                        type="number" 
                        stroke="#9333ea" 
                        style={{ fontSize: '12px', fontWeight: '600' }}
                      />
                      <YAxis 
                        dataKey="risk" 
                        type="category" 
                        stroke="#9333ea"
                        style={{ fontSize: '12px', fontWeight: '600' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '2px solid #9333ea',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                        {riskDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.risk === 'High' ? '#ef4444' : entry.risk === 'Medium' ? '#f59e0b' : '#22c55e'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
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
