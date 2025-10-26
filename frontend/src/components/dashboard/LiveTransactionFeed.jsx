import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';

const LiveTransactionFeed = ({ transactions = [], onFlag }) => {
  const feedRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new transactions arrive
  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [transactions, autoScroll]);

  const getStatusColor = (transaction) => {
    // Consistent fraud detection: check is_fraud, isFraud, OR status === 'blocked' or 'unknown'
    if (transaction.isFraud || transaction.is_fraud || transaction.status === 'blocked' || transaction.status === 'unknown') return 'danger';
    if ((transaction.riskScore || 0) > 60) return 'warning';
    return 'success';
  };

  const getRiskLevel = (score) => {
    if (score >= 70) return 'Critical';
    if (score >= 50) return 'High';
    if (score >= 30) return 'Medium';
    return 'Low';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    let date;
    if (typeof timestamp === 'number') {
      // Unix timestamp (in seconds or milliseconds)
      date = timestamp > 10000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
    } else if (typeof timestamp === 'string') {
      // ISO string
      date = new Date(timestamp);
    } else {
      return 'Just now';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 0) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Live Transaction Feed</h3>
          <p className="text-sm text-gray-600">Real-time monitoring • {transactions.length} transactions</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          Auto-scroll
        </label>
      </div>

      <div 
        ref={feedRef}
        className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar"
      >
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Waiting for transactions...</p>
            <p className="text-sm">Start monitoring to see live data</p>
          </div>
        ) : (
          transactions.map((transaction, index) => (
            <div
              key={`${transaction.id}-${index}`}
              className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                (transaction.isFraud || transaction.is_fraud || transaction.status === 'blocked' || transaction.status === 'unknown')
                  ? 'border-red-300 bg-red-50'
                  : (transaction.riskScore || 0) > 60
                  ? 'border-yellow-300 bg-yellow-50'
                  : 'border-green-300 bg-green-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {(transaction.isFraud || transaction.is_fraud || transaction.status === 'blocked' || transaction.status === 'unknown') ? (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    <span className="font-semibold text-gray-900">
                      ${(transaction.amount || transaction.amt || 0).toFixed(2)}
                    </span>
                    <Badge variant={getStatusColor(transaction)}>
                      {(transaction.isFraud || transaction.is_fraud || transaction.status === 'blocked' || transaction.status === 'unknown') ? 'FRAUD' : getRiskLevel(transaction.riskScore || 0)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(transaction.timestamp || transaction.unix_time || transaction.created_at)}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">{transaction.customer || `${transaction.first || ''} ${transaction.last || ''}`.trim() || 'Unknown'}</span> at{' '}
                      <span className="font-medium">{transaction.merchant || 'Unknown Merchant'}</span>
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>📍 {transaction.location || transaction.city || 'Unknown'}</span>
                      <span>🏷️ {transaction.category || 'N/A'}</span>
                      {transaction.distance && (
                        <span>📏 {transaction.distance.toFixed(0)}km from home</span>
                      )}
                    </div>
                  </div>

                  {(transaction.isFraud || transaction.is_fraud || transaction.status === 'blocked' || transaction.status === 'unknown') && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                      <strong>Pattern:</strong> {transaction.pattern || 'Suspicious Activity'}
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}} />
    </Card>
  );
};

export default LiveTransactionFeed;

