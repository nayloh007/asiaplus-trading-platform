import { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { formatCurrency } from "@/lib/formatters";

interface TradeCountdownProps {
  duration: number; // ระยะเวลาในวินาที
  entryPrice: number; // ราคาตอนที่ซื้อ
  currentPrice?: number; // ราคาปัจจุบัน (optional)
  amount: number; // จำนวนเงินที่ลงทุน
  direction: "up" | "down"; // ทิศทางที่เลือก
  profitPercentage: number; // เปอร์เซ็นต์กำไรถ้าชนะ
  cryptoSymbol: string; // สัญลักษณ์สกุลเงินดิจิทัล
  onComplete?: () => void; // callback เมื่อนับถอยหลังเสร็จ
  endTime?: Date; // เวลาที่การเทรดจะสิ้นสุด (optional)
}

export function TradeCountdown({
  duration,
  entryPrice,
  currentPrice,
  amount,
  direction,
  profitPercentage,
  cryptoSymbol,
  onComplete,
  endTime
}: TradeCountdownProps) {
  // ถ้าไม่มี endTime ให้สร้างขึ้นมาโดยใช้เวลาปัจจุบัน + duration
  const calculatedEndTime = endTime || new Date(Date.now() + duration * 1000);
  
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isPulsing, setIsPulsing] = useState(false);
  
  // คำนวณเปอร์เซ็นต์ของเวลาที่เหลือ (คำนวณใหม่ทุกครั้งที่ timeLeft เปลี่ยน)
  const progressPercentage = Math.min(100, Math.max(0, ((duration - timeLeft) / duration) * 100));
  
  // คำนวณผลกำไรที่อาจได้รับ
  const potentialProfit = amount * (profitPercentage / 100);
  
  // ตรวจสอบว่าราคาขณะนี้สูงหรือต่ำกว่าราคาซื้อ
  const priceChange = currentPrice ? (currentPrice - entryPrice) : 0;
  const isPriceUp = priceChange > 0;
  const isPriceDown = priceChange < 0;
  
  // คำนวณว่าเป็นไปตามทิศทางที่ทายหรือไม่
  const isWinning = (direction === "up" && isPriceUp) || (direction === "down" && isPriceDown);
  
  // คำนวณเวลาที่เหลือโดยใช้ endTime
  useEffect(() => {
    // ฟังก์ชั่นสำหรับคำนวณเวลาที่เหลือ
    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = Math.max(0, Math.floor((calculatedEndTime.getTime() - now.getTime()) / 1000));
      return diff;
    };
    
    // ตั้งค่าเวลาเริ่มต้น
    setTimeLeft(calculateTimeLeft());
    
    // เพิ่มเอฟเฟคที่จะทำให้การ์ดเต้นเมื่อเหลือเวลาไม่มาก
    const pulseTimer = setInterval(() => {
      const currentTimeLeft = calculateTimeLeft();
      if (currentTimeLeft <= 10 && currentTimeLeft > 0) {
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 500);
      }
    }, 1000);
    
    // ตั้งเวลานับถอยหลังโดยคำนวณจากเวลาจริง
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft <= 0) {
        clearInterval(timer);
        clearInterval(pulseTimer);
        if (onComplete) {
          onComplete();
        }
      }
    }, 1000);
    
    return () => {
      clearInterval(timer);
      clearInterval(pulseTimer);
    };
  }, [calculatedEndTime, onComplete]);
  
  // แปลงวินาทีเป็นรูปแบบ MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };
  
  return (
    <Card className={`w-full mb-4 ${isPulsing ? "animate-pulse" : ""}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-lg font-medium">ผลการเทรดจะรู้ใน</div>
            <div className="text-xl font-bold">{formatTime(timeLeft)}</div>
          </div>
          
          <Progress value={progressPercentage} className="h-2" />
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">ราคาที่ซื้อ</div>
              <div className="font-medium">{formatCurrency(entryPrice)}</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">ราคาปัจจุบัน</div>
              <div className={`font-medium ${isPriceUp ? "text-green-600" : isPriceDown ? "text-red-600" : ""}`}>
                {currentPrice ? formatCurrency(currentPrice) : "-"}
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-muted-foreground">ทิศทางที่เลือก</div>
                <div className={`font-medium ${direction === "up" ? "text-green-600" : "text-red-600"}`}>
                  {direction === "up" ? "ซื้อขึ้น ↑" : "ซื้อลง ↓"}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-muted-foreground">กำไรที่อาจได้รับ</div>
                <div className="font-medium text-green-600">
                  {formatCurrency(potentialProfit)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center mt-4">
            <div className={`px-4 py-2 rounded-full text-white text-sm font-medium ${
              isWinning ? "bg-green-500" : "bg-red-500"
            }`}>
              {isWinning ? "กำลังทำกำไร" : "กำลังขาดทุน"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}