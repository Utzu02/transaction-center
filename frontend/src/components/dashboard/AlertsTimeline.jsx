import { Clock } from 'lucide-react';
import Card from '../common/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AlertsTimeline = ({ alerts = [] }) => {
  // Mock data for last 2 hours
  const defaultData = [
    { time: '2 hrs ago', count: 8 },
    { time: '1.5 hrs', count: 12 },
    { time: '1 hr', count: 15 },
    { time: '30 min', count: 23 },
    { time: '15 min', count: 18 },
    { time: 'Now', count: 14 },
  ];

  const data = alerts.length > 0 ? alerts : defaultData;
  const totalAlerts = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Fraud Alerts Timeline (Last 2 Hours)
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-danger-600">{totalAlerts}</div>
          <div className="text-xs text-gray-500">Total Alerts</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="time" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#ef4444" 
            strokeWidth={3}
            dot={{ fill: '#ef4444', r: 5 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-lg font-bold text-yellow-600">
            {Math.max(...data.map(d => d.count))}
          </div>
          <div className="text-xs text-gray-600">Peak Alerts</div>
        </div>
        <div className="text-center p-3 bg-primary-50 rounded-lg">
          <div className="text-lg font-bold text-primary-600">
            {(totalAlerts / data.length).toFixed(1)}
          </div>
          <div className="text-xs text-gray-600">Avg per Period</div>
        </div>
        <div className="text-center p-3 bg-danger-50 rounded-lg">
          <div className="text-lg font-bold text-danger-600">
            {data[data.length - 1]?.count || 0}
          </div>
          <div className="text-xs text-gray-600">Current Rate</div>
        </div>
      </div>
    </Card>
  );
};

export default AlertsTimeline;

