import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import FraudAlert from '../components/dashboard/FraudAlert';
import Card from '../components/common/Card';

const Alerts = () => {
  const alertStats = [
    { label: 'Active', value: '12', icon: AlertTriangle, color: 'danger' },
    { label: 'Resolved', value: '156', icon: CheckCircle, color: 'success' },
    { label: 'Pending', value: '8', icon: Clock, color: 'warning' },
    { label: 'Dismissed', value: '43', icon: XCircle, color: 'default' },
  ];

  const mockAlerts = [
    {
      title: 'Suspicious Transaction Detected',
      description: 'Multiple failed payment attempts from the same IP in the last 5 minutes.',
      severity: 'high',
      time: '2 minutes ago',
      transactionId: 'TXN-001238',
      amount: '€2,500.00'
    },
    {
      title: 'Unusual Pattern Identified',
      description: 'Unusually large amount compared to customer history.',
      severity: 'medium',
      time: '15 minutes ago',
      transactionId: 'TXN-001235',
      amount: '€856.00'
    },
    {
      title: 'High Risk Country Transaction',
      description: 'Transaction from a high-risk country detected.',
      severity: 'medium',
      time: '1 hour ago',
      transactionId: 'TXN-001201',
      amount: '€1,200.00'
    },
    {
      title: 'Velocity Check Failed',
      description: 'Too many transactions in a short time period.',
      severity: 'low',
      time: '2 hours ago',
      transactionId: 'TXN-001189',
      amount: '€450.00'
    },
    {
      title: 'Card Testing Detected',
      description: 'Multiple small transactions detected, possible card testing.',
      severity: 'high',
      time: '3 hours ago',
      transactionId: 'TXN-001177',
      amount: '€15.00'
    },
  ];

  const colorClasses = {
    danger: 'bg-danger-50 text-danger-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-yellow-50 text-yellow-600',
    default: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Fraud Alerts</h1>
              <p className="text-gray-600">Monitor and respond to suspicious activities</p>
            </div>

            {/* Alert Stats */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {alertStats.map((stat, index) => (
                <Card key={index}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Alert List */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Active Alerts</h2>
              <div className="space-y-4">
                {mockAlerts.map((alert, index) => (
                  <FraudAlert key={index} alert={alert} />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Alerts;

