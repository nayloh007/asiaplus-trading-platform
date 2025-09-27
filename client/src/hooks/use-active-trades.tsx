import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { useEffect } from "react";
import { useWebSocket } from "@/hooks/use-websocket";

export type ActiveTradeData = {
  id: number;
  duration: number;
  entryPrice: number;
  direction: "up" | "down";
  amount: string;
  profitPercentage: number;
  endTime: Date;
  cryptoId: string;
  cryptoSymbol: string;
};

// สร้าง key สำหรับเก็บข้อมูลการเทรดใน React Query
const ACTIVE_TRADES_KEY = "active-trades";

export function useActiveTrades() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useWebSocket();

  // ดึงข้อมูลการเทรดที่กำลังทำอยู่จาก cache
  const { data: activeTrades = [] } = useQuery<ActiveTradeData[]>({
    queryKey: [ACTIVE_TRADES_KEY],
    // เราเก็บข้อมูลใน cache โดยไม่เรียก API ใหม่เมื่อโหลดหน้า
    queryFn: () => [],
    // ข้อมูลไม่มีการเปลี่ยนแปลงจาก server แต่เปลี่ยนแปลงเฉพาะใน client
    staleTime: Infinity,
    // เก็บข้อมูลใน cache ไว้ตลอด
    gcTime: Infinity, 
    // แน่ใจว่าข้อมูลจะถูกเก็บไว้ระหว่างโหลดหน้าใหม่
    enabled: !!user,
  });

  // เพิ่มข้อมูลการเทรดใหม่
  const addActiveTrade = (trade: ActiveTradeData) => {
    queryClient.setQueryData([ACTIVE_TRADES_KEY], (old: ActiveTradeData[] | undefined) => {
      const newTrades = [...(old || [])];
      // ตรวจสอบว่าไม่มีซ้ำ
      const existingIndex = newTrades.findIndex(t => t.id === trade.id);
      if (existingIndex >= 0) {
        newTrades[existingIndex] = trade;
      } else {
        newTrades.push(trade);
      }
      return newTrades;
    });
  };

  // ลบข้อมูลการเทรดที่เสร็จสิ้นแล้ว
  const removeActiveTrade = (tradeId: number) => {
    queryClient.setQueryData([ACTIVE_TRADES_KEY], (old: ActiveTradeData[] | undefined) => {
      return (old || []).filter(trade => trade.id !== tradeId);
    });
  };

  // ล้างข้อมูล active trades เก่าเมื่อผู้ใช้เข้าระบบใหม่
  useEffect(() => {
    if (user) {
      // ล้าง active trades เก่าเมื่อเข้าระบบใหม่
      queryClient.setQueryData([ACTIVE_TRADES_KEY], []);
      console.log('Cleared old active trades for user:', user.id);
    }
  }, [user, queryClient]);

  // Listen สำหรับการเทรดที่เสร็จสิ้นจาก WebSocket
  useEffect(() => {
    if (socket && isConnected) {
      const handleTradeCompleted = (completedTradeInfo: { tradeId: number; userId: number; result: string; status: string }) => {
        console.log('Active trades hook received trade completion:', completedTradeInfo);
        // ลบการเทรดที่เสร็จสิ้นออกจาก active trades
        removeActiveTrade(completedTradeInfo.tradeId);
      };

      socket.on('trade-completed', handleTradeCompleted);

      return () => {
        socket.off('trade-completed', handleTradeCompleted);
      };
    }
  }, [socket, isConnected]);

  // ค้นหาการเทรดที่กำลังทำอยู่ตาม cryptoId
  const getActiveTradeForCrypto = (cryptoId: string) => {
    return activeTrades.find(trade => trade.cryptoId === cryptoId);
  };

  return {
    activeTrades,
    addActiveTrade,
    removeActiveTrade,
    getActiveTradeForCrypto,
  };
}