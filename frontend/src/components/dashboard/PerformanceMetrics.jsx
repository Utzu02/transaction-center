import { useEffect, useState } from 'react';
import { Clock, Zap, Target, TrendingUp } from 'lucide-react';
import Card from '../common/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PerformanceMetrics = ({ transactions = [], liveStats }) => {
  const [performanceData, setPerformanceData] = useState([]);
  const [metrics, setMetrics] = useState({
    avgResponseTime: 0,
    accuracy: 0,
    throughput: 0,
    within30s: 0
  });

  useEffect(() => {
    // Calculate performance metrics for last 30 transactions
    const recentTransactions = transactions.slice(-30);
    
    if (recentTransactions.length > 0) {
      // Calculate average response time (simulated)
      const avgResponse = parseFloat(liveStats.avgResponseTime || 0);
      
      // Calculate accuracy (detection rate)
      const accuracy = parseFloat(liveStats.detectionRate || 0);
      
      // Calculate throughput (transactions per minute)
      const throughput = recentTransactions.length > 0 
        ? (recentTransactions.length / 5).toFixed(1) // Assume 5 minutes
        : 0;
      
      // Calculate percentage within 30 seconds
      const within30s = avgResponse < 30 ? 100 : Math.max(0, 100 - ((avgResponse - 30) * 2));
      
      setMetrics({
        avgResponseTime: avgResponse,
        accuracy,
        throughput,
        within30s: within30s.toFixed(1)
      });

      // Create timeline data (every 5 transactions)
      const timeline = [];
      for (let i = 0; i < recentTransactions.length; i += 5) {
        const batch = recentTransactions.slice(i, i + 5);
        timeline.push({
          batch: `${i + 1}-${Math.min(i + 5, recentTransactions.length)}`,
          responseTime: (Math.random() * 10 + 5).toFixed(2), // Simulated
          accuracy: (Math.random() * 10 + 90).toFixed(1)
        });
      }
      setPerformanceData(timeline);
    }
  }, [transactions, liveStats]);

  const getPerformanceColor = (responseTime) => {
    if (responseTime < 5) return 'text-green-600';
    if (responseTime < 15) return 'text-blue-600';
    if (responseTime < 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceLabel = (responseTime) => {
    if (responseTime < 5) return 'Excellent';
    if (responseTime < 15) return 'Good';
    if (responseTime < 25) return 'Acceptable';
    return 'Needs Improvement';
  };

  return (
    <Card>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Live Checker Performance Metrics
        </h3>
        <p className="text-sm text-gray-600">
          Real-time system performance and response time tracking
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold">Avg Response</span>
          </div>
          <div className={`text-2xl font-bold ${getPerformanceColor(metrics.avgResponseTime)}`}>
            {metrics.avgResponseTime}s
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {getPerformanceLabel(metrics.avgResponseTime)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs font-semibold">Within 30s</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {metrics.within30s}%
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Live Checker Score
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-semibold">Accuracy</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {metrics.accuracy}%
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Detection Rate
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-semibold">Throughput</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {metrics.throughput}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Trans/min
          </div>
        </div>
      </div>

      {/* Performance Timeline */}
      {performanceData.length > 0 && (
        <>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Response Time Timeline</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="batch" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} label={{ value: 'Seconds', angle: -90, position: 'insideLeft', fontSize: 12 }} />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="responseTime" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorResponse)"
                name="Response Time (s)"
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Performance Indicators */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">&lt; 5s Excellent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600">&lt; 15s Good</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-600">&lt; 25s Acceptable</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-600">&gt; 25s Poor</span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Target: &lt; 30s for Live Checker
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default PerformanceMetrics;

