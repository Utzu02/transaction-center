import { Users } from 'lucide-react';
import Card from '../common/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const AgeSegmentAnalysis = ({ data = [] }) => {
  // Mock data based on profile categories from CSV
  const defaultData = [
    { segment: 'Young Adults (18-25)', fraudCount: 45, color: '#ef4444' },
    { segment: 'Adults (25-50)', fraudCount: 89, color: '#f59e0b' },
    { segment: 'Adults 50+', fraudCount: 67, color: '#10b981' },
  ];

  const chartData = data.length > 0 ? data : defaultData;
  const total = chartData.reduce((sum, item) => sum + item.fraudCount, 0);

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Fraud Exposure by Age Segment
        </h3>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
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
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <div className="bg-danger-50 rounded-lg p-4 border-l-4 border-danger-500">
            <div className="text-xs text-gray-600 mb-1">Most Vulnerable</div>
            <div className="text-lg font-bold text-gray-900">
              {chartData.reduce((max, item) => item.fraudCount > max.fraudCount ? item : max).segment}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {chartData.reduce((max, item) => item.fraudCount > max.fraudCount ? item : max).fraudCount} fraud cases
            </div>
          </div>

          <div className="space-y-2">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                    {((item.fraudCount / total) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AgeSegmentAnalysis;

