import { TrendingUp } from 'lucide-react';
import Card from '../common/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const FraudPatterns = ({ patterns = [] }) => {
  // Mock data if empty
  const defaultPatterns = [
    { pattern: 'High Amount (>$1000)', count: 45, percentage: 35 },
    { pattern: 'Multiple Attempts', count: 38, percentage: 29 },
    { pattern: 'Unusual Location', count: 28, percentage: 22 },
    { pattern: 'Velocity Check Failed', count: 12, percentage: 9 },
    { pattern: 'Card Testing', count: 7, percentage: 5 },
  ];

  const data = patterns.length > 0 ? patterns : defaultPatterns;

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Top 5 Fraud Patterns (Last Hour)
        </h3>
        <span className="text-sm text-gray-500">
          Updated: {new Date().toLocaleTimeString()}
        </span>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-danger-100 text-danger-600 flex items-center justify-center font-bold text-sm">
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">{item.pattern}</span>
                <span className="text-sm font-bold text-gray-900">{item.count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-danger-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="pattern" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default FraudPatterns;

