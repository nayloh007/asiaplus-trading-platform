import { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
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
  const [isConnected, setIsConnected] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);

  // Query สำหรับ trades ของผู้ใช้
  const { data: userTrades = [] } = useQuery({
    queryKey: ['/api/trades'],
    enabled: !!userId,
  });

  // Update trades state when userTrades changes
  useEffect(() => {
    if (userTrades && Array.isArray(userTrades)) {
      setTrades(userTrades);
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
    if (!userId) {
      // Clean up connection if no user
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

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
      setIsConnected(true);
      newSocket.emit('join-user-room', userId);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    // Trade update handlers
    newSocket.on('trade-updated', (updatedTrade: Trade) => {
      console.log('Trade updated:', updatedTrade);
      
      setTrades(currentTrades => {
        const existingTradeIndex = currentTrades.findIndex(trade => trade.id === updatedTrade.id);
        
        if (existingTradeIndex >= 0) {
          // Update existing trade
          const newTrades = [...currentTrades];
          newTrades[existingTradeIndex] = updatedTrade;
          return newTrades;
        } else {
          // Add new trade
          return [...currentTrades, updatedTrade];
        }
      });
    });

    newSocket.on('trade-completed', (completedTradeInfo) => {
      console.log('Trade completed:', completedTradeInfo);
      
      // Remove completed trade from local state
      setTrades(currentTrades => 
        currentTrades.filter(trade => trade.id !== completedTradeInfo.tradeId)
      );
    });

    // Cleanup function
    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [userId]);

  return (
    <WebSocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      trades,
      refreshTrades
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}