import { useEffect, useState } from 'react';
import { Users, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import AgePieChart from '../charts/AgePieChart';

const AgeSegmentAnalysis = ({ transactions = [] }) => {
  // Mock data for initial display
  const mockData = [
    { segment: '18-24', fraudCount: 45, label: '18-24 years', value: 45, color: '#ef4444' },
    { segment: '25-34', fraudCount: 78, label: '25-34 years', value: 78, color: '#f59e0b' },
    { segment: '35-44', fraudCount: 62, label: '35-44 years', value: 62, color: '#eab308' },
    { segment: '45-54', fraudCount: 34, label: '45-54 years', value: 34, color: '#3b82f6' },
    { segment: '55-64', fraudCount: 28, label: '55-64 years', value: 28, color: '#8b5cf6' },
    { segment: '65+', fraudCount: 19, label: '65+ years', value: 19, color: '#10b981' }
  ];

  const [chartData, setChartData] = useState(mockData);
  const [stats, setStats] = useState({ 
    total: mockData.reduce((sum, item) => sum + item.value, 0), 
    mostVulnerable: mockData.reduce((max, item) => item.value > (max?.value || 0) ? item : max, mockData[0])
  });

  useEffect(() => {
    // Calculate age segments from fraud transactions
    const fraudTransactions = transactions.filter(t => t.isFraud);
    
    // If no fraud transactions, use mock data
    if (fraudTransactions.length === 0) {
      setChartData(mockData);
      setStats({ 
        total: mockData.reduce((sum, item) => sum + item.value, 0), 
        mostVulnerable: mockData.reduce((max, item) => item.value > (max?.value || 0) ? item : max, mockData[0])
      });
      return;
    }

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

    // Convert to array for pie chart format
    const data = Object.entries(segmentCounts)
      .map(([segment, { count, color }]) => ({
        segment,
        fraudCount: count,
        label: `${segment} years`,
        value: count,
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

      {chartData.length > 0 && (
        <div className="space-y-6">
          {/* Most Vulnerable Segment */}
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

          {/* Pie Chart */}
          <div className="flex justify-center">
            <AgePieChart data={chartData} height={400} />
          </div>
        </div>
      )}
    </Card>
  );
};

export default AgeSegmentAnalysis;
