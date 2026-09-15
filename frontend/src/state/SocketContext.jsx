import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io as socketIO } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }
    const url = import.meta.env.VITE_SOCKET_URL || '/';
    const s = socketIO(url, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = s;
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('notification', (n) => setNotifications((prev) => [n, ...prev].slice(0, 50)));
    return () => s.disconnect();
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, notifications, setNotifications }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
