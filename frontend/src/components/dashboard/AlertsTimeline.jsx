import { useEffect, useState } from 'react';
import { Clock, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../common/Card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AlertsTimeline = ({ transactions = [] }) => {
  const [timelineData, setTimelineData] = useState([]);
  const [stats, setStats] = useState({ total: 0, peak: 0, avg: 0, current: 0 });

  useEffect(() => {
    // Process last 2 hours of fraud alerts
    const now = Date.now() / 1000;
    const twoHoursAgo = now - (2 * 3600);
    
    // Filter fraud transactions from last 2 hours
    const fraudTransactions = transactions.filter(t => 
      t.isFraud && t.timestamp && t.timestamp >= twoHoursAgo
    );

    // Group by 15-minute intervals
    const intervals = [];
    const intervalDuration = 15 * 60; // 15 minutes in seconds
    
    for (let i = 0; i < 8; i++) { // 8 intervals = 2 hours
      const intervalStart = now - ((8 - i) * intervalDuration);
      const intervalEnd = intervalStart + intervalDuration;
      
      const count = fraudTransactions.filter(t => 
        t.timestamp >= intervalStart && t.timestamp < intervalEnd
      ).length;

      const label = i === 7 ? 'Now' : 
                    i === 6 ? '15m' :
                    i === 5 ? '30m' :
                    i === 4 ? '45m' :
                    i === 3 ? '1h' :
                    i === 2 ? '1h 15m' :
                    i === 1 ? '1h 30m' :
                    '2h';

      intervals.push({
        time: label,
        count: count,
        timestamp: intervalStart
      });
    }

    setTimelineData(intervals);

    // Calculate stats
    const total = fraudTransactions.length;
    const peak = Math.max(...intervals.map(i => i.count), 0);
    const avg = intervals.length > 0 ? (total / intervals.length).toFixed(1) : 0;
    const current = intervals[intervals.length - 1]?.count || 0;

    setStats({ total, peak, avg: parseFloat(avg), current });
  }, [transactions]);

  const getTrend = () => {
    if (timelineData.length < 2) return null;
    const last = timelineData[timelineData.length - 1]?.count || 0;
    const previous = timelineData[timelineData.length - 2]?.count || 0;
    return last - previous;
  };

  const trend = getTrend();

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" />
            Fraud Alerts Timeline
          </h3>
          <p className="text-sm text-gray-600">Last 2 hours • {timelineData.length} intervals</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-danger-600">{stats.total}</div>
          <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
            Total Alerts
            {trend !== null && (
              <span className={`flex items-center ${trend > 0 ? 'text-red-600' : trend < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                {trend !== 0 && `${Math.abs(trend)}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {timelineData.length === 0 || stats.total === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No fraud alerts yet</p>
          <p className="text-sm">Alerts will appear as fraud is detected</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#ef4444" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAlerts)"
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6, fill: '#dc2626' }}
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.peak}
              </div>
              <div className="text-xs text-gray-600 mt-1">Peak Alerts</div>
            </div>
            <div className="text-center p-3 bg-primary-50 rounded-lg border border-primary-200">
              <div className="text-2xl font-bold text-primary-600">
                {stats.avg}
              </div>
              <div className="text-xs text-gray-600 mt-1">Avg per 15min</div>
            </div>
            <div className="text-center p-3 bg-danger-50 rounded-lg border border-danger-200">
              <div className="text-2xl font-bold text-danger-600">
                {stats.current}
              </div>
              <div className="text-xs text-gray-600 mt-1">Current (15min)</div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default AlertsTimeline;
