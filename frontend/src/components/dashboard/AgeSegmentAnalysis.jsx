import { useEffect, useState } from 'react';
import { Users, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const AgeSegmentAnalysis = ({ transactions = [] }) => {
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({ total: 0, mostVulnerable: null });

  useEffect(() => {
    // Calculate age segments from fraud transactions
    const fraudTransactions = transactions.filter(t => t.isFraud);
    
    const segmentCounts = {
      '18-24': { count: 0, color: '#ef4444' },
      '25-34': { count: 0, color: '#f59e0b' },
      '35-44': { count: 0, color: '#eab308' },
      '45-54': { count: 0, color: '#3b82f6' },
      '55-64': { count: 0, color: '#8b5cf6' },
      '65+': { count: 0, color: '#10b981' }
    };

    fraudTransactions.forEach(t => {
      const segment = t.ageSegment;
      if (segment && segmentCounts[segment]) {
        segmentCounts[segment].count++;
      }
    });

    // Convert to array
    const data = Object.entries(segmentCounts)
      .map(([segment, { count, color }]) => ({
        segment,
        fraudCount: count,
        color
      }))
      .filter(item => item.fraudCount > 0); // Only show segments with data

    setChartData(data);

    // Calculate stats
    const total = fraudTransactions.length;
    const mostVulnerable = data.reduce((max, item) => 
      item.fraudCount > (max?.fraudCount || 0) ? item : max, null
    );

    setStats({ total, mostVulnerable });
  }, [transactions]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.payload.segment} years</p>
          <p className="text-sm text-gray-600">{data.value} fraud cases</p>
          {stats.total > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {((data.value / stats.total) * 100).toFixed(1)}% of total fraud
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            Fraud Exposure by Age Segment
          </h3>
          <p className="text-sm text-gray-600">{stats.total} fraud cases analyzed</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No age data available yet</p>
          <p className="text-sm">Data will appear as fraud is detected</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="fraudCount"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Stats and Breakdown */}
          <div className="space-y-4">
            {stats.mostVulnerable && (
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-300">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-red-600 mb-1">Most Vulnerable Segment</div>
                    <div className="text-lg font-bold text-gray-900">
                      {stats.mostVulnerable.segment} years old
                    </div>
                    <div className="text-sm text-gray-700 mt-1">
                      <span className="font-semibold">{stats.mostVulnerable.fraudCount}</span> fraud cases
                      {stats.total > 0 && (
                        <span className="text-gray-600">
                          {' '}• {((stats.mostVulnerable.fraudCount / stats.total) * 100).toFixed(1)}% of total
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {chartData
                .sort((a, b) => b.fraudCount - a.fraudCount)
                .map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm font-medium text-gray-900">{item.segment}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">{item.fraudCount}</div>
                      <div className="text-xs text-gray-500">
                        {((item.fraudCount / stats.total) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Bar Chart for comparison */}
      {chartData.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Fraud Distribution by Age</h4>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="segment" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="fraudCount" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default AgeSegmentAnalysis;
