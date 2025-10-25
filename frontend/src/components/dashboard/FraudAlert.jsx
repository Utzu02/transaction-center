import { AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { useState } from 'react';

const FraudAlert = ({ alert }) => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();
  
  if (!isVisible) return null;
  
  const severityColors = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  };

  return (
    <Card className="border-l-4 border-red-500 relative hover:shadow-xl transition-all">
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="bg-gradient-to-br from-red-100 to-rose-100 p-3 rounded-xl shadow-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                {alert.title}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                {alert.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <Badge variant={severityColors[alert.severity]}>
              Severity: {alert.severity.toUpperCase()}
            </Badge>
            <span className="text-sm text-gray-500">
              {alert.time}
            </span>
          </div>
          
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-3 mb-4 border border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Transaction ID:</span>
                <span className="ml-2 font-mono font-semibold text-gray-900">{alert.transactionId}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-semibold text-gray-900">{alert.amount}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="primary"
              onClick={() => navigate(`/transaction/${alert.transactionId}`)}
            >
              Investigate
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FraudAlert;

