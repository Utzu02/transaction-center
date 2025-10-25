import { useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';

const LiveMonitor = ({ connectionStatus, stats }) => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => !prev);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Live Monitor
        </h3>
        {connectionStatus === 'connected' ? (
          <Badge variant="success" className="flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            Connected
            <span className="relative w-2 h-2">
              <span className={`absolute inset-0 bg-success-600 rounded-full ${pulse ? 'opacity-75' : 'opacity-100'} transition-opacity duration-500`}></span>
            </span>
          </Badge>
        ) : (
          <Badge variant="danger" className="flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            Disconnected
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-primary-50 rounded-lg">
          <p className="text-2xl font-bold text-primary-600 mb-1">
            {stats.processed}
          </p>
          <p className="text-xs text-gray-600">Processed</p>
        </div>
        <div className="text-center p-4 bg-danger-50 rounded-lg">
          <p className="text-2xl font-bold text-danger-600 mb-1">
            {stats.fraudDetected}
          </p>
          <p className="text-xs text-gray-600">Fraud Detected</p>
        </div>
        <div className="text-center p-4 bg-success-50 rounded-lg">
          <p className="text-2xl font-bold text-success-600 mb-1">
            {stats.reported}
          </p>
          <p className="text-xs text-gray-600">Reported</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Avg Response Time</span>
          <span className="font-semibold text-gray-900">{stats.avgResponseTime || 0}s</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-gray-600">Detection Rate</span>
          <span className="font-semibold text-gray-900">{stats.detectionRate || 0}%</span>
        </div>
      </div>
    </Card>
  );
};

export default LiveMonitor;

