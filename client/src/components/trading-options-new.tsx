import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CryptoCurrency } from "@shared/schema";
import { formatCurrency } from "@/lib/formatters";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  
  const estimatedValue = parseFloat(amount) * crypto.current_price;
  const tradingFee = estimatedValue * 0.002; // 0.2% fee
  const userBalance = 10000; // สมมติว่ามีเงิน 10,000
  
  const tradeMutation = useMutation({
    mutationFn: async (data: TradeFormData) => {
      const res = await apiRequest("POST", "/api/trades", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Trade executed",
        description: `Your ${crypto.symbol.toUpperCase()} trade has been placed successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
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
  
  // ทำการสั่งซื้อจริงๆ เมื่อยืนยันใน Dialog แล้ว
  const handleConfirmTrade = () => {
    // หา profit percentage จาก selectedDuration
    const selectedOption = tradeOptions.find(option => option.duration === selectedDuration);
    const profitPercentage = selectedOption ? selectedOption.profit.toString() : "0";
    
    // แปลง duration string เป็น number ใช้ seconds จาก tradeOptions
    const durationInSeconds = selectedOption ? selectedOption.seconds : 60;
    
    tradeMutation.mutate({
      cryptoId: crypto.id,
      amount,
      direction: tradeDirection,
      entryPrice: crypto.current_price.toString(),
      duration: durationInSeconds,
      profitPercentage: profitPercentage
    });
    
    // ปิด Dialog
    setShowDialog(false);
  };
  
  return (
    <>
      <Card className="mb-4 w-full rounded-none">
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">Trade Amount</h3>
          <div className="relative mb-4">
            <Input
              type="text"
              className="pr-12"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {crypto.symbol.toUpperCase()}
            </div>
          </div>
          
          <div className="flex justify-between mb-1 text-sm">
            <span className="text-muted-foreground">Estimated Value:</span>
            <span>{formatCurrency(isNaN(estimatedValue) ? 0 : estimatedValue)}</span>
          </div>
          
          <div className="flex justify-between mb-4 text-sm">
            <span className="text-muted-foreground">Trading Fee:</span>
            <span>{formatCurrency(isNaN(tradingFee) ? 0 : tradingFee)}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              className="bg-[hsl(var(--chart-1))] hover:bg-[hsl(var(--chart-1))/90]"
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
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการสั่งซื้อ {tradeDirection === "up" ? "ขึ้น" : "ลง"}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <RadioGroup 
              value={selectedDuration} 
              onValueChange={setSelectedDuration}
              className="space-y-4"
            >
              {tradeOptions.map((option) => (
                <div key={option.duration} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={option.duration} id={`option-${option.duration}`} />
                    <Label htmlFor={`option-${option.duration}`} className="cursor-pointer">
                      <div>
                        <div className="font-medium mb-1">เวลาชำระราคา</div>
                        <div className="text-lg font-bold">{option.duration}</div>
                      </div>
                    </Label>
                  </div>
                  <div className="text-right">
                    <div className="text-md font-medium text-green-600">กำไร {option.profit}%</div>
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