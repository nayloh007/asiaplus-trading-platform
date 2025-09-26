import { createContext, useContext, useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQuery } from '@tanstack/react-query';
import { type Trade } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { queryClient } from '@/lib/queryClient';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  trades: Trade[];
  refreshTrades: () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  trades: [],
  refreshTrades: () => {}
});

export function useWebSocket() {
  return useContext(WebSocketContext);
}

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Stabilize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  // Query สำหรับ trades ของผู้ใช้
  const { data: userTrades = [] } = useQuery({
    queryKey: ['/api/trades'],
    enabled: !!userId,
  });

  // Stable refresh function
  const refreshTrades = useCallback(() => {
    // Use React Query invalidation instead of page reload
    queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
  }, []);

  // Initialize WebSocket connection once when user is available
  useEffect(() => {
    if (!userId) {
      // Clean up if no user
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Prevent multiple connections for the same user
    if (socketRef.current?.connected) {
      return;
    }

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Create WebSocket connection
    const newSocket = io('/', {
      transports: ['websocket', 'polling']
    });

    socketRef.current = newSocket;

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      newSocket.emit('join-user-room', userId);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    // Trade update handlers - only invalidate queries, don't update state directly
    newSocket.on('trade-updated', (updatedTrade: Trade) => {
      console.log('Trade updated:', updatedTrade);
      // Just invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
    });

    newSocket.on('trade-completed', (completedTradeInfo) => {
      console.log('Trade completed:', completedTradeInfo);
      // Just invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    });

    // Cleanup function
    return () => {
      if (newSocket.connected) {
        newSocket.disconnect();
      }
      if (socketRef.current === newSocket) {
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [userId]); // Only depend on stabilized userId

  return (
    <WebSocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      trades: userTrades || [],
      refreshTrades
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}