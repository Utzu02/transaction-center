import { useEffect, useState } from 'react';
import { TrendingUp, Clock } from 'lucide-react';
import Card from '../common/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const FraudPatterns = ({ transactions = [] }) => {
  const [patterns, setPatterns] = useState([]);
  const [timeframe, setTimeframe] = useState(7200); // 2 hours in seconds

  useEffect(() => {
    // Calculate patterns from real transactions
    const now = Date.now();
    const cutoffTime = now - (timeframe * 1000); // convert seconds to milliseconds
    
    // Filter fraud transactions
    const fraudTransactions = transactions.filter(t => {
      const isFraud = t.isFraud || t.is_fraud;
      if (!isFraud) return false;
      
      // Check timeframe
      let transTime;
      if (t.timestamp) {
        transTime = typeof t.timestamp === 'number' ? t.timestamp * 1000 : new Date(t.timestamp).getTime();
      } else if (t.created_at) {
        transTime = new Date(t.created_at).getTime();
      } else if (t.unix_time) {
        transTime = t.unix_time * 1000;
      } else {
        return true; // Include if no timestamp (from DB)
      }
      
      return transTime >= cutoffTime;
    });

    // Analyze patterns based on transaction characteristics
    const patternCounts = {};
    
    fraudTransactions.forEach(t => {
      const patterns = [];
      
      // High-Value Transaction (over $500)
      const amount = t.amt || t.amount || 0;
      if (amount > 500) {
        patterns.push('High-Value Transaction');
      }
      
      // Unusual Time (night hours 22:00-06:00)
      if (t.trans_time) {
        const hour = parseInt(t.trans_time.split(':')[0]);
        if (hour >= 22 || hour < 6) {
          patterns.push('Unusual Time');
        }
      }
      
      // Online/Gas Purchase (specific categories)
      const category = t.category || '';
      if (category.includes('online') || category.includes('shopping_net')) {
        patterns.push('Online Purchase Risk');
      } else if (category.includes('gas') || category.includes('travel')) {
        patterns.push('Travel/Gas Anomaly');
      } else if (category.includes('grocery') || category.includes('food')) {
        patterns.push('Retail Fraud');
      }
      
      // Geographical Anomaly (large distance from customer to merchant)
      // This would need distance calculation, skip for now or use a threshold
      
      // Micro-Transaction (very small amounts that might be testing)
      if (amount > 0 && amount < 10) {
        patterns.push('Micro-Transaction Pattern');
      }
      
      // If no specific pattern found, categorize as "Suspicious Behavior"
      if (patterns.length === 0) {
        patterns.push('Suspicious Behavior');
      }
      
      // Count each pattern
      patterns.forEach(pattern => {
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
      });
    });

    // Convert to array and sort by count
    const patternArray = Object.entries(patternCounts)
      .map(([pattern, count]) => ({
        pattern,
        count,
        color: getPatternColor(pattern)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5

    setPatterns(patternArray);
  }, [transactions, timeframe]);

  const getPatternColor = (pattern) => {
    const colors = {
      'High-Value Transaction': '#ef4444',
      'Geographical Anomaly': '#f59e0b',
      'Unusual Time': '#eab308',
      'Online Purchase Risk': '#3b82f6',
      'Micro-Transaction Pattern': '#8b5cf6',
      'Suspicious Behavior': '#ec4899',
      'Travel/Gas Anomaly': '#f97316',
      'Retail Fraud': '#06b6d4'
    };
    return colors[pattern] || '#6b7280';
  };

  const totalCount = patterns.reduce((sum, p) => sum + p.count, 0);

  const getTimeframeLabel = () => {
    switch(timeframe) {
      case 7200: return '2h';
      case 14400: return '4h';
      case 28800: return '8h';
      case 86400: return '1d';
      default: return '2h';
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Top 5 Fraud Patterns
          </h3>
          <p className="text-sm text-gray-600">
            Last {getTimeframeLabel()} • {totalCount} fraud cases
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(parseInt(e.target.value))}
            className="text-sm font-semibold bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 text-blue-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:shadow-md cursor-pointer"
          >
            <option value="7200">2h</option>
            <option value="14400">4h</option>
            <option value="28800">8h</option>
            <option value="86400">1d</option>
          </select>
        </div>
      </div>

      {patterns.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No fraud patterns detected yet</p>
          <p className="text-sm">Data will appear as fraud is detected</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={patterns} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#888" />
              <YAxis dataKey="pattern" type="category" stroke="#888" width={150} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {patterns.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {patterns.map((pattern, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: pattern.color }}
                  />
                  <span className="text-gray-700 text-xs">{pattern.pattern}</span>
                  <span className="text-gray-500 ml-auto font-semibold">{pattern.count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default FraudPatterns;
