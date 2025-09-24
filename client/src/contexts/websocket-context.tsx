import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQuery } from '@tanstack/react-query';
import { trades, type Trade } from '@shared/schema';
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
        
        // ถ้าไม่พบการเทรดที่ต้องการอัปเดต ให้เพิ่มใหม่
        if (!prevTrades.find(trade => trade.id === updatedTrade.id)) {
          return [...prevTrades, updatedTrade];
        }
        
        return updatedTrades;
      });
      
      // Refetch trades เพื่อให้แน่ใจว่าข้อมูลล่าสุด
      refetchTrades();
    });

    // Cleanup function
    return () => {
      newSocket.disconnect();
    };
  }, [userId]); // เพิ่ม dependency array ที่ถูกต้อง

  useEffect(() => {
    if (!socket || !userId) return;

    // รับการอัปเดตการเทรดที่เสร็จสิ้น
    socket.on('trade-completed', (completedTradeInfo) => {
      console.log('Trade completed:', completedTradeInfo);
      
      // รีเฟรชข้อมูลการเทรดทันที
      setTimeout(() => {
        refetchTrades();
      }, 100);
      
      // อัปเดต local state โดยการลบการเทรดที่เสร็จแล้วออกจาก active trades
      setTrades(prevTrades => 
        prevTrades.filter(trade => trade.id !== completedTradeInfo.tradeId)
      );
    });

    return () => {
      if (socket) {
        socket.off('trade-completed');
      }
    };
  }, [socket, userId, refetchTrades]); // เพิ่ม refetchTrades ใน dependency array

  const refreshTrades = useCallback(() => {
    refetchTrades();
  }, [refetchTrades]);

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