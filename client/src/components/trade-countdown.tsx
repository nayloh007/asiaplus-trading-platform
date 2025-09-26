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
  
  // คำนวณเปอร์เซ็นต์ของเวลาที่เหลือ (เริ่มต้นที่ 100% และลดลงเมื่อเวลาผ่านไป)
  const progressPercentage = Math.min(100, Math.max(0, (timeLeft / duration) * 100));
  
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
    console.log("🔄 TradeCountdown useEffect started", {
      duration,
      endTime: calculatedEndTime,
      currentTime: new Date()
    });
    
    // ฟังก์ชั่นสำหรับคำนวณเวลาที่เหลือ
    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = Math.max(0, Math.floor((calculatedEndTime.getTime() - now.getTime()) / 1000));
      console.log("⏰ Calculating time left:", {
        now: now.toISOString(),
        endTime: calculatedEndTime.toISOString(),
        diffMs: calculatedEndTime.getTime() - now.getTime(),
        diffSeconds: diff
      });
      return diff;
    };
    
    // ตั้งค่าเวลาเริ่มต้น
    const initialTimeLeft = calculateTimeLeft();
    setTimeLeft(initialTimeLeft);
    console.log("🚀 Initial time left set to:", initialTimeLeft);
    
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
      console.log("⏱️ Timer tick - new time left:", newTimeLeft);
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft <= 0) {
        console.log("⏰ Timer completed!");
        clearInterval(timer);
        clearInterval(pulseTimer);
        if (onComplete) {
          onComplete();
        }
      }
    }, 1000);
    
    return () => {
      console.log("🧹 TradeCountdown cleanup");
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
          
          <div className="flex flex-col items-center justify-center mt-4 space-y-2">
            <div className="text-center">
              <span className="text-sm text-muted-foreground">สถานะปัจจุบัน:</span>
            </div>
            <div className={`px-5 py-3 rounded-full text-white text-md font-bold shadow-lg ${
              isWinning ? "bg-green-600" : "bg-red-600"
            }`}>
              {isWinning 
                ? `กำลังทำกำไร ${currentPrice ? `+${formatCurrency(Math.abs(priceChange))}` : ""}` 
                : `กำลังขาดทุน ${currentPrice ? `-${formatCurrency(Math.abs(priceChange))}` : ""}`
              }
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ราคาจะต้อง{direction === "up" ? "สูงกว่า" : "ต่ำกว่า"}ราคาเข้าเมื่อหมดเวลาจึงจะได้กำไร
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}