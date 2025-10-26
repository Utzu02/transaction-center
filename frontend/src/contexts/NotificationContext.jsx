import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/api';
import { useToast } from '../components/common/ToastContainer';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const lastNotificationIdRef = useRef(null);
  const hasShownInitialNotifications = useRef(false);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async (showToast = false) => {
    try {
      const response = await apiService.getNotifications({ limit: 100 });
      
      if (response.success && response.notifications) {
        const sortedNotifications = response.notifications.sort((a, b) => 
          new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at)
        );
        
        // Check for new notifications
        if (showToast && sortedNotifications.length > 0) {
          const newestNotification = sortedNotifications[0];
          const newestId = newestNotification._id || newestNotification.id;
          
          // Only show toast if this is a truly new notification
          if (hasShownInitialNotifications.current && lastNotificationIdRef.current !== newestId) {
            // Check if it's unread
            if (!newestNotification.read) {
              // Determine toast type based on notification severity
              const severity = newestNotification.type || 'info';
              
              if (severity === 'high' || severity === 'error') {
                toast.showError(
                  `${newestNotification.title || 'Alert'}: ${newestNotification.message || newestNotification.text}`,
                  8000
                );
              } else if (severity === 'medium' || severity === 'warning') {
                toast.showWarning(
                  `${newestNotification.title || 'Warning'}: ${newestNotification.message || newestNotification.text}`,
                  6000
                );
              } else {
                toast.showInfo(
                  `${newestNotification.title || 'Notification'}: ${newestNotification.message || newestNotification.text}`,
                  5000
                );
              }
            }
          }
          
          lastNotificationIdRef.current = newestId;
        }
        
        setNotifications(sortedNotifications);
        
        // Count unread notifications
        const unread = sortedNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
        
        // Mark that we've shown initial notifications
        if (!hasShownInitialNotifications.current) {
          hasShownInitialNotifications.current = true;
          if (sortedNotifications.length > 0) {
            lastNotificationIdRef.current = sortedNotifications[0]._id || sortedNotifications[0].id;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [toast]);

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    fetchNotifications(false).finally(() => setIsLoading(false));
  }, [fetchNotifications]);

  // Polling for new notifications (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(true); // Show toast for new notifications
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await apiService.markNotificationRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          (n._id === notificationId || n.id === notificationId) 
            ? { ...n, read: true } 
            : n
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await apiService.markAllNotificationsRead();
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      toast.showSuccess('All notifications marked as read', 3000);
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.showError('Failed to mark all as read', 3000);
    }
  }, [toast]);

  // Refresh notifications manually
  const refresh = useCallback(() => {
    return fetchNotifications(false);
  }, [fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;

