import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';
import { AlertTriangle, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import FraudAlert from '../components/dashboard/FraudAlert';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/ToastContainer';
import apiService from '../services/api';

const Alerts = () => {
  const toast = useToast();
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, notificationId: null });
  const [stats, setStats] = useState({
    active: 0,
    resolved: 0,
    pending: 0,
    dismissed: 0
  });

  // Fetch notifications from database
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      console.log('📢 Fetching notifications from database...');
      const response = await apiService.getNotifications({ limit: 100 });
      
      if (response.success && response.notifications) {
        console.log(`✅ Loaded ${response.notifications.length} notifications`);
        
        // Transform backend notifications to alerts format
        const formattedAlerts = response.notifications.map(notif => ({
          id: notif._id,
          title: notif.title || 'Notification',
          description: notif.message || notif.text,
          severity: notif.type || 'medium',
          time: formatTime(notif.timestamp || notif.created_at),
          transactionId: notif.transaction_id || 'N/A',
          amount: notif.amount ? formatCurrency(notif.amount) : 'N/A',
          read: notif.read || false
        }));
        
        setAlerts(formattedAlerts);
        
        // Calculate stats
        const activeCount = formattedAlerts.filter(a => !a.read && a.severity === 'high').length;
        const resolvedCount = formattedAlerts.filter(a => a.read).length;
        const pendingCount = formattedAlerts.filter(a => !a.read && a.severity === 'medium').length;
        const dismissedCount = formattedAlerts.filter(a => a.read && a.severity === 'low').length;
        
        setStats({
          active: activeCount,
          resolved: resolvedCount,
          pending: pendingCount,
          dismissed: dismissedCount
        });
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      toast.showError(`Failed to load notifications: ${error.message}`, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle delete notification
  const handleDeleteNotification = async () => {
    const notificationId = deleteConfirm.notificationId;
    
    if (!notificationId) {
      toast.showError('Invalid notification ID', 3000);
      return;
    }

    try {
      console.log(`🗑️ Deleting notification: ${notificationId}`);
      const response = await apiService.deleteNotification(notificationId);
      
      if (response.success) {
        toast.showSuccess('Notification deleted successfully', 3000);
        
        // Remove from local state
        setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== notificationId));
        
        // Refresh stats
        fetchNotifications();
      } else {
        toast.showError('Failed to delete notification', 3000);
      }
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      toast.showError(`Error: ${error.message}`, 3000);
    } finally {
      setDeleteConfirm({ isOpen: false, notificationId: null });
    }
  };

  // Open delete confirmation dialog
  const confirmDelete = (notificationId) => {
    setDeleteConfirm({ isOpen: true, notificationId });
  };

  const alertStats = [
    { label: 'Active', value: stats.active.toString(), icon: AlertTriangle, color: 'danger' },
    { label: 'Resolved', value: stats.resolved.toString(), icon: CheckCircle, color: 'success' },
    { label: 'Pending', value: stats.pending.toString(), icon: Clock, color: 'warning' },
    { label: 'Dismissed', value: stats.dismissed.toString(), icon: XCircle, color: 'default' },
  ];

  const colorClasses = {
    danger: 'bg-danger-50 text-danger-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-yellow-50 text-yellow-600',
    default: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-red-50 to-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-red-600 bg-clip-text text-transparent">Fraud Alerts</h1>
                <p className="text-gray-600">Monitor and respond to suspicious activities</p>
              </div>
              <Button
                variant="secondary"
                onClick={fetchNotifications}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
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

            {/* Loading State */}
            {isLoading && alerts.length === 0 && (
              <Card>
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                    <p className="text-gray-600">Loading alerts...</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Alert List */}
            {!isLoading && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Active Alerts ({alerts.length})
                </h2>
                {alerts.length === 0 ? (
                  <Card>
                    <div className="text-center py-12 text-gray-500">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-lg font-semibold">No alerts yet</p>
                      <p className="text-sm">Alerts will appear when fraud is detected</p>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <FraudAlert 
                        key={alert.id} 
                        alert={alert} 
                        onDelete={confirmDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, notificationId: null })}
        onConfirm={handleDeleteNotification}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default Alerts;

