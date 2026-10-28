import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import apiClient from '../shared/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const connectSocket = useCallback((userData) => {
    const newSocket = io('http://localhost:5005', { withCredentials: true });
    newSocket.on('connect', () => {
      newSocket.emit('join', { userId: userData.id, role: userData.role });
    });
    newSocket.on('notification', (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });
    setSocket(newSocket);
    return newSocket;
  }, []);

  useEffect(() => {
    if (user) {
      const s = connectSocket(user);
      loadNotifications();
      return () => s.disconnect();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await apiClient.get('/dashboard/notifications');
      setNotifications(res.data.data);
      setUnreadCount(res.data.data.filter(n => !n.is_read).length);
    } catch {}
  };

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { token, user: userData } = res.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    if (socket) socket.disconnect();
    setSocket(null);
    setNotifications([]);
    setUnreadCount(0);
  };

  const markNotifRead = async (id) => {
    try {
      await apiClient.patch(`/dashboard/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, socket, notifications, unreadCount, markNotifRead, loadNotifications }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth يجب استخدامه داخل AuthProvider');
  return ctx;
};
