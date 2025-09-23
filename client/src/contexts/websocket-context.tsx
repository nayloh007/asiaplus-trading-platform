import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQuery } from '@tanstack/react-query';
import type { Trade } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);

  // Query สำหรับ trades ของผู้ใช้
  const { data: userTrades = [], refetch: refetchTrades } = useQuery({
    queryKey: ['/api/trades'],
    enabled: !!userId,
  });

  useEffect(() => {
    if (userTrades && Array.isArray(userTrades)) {
      setTrades(userTrades);
    }
  }, [userTrades]);

  useEffect(() => {
    // สร้าง WebSocket connection
    const newSocket = io('/', {
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    // Event handlers
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // เข้าร่วม room ของผู้ใช้
      if (userId) {
        newSocket.emit('join-user-room', userId);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    // รับการอัปเดตการเทรด
    newSocket.on('trade-updated', (updatedTrade: Trade) => {
      console.log('Trade updated:', updatedTrade);
      
      setTrades(prevTrades => {
        const updatedTrades = prevTrades.map(trade => 
          trade.id === updatedTrade.id ? updatedTrade : trade
        );
        
        // ถ้าไม่เจอการเทรดที่อัปเดต ให้เพิ่มเข้าไป (ในกรณีที่เป็นการเทรดใหม่)
        if (!prevTrades.find(trade => trade.id === updatedTrade.id)) {
          return [...updatedTrades, updatedTrade];
        }
        
        return updatedTrades;
      });
      
      // Refresh trades query เพื่อให้แน่ใจว่าข้อมูลถูกต้อง
      refetchTrades();
    });

    return () => {
      newSocket.close();
    };
  }, [userId, refetchTrades]);

  const refreshTrades = () => {
    refetchTrades();
  };

  return (
    <WebSocketContext.Provider value={{
      socket,
      isConnected,
      trades,
      refreshTrades
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}