import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

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