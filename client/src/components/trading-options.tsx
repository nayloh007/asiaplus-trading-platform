import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CryptoCurrency } from "@shared/schema";
import { formatCurrency } from "@/lib/formatters";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useActiveTrades } from "@/hooks/use-active-trades";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TradeCountdown } from "@/components/trade-countdown";

interface TradingOptionsProps {
  crypto: CryptoCurrency;
}

interface TradeFormData {
  cryptoId: string;
  amount: string;
  direction: "up" | "down";
  entryPrice: string;
  duration: string; // เพิ่มเวลาชำระราคา 
}

type TradeOption = {
  duration: string;
  seconds: number;
  profit: number;
};

// ตัวเลือกระยะเวลาการลงทุนและกำไรที่จะได้รับ
const tradeOptions: TradeOption[] = [
  { duration: "60S", seconds: 60, profit: 30 },
  { duration: "120S", seconds: 120, profit: 40 },
  { duration: "300S", seconds: 300, profit: 50 }
];

export function TradingOptions({ crypto }: TradingOptionsProps) {
  const [amount, setAmount] = useState("0.01");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(tradeOptions[0].duration);
  const [tradeDirection, setTradeDirection] = useState<"up" | "down">("up");
  const { user } = useAuth();
  const { toast } = useToast();
  const { getActiveTradeForCrypto, addActiveTrade, removeActiveTrade } = useActiveTrades();
  
  // ดึงข้อมูลการเทรดที่กำลังดำเนินการอยู่จาก global state
  const activeTradeData = getActiveTradeForCrypto(crypto.id);
  
  // Query สำหรับดึงข้อมูลล่าสุดของ crypto ที่กำลังเทรด
  const { data: latestCryptoData } = useQuery({
    queryKey: [`/api/crypto/${crypto.id}`],
    queryFn: async () => {
      const res = await fetch(`/api/crypto/${crypto.id}`);
      if (!res.ok) throw new Error("Failed to fetch latest crypto data");
      return res.json();
    },
    enabled: !!activeTradeData, // เปิดใช้งานเฉพาะเมื่อมีการเทรดที่กำลังดำเนินอยู่
    refetchInterval: 5000, // รีเฟรชทุก 5 วินาที
  });
  
  // จำกัดจำนวนที่ป้อนได้ไม่เกิน 1,000
  const validateAndSetAmount = (value: string) => {
    const numValue = parseFloat(value);
    
    // ตรวจสอบว่าเป็นตัวเลขที่ถูกต้องหรือไม่
    if (value === "" || isNaN(numValue)) {
      setAmount(value);
      return;
    }
    
    // จำกัดค่าไม่เกิน 1,000
    if (numValue > 1000) {
      setAmount("1000");
    } else {
      setAmount(value);
    }
  };
  
  // คำนวณมูลค่าเป็นเงินบาทจากจำนวนที่ใส่ (ไม่ต้องคูณราคา BTC)
  const estimatedValue = parseFloat(amount || "0");
  const tradingFee = estimatedValue * 0.002; // 0.2% fee
  
  // ดึงข้อมูลยอดเงินจริงจาก user
  const userBalance = user ? parseFloat(user.balance) : 0;
  
  const tradeMutation = useMutation({
    mutationFn: async (data: TradeFormData) => {
      const res = await apiRequest("POST", "/api/trades", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "การเทรดสำเร็จ",
        description: `เทรด ${crypto.symbol.toUpperCase()} ของคุณได้ถูกบันทึกเรียบร้อยแล้ว`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      
      console.log("ข้อมูลการเทรดที่ได้รับ:", data);
      
      // ดึงค่า seconds จาก tradeOptions โดยเปรียบเทียบกับ duration ที่ส่งไป
      const durationInSeconds = parseInt(data.duration);
      const selectedOption = tradeOptions.find(option => option.seconds === durationInSeconds);
      const profitPercent = selectedOption ? selectedOption.profit : parseInt(data.profitPercentage);
      
      // สร้างข้อมูลการเทรดที่กำลังดำเนินการอยู่
      const now = new Date();
      const endTime = new Date(now.getTime() + durationInSeconds * 1000);
      
      console.log("กำลังเพิ่มข้อมูลการเทรด:", {
        id: data.id,
        duration: durationInSeconds,
        entryPrice: parseFloat(data.entryPrice),
        direction: data.direction,
        amount: data.amount,
        profitPercentage: profitPercent,
        endTime,
        cryptoId: data.cryptoId,
        cryptoSymbol: crypto.symbol.toUpperCase()
      });
      
      // เพิ่มข้อมูลการเทรดเข้าไปใน global state
      addActiveTrade({
        id: data.id,
        duration: durationInSeconds,
        entryPrice: parseFloat(data.entryPrice),
        direction: data.direction as "up" | "down",
        amount: data.amount,
        profitPercentage: profitPercent,
        endTime,
        cryptoId: data.cryptoId,
        cryptoSymbol: crypto.symbol.toUpperCase()
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Trade failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // ตรวจสอบข้อมูลและแสดง Dialog เมื่อกดปุ่มซื้อ
  const handleTradeClick = (direction: "up" | "down") => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to place trades.",
        variant: "destructive",
      });
      return;
    }
    
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid trading amount.",
        variant: "destructive",
      });
      return;
    }

    // ตั้งค่าทิศทางและแสดง Dialog
    setTradeDirection(direction);
    setShowDialog(true);
  };
  
  // จัดการเมื่อนับถอยหลังเสร็จสิ้น
  const handleCountdownComplete = () => {
    // ตรวจสอบว่าชนะหรือแพ้
    if (activeTradeData && latestCryptoData) {
      // ใช้ tradeId จาก activeTradeData แทน tradeMutation.data?.id
      const tradeId = activeTradeData.id;
      
      const priceChange = latestCryptoData.current_price - activeTradeData.entryPrice;
      const isWin = 
        (activeTradeData.direction === "up" && priceChange > 0) || 
        (activeTradeData.direction === "down" && priceChange < 0);
      
      // คำนวณมูลค่าการเทรดและกำไร/ขาดทุน
      const tradeValue = parseFloat(activeTradeData.amount);
      const profit = isWin ? tradeValue * (activeTradeData.profitPercentage / 100) : 0;
      
      console.log("Completing trade with ID:", tradeId);
      
      // อัพเดทสถานะการเทรดในฐานข้อมูล
      apiRequest("PATCH", `/api/trades/${tradeId}`, {
        status: 'completed',
        result: isWin ? 'win' : 'lose',  // แก้จาก 'loss' เป็น 'lose' ให้ตรงกับค่าที่กำหนดในฐานข้อมูล
      })
      .then(async response => {
        // อัพเดท user data เพื่อให้แสดงยอดเงินใหม่
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        
        // ตรวจสอบผลลัพธ์จริงจากเซิร์ฟเวอร์ (อาจถูกกำหนดไว้ล่วงหน้า)
        // แปลง response เป็น json เพื่อดึงค่า result
        const responseData = await response.json();
        const actualResult = responseData.result || "lose";  // กรณีไม่มีผลลัพธ์ ให้ถือว่าแพ้
        const actualWin = actualResult === 'win';
        
        // แสดงผลลัพธ์ตามที่ได้จากเซิร์ฟเวอร์
        toast({
          title: actualWin ? "ยินดีด้วย! คุณได้กำไร" : "เสียใจด้วย คุณขาดทุน",
          description: actualWin 
            ? `คุณทำกำไรได้ ${formatCurrency(profit)}`
            : `คุณเสียเงิน ${formatCurrency(tradeValue)}`,
          variant: actualWin ? "default" : "destructive",
        });
      })
      .catch(error => {
        console.error("Error updating trade status:", error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถบันทึกผลการเทรดได้",
          variant: "destructive",
        });
      })
      .finally(() => {
        // รีเซ็ตสถานะการเทรด โดยใช้ ID จาก activeTradeData
        removeActiveTrade(activeTradeData.id);
      });
    }
  };
  
  // ทำการสั่งซื้อจริงๆ เมื่อยืนยันใน Dialog แล้ว
  const handleConfirmTrade = () => {
    // หา option ที่เลือกเพื่อดึงข้อมูล seconds และ profit
    const selectedOption = tradeOptions.find(option => option.duration === selectedDuration);
    const durationInSeconds = selectedOption ? selectedOption.seconds : 60;
    const profitPercentage = selectedOption ? selectedOption.profit.toString() : "30";
    
    console.log("ส่งข้อมูลการเทรด:", {
      cryptoId: crypto.id,
      amount,
      direction: tradeDirection,
      entryPrice: crypto.current_price.toString(),
      duration: durationInSeconds,
      profitPercentage
    });
    
    // ส่งข้อมูลไปยัง API
    tradeMutation.mutate({
      cryptoId: crypto.id,
      amount,
      direction: tradeDirection,
      entryPrice: crypto.current_price.toString(),
      duration: durationInSeconds,
      profitPercentage
    });
    
    // ปิด Dialog
    setShowDialog(false);
  };
  
  return (
    <>
      {activeTradeData ? (
        // แสดงการนับถอยหลังถ้ามีการเทรดที่กำลังดำเนินอยู่
        <TradeCountdown 
          duration={activeTradeData.duration}
          entryPrice={activeTradeData.entryPrice}
          currentPrice={latestCryptoData?.current_price}
          amount={parseFloat(activeTradeData.amount)}
          direction={activeTradeData.direction}
          profitPercentage={activeTradeData.profitPercentage}
          cryptoSymbol={crypto.symbol.toUpperCase()}
          onComplete={handleCountdownComplete}
          endTime={activeTradeData.endTime}
        />
      ) : (
        // แสดงปุ่มซื้อขึ้น/ลงตามปกติ
        <Card className="mb-4 w-full rounded-none">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleTradeClick("up")}
                disabled={tradeMutation.isPending}
              >
                {tradeMutation.isPending && tradeMutation.variables?.direction === "up" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                )}
                ซื้อขึ้น
              </Button>
              
              <Button 
                variant="destructive"
                onClick={() => handleTradeClick("down")}
                disabled={tradeMutation.isPending}
              >
                {tradeMutation.isPending && tradeMutation.variables?.direction === "down" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                )}
                ซื้อลง
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการสั่งซื้อ {tradeDirection === "up" ? "ขึ้น" : "ลง"}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <Label htmlFor="trade-amount" className="block mb-2">จำนวนเงินที่ต้องการลงทุน (บาท)</Label>
              <div className="relative">
                <Input
                  id="trade-amount"
                  type="text"
                  className="pr-12"
                  value={amount}
                  onChange={(e) => validateAndSetAmount(e.target.value)}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  ฿
                </div>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">มูลค่าโดยประมาณ:</span>
                <span>{formatCurrency(isNaN(estimatedValue) ? 0 : estimatedValue)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">ค่าธรรมเนียม:</span>
                <span>{formatCurrency(isNaN(tradingFee) ? 0 : tradingFee)}</span>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <RadioGroup 
              value={selectedDuration} 
              onValueChange={setSelectedDuration}
              className="space-y-4"
            >
              {tradeOptions.map((option) => (
                <div key={option.duration} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value={option.duration} id={`option-${option.duration}`} />
                    <div>
                      <div className="text-sm text-muted-foreground">เวลาชำระราคา</div>
                      <div className="text-xl font-bold">{option.duration}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-md font-medium text-primary">กำไร {option.profit}%</div>
                  </div>
                </div>
              ))}
            </RadioGroup>
            
            <Separator className="my-4" />
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>จำนวนเงินลงทุนซื้อทั้งหมด:</span>
                <span className="font-semibold">{formatCurrency(isNaN(estimatedValue) ? 0 : estimatedValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>ยอดเงินคงเหลือ:</span>
                <span className="font-semibold">{formatCurrency(userBalance - (isNaN(estimatedValue) ? 0 : estimatedValue))}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-center">
            <Button 
              onClick={handleConfirmTrade} 
              disabled={tradeMutation.isPending}
              className="w-full"
            >
              {tradeMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              ยืนยันการสั่งซื้อ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}