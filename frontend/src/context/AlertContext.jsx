import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = useCallback(async () => {
    if (!isAuthenticated) {
      setAlerts([]);
      setUnreadCount(0);
      return;
    }
    try {
      const res = await api.get('/alerts');
      if (res.data.success) {
        setAlerts(res.data.data);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (e) {
      console.warn('Error fetching alerts:', e.message);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const markAsRead = async (alertId) => {
    try {
      await api.put(`/alerts/${alertId}/read`);
      setAlerts(prev => prev.map(a => (a._id === alertId ? { ...a, isRead: true } : a)));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Error marking alert as read:', e);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/alerts/mark-all-read');
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Error marking all alerts as read:', e);
    }
  };

  return (
    <AlertContext.Provider value={{ alerts, unreadCount, markAsRead, markAllRead, refreshAlerts: fetchAlerts }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};
