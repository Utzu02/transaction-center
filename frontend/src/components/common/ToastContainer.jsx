import { createContext, useContext, useState, useCallback } from 'react';
import Toast from './Toast';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const useNotifications = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useNotifications must be used within ToastProvider');
  }
  return { notifications: context.notifications, clearNotification: context.clearNotification, clearAllNotifications: context.clearAllNotifications };
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, timestamp: new Date(), read: false };
    setToasts(prev => [...prev, { ...notification, duration }]);
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const showSuccess = useCallback((message, duration) => {
    addToast(message, 'success', duration);
  }, [addToast]);

  const showError = useCallback((message, duration) => {
    addToast(message, 'error', duration);
  }, [addToast]);

  const showWarning = useCallback((message, duration) => {
    addToast(message, 'warning', duration);
  }, [addToast]);

  const showInfo = useCallback((message, duration) => {
    addToast(message, 'info', duration);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ 
      showSuccess, 
      showError, 
      showWarning, 
      showInfo, 
      notifications, 
      clearNotification, 
      clearAllNotifications 
    }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              transform: `translateY(${index * -10}px)`,
              transition: 'transform 0.3s ease'
            }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

