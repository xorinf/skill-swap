import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setUnauthorizedHandler } from '../lib/api.js';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('skillswap.token') || '');
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setToken('');
      localStorage.removeItem('skillswap.token');
    });
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      const r = await api.get('/auth/me');
      setUser(r.data.user);
    } catch {
      setUser(null);
    } finally {
      setBootstrapped(true);
    }
  }, []);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  const login = useCallback(async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    setUser(r.data.user);
    setToken(r.data.token);
    localStorage.setItem('skillswap.token', r.data.token);
    return r.data.user;
  }, []);

  const register = useCallback(async (data) => {
    const r = await api.post('/auth/register', data);
    setUser(r.data.user);
    setToken(r.data.token);
    localStorage.setItem('skillswap.token', r.data.token);
    return r.data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout', {}); } catch { /* ignore */ }
    setUser(null);
    setToken('');
    localStorage.removeItem('skillswap.token');
  }, []);

  const refresh = useCallback(async () => {
    const r = await api.get('/auth/me');
    setUser(r.data.user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, bootstrapped, login, register, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
