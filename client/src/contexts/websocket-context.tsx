import { createContext, useContext, useEffect, useRef, useCallback } from 'react';
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
  const userId = user?.id;
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);
  const tradesRef = useRef<Trade[]>([]);

  // Query สำหรับ trades ของผู้ใช้
  const { data: userTrades = [] } = useQuery({
    queryKey: ['/api/trades'],
    enabled: !!userId,
  });

  // Update trades ref when userTrades changes
  useEffect(() => {
    if (userTrades && Array.isArray(userTrades)) {
      tradesRef.current = userTrades;
    }
  }, [userTrades]);

  // Stable refresh function
  const refreshTrades = useCallback(() => {
    // Use React Query invalidation instead of page reload
    queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
  }, []);

  // Initialize WebSocket connection once
  useEffect(() => {
    if (!userId) return;

    // Prevent multiple connections
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
      isConnectedRef.current = true;
      newSocket.emit('join-user-room', userId);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      isConnectedRef.current = false;
    });

    // Trade update handlers
    newSocket.on('trade-updated', (updatedTrade: Trade) => {
      console.log('Trade updated:', updatedTrade);
      
      const currentTrades = tradesRef.current;
      const existingTradeIndex = currentTrades.findIndex(trade => trade.id === updatedTrade.id);
      
      if (existingTradeIndex >= 0) {
        // Update existing trade
        const newTrades = [...currentTrades];
        newTrades[existingTradeIndex] = updatedTrade;
        tradesRef.current = newTrades;
      } else {
        // Add new trade
        tradesRef.current = [...currentTrades, updatedTrade];
      }
    });

    newSocket.on('trade-completed', (completedTradeInfo) => {
      console.log('Trade completed:', completedTradeInfo);
      
      // Remove completed trade from local state
      tradesRef.current = tradesRef.current.filter(
        trade => trade.id !== completedTradeInfo.tradeId
      );
    });

    // Cleanup function
    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      isConnectedRef.current = false;
    };
  }, [userId]);

  return (
    <WebSocketContext.Provider value={{
      socket: socketRef.current,
      isConnected: isConnectedRef.current,
      trades: tradesRef.current,
      refreshTrades
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}