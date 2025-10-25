import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, AlertCircle, Info, Trash2 } from 'lucide-react';
import { useNotifications } from '../common/ToastContainer';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications, clearNotification, clearAllNotifications } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 hover:bg-green-100';
      case 'error':
        return 'bg-red-50 border-red-200 hover:bg-red-100';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
      default:
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-white/50 backdrop-blur-sm rounded-xl transition-all transform hover:scale-105"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 z-[9999] animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-500">{notifications.length} total</p>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors relative group ${getColor(notification.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 pr-6">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      <button
                        onClick={() => clearNotification(notification.id)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-white rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

