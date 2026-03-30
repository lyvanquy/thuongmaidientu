import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

// Lấy API URL từ env hoặc fallback (thường là http://localhost:3001)
// Do namespace là /chat, nên URL sẽ là http://localhost:3001/chat
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

export const useSocket = (namespace = '/chat') => {
  const { accessToken } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    // Khởi tạo connection
    const socket = io(`${SOCKET_URL}${namespace}`, {
      auth: { token: accessToken }, // Gửi token lên backend nếu cần chặn auth ở Gateway
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Clean up
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, namespace]);

  return { socket: socketRef.current, isConnected };
};
