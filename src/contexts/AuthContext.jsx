import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const AuthContext = createContext();

/** API / legacy rows may return mixed-case roles; sidebar + RoleRoute expect lowercase. */
const sanitizeUser = (u) => {
  if (!u || typeof u !== 'object') return u;
  const role = String(u.role ?? 'student').trim().toLowerCase();
  return { ...u, role: role || 'student' };
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teacherApplicationPending, setTeacherApplicationPending] = useState(false);

  const syncTeacherApplicationStatus = async (role) => {
    if (role !== 'student') {
      setTeacherApplicationPending(false);
      return false;
    }

    try {
      const response = await api.get('/teacher-applications/me');
      const pending = response.data.application?.status === 'pending';
      setTeacherApplicationPending(pending);
      return pending;
    } catch {
      setTeacherApplicationPending(false);
      return false;
    }
  };

  // Check for existing session
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const nextUser = sanitizeUser(response.data.user);
      setUser(nextUser);
      await syncTeacherApplicationStatus(nextUser.role);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
      setTeacherApplicationPending(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      const nextUser = sanitizeUser(response.data.user);
      setUser(nextUser);
      const teacherApplicationPending = await syncTeacherApplicationStatus(nextUser.role);
      toast.success('Login successful!');
      return { ...response.data, teacherApplicationPending };
    } catch (error) {
      const serverMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.errors?.[0]?.msg;
      const defaultMessage = !error.response
        ? 'Cannot connect to backend server. Make sure backend is running on port 5000.'
        : 'Login failed';
      toast.error(serverMessage || defaultMessage);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      localStorage.setItem('token', response.data.token);
      const nextUser = sanitizeUser(response.data.user);
      setUser(nextUser);
      setTeacherApplicationPending(Boolean(response.data.teacherApplicationPending));
      toast.success('Registration successful!');
      return response.data;
    } catch (error) {
      const serverMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.errors?.[0]?.msg;
      const defaultMessage = !error.response
        ? 'Cannot connect to backend server. Make sure backend is running on port 5000.'
        : 'Registration failed';
      toast.error(serverMessage || defaultMessage);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setTeacherApplicationPending(false);
    toast.success('Logged out successfully');
  };

  const updateUser = (userData) => {
    setUser((prev) => sanitizeUser({ ...prev, ...userData }));
  };

  const value = {
    user,
    loading,
    teacherApplicationPending,
    login,
    register,
    logout,
    updateUser,
    fetchUser,
    syncTeacherApplicationStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

