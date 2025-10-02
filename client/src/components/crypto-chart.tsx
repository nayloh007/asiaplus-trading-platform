import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { CryptoCurrency } from "@shared/schema";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface CryptoChartProps {
  crypto: CryptoCurrency;
  onBack?: () => void;
}

export function CryptoChart({ crypto, onBack }: CryptoChartProps) {
  const isPriceUp = crypto.price_change_percentage_24h >= 0;
  const { theme } = useTheme();
  const [interval, setInterval] = useState("D"); // เริ่มต้นด้วยกราฟรายวัน
  const [mounted, setMounted] = useState(false);
  
  // ป้องกันการเรนเดอร์ที่ไม่ตรงกันระหว่างเซิร์ฟเวอร์และไคลเอนต์
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <Card className="mb-4 w-full rounded-none border-0 shadow-none">
      <CardHeader className="flex flex-row items-center px-4 pb-2">
        {onBack && (
          <button onClick={onBack} className="mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
        <div className="flex items-center">
          <img 
            src={crypto.image} 
            alt={crypto.name} 
            className="w-8 h-8 rounded-full mr-2"
          />
          <CardTitle className="text-base">{crypto.symbol.toUpperCase()}/TetherUS</CardTitle>
        </div>
        <div className="ml-auto text-right">
          <div className="font-semibold">
            {formatCurrency(crypto.current_price)}
          </div>
          <div 
            className={`${
              isPriceUp ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"
            } text-sm flex items-center justify-end`}
          >
            {isPriceUp ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
                <path d="m18 15-6-6-6 6" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
                <path d="m6 9 6 6 6-6" />
              </svg>
            )}
            <span>{formatPercentage(crypto.price_change_percentage_24h)}</span>
          </div>
        </div>
      </CardHeader>
      
      {/* ส่วนของตัวเลือกช่วงเวลา */}
      <div className="px-2 py-1 border-y border-border/50 flex items-center space-x-1 overflow-x-auto scrollbar-hide">
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" className={interval === "1" ? "bg-muted text-xs h-7 px-2" : "text-xs h-7 px-2"} onClick={() => setInterval("1")}>
            1m
          </Button>
          <Button variant="ghost" size="sm" className={interval === "30" ? "bg-muted text-xs h-7 px-2" : "text-xs h-7 px-2"} onClick={() => setInterval("30")}>
            30m
          </Button>
          <Button variant="ghost" size="sm" className={interval === "60" ? "bg-muted text-xs h-7 px-2" : "text-xs h-7 px-2"} onClick={() => setInterval("60")}>
            1h
          </Button>
          <Button variant="ghost" size="sm" className={interval === "D" ? "bg-muted text-xs h-7 px-2" : "text-xs h-7 px-2"} onClick={() => setInterval("D")}>
            D
          </Button>
          <Button variant="ghost" size="sm" className={interval === "W" ? "bg-muted text-xs h-7 px-2" : "text-xs h-7 px-2"} onClick={() => setInterval("W")}>
            W
          </Button>
          <Button variant="ghost" size="sm" className={interval === "M" ? "bg-muted text-xs h-7 px-2" : "text-xs h-7 px-2"} onClick={() => setInterval("M")}>
            M
          </Button>
        </div>
        
        <div className="flex-1"></div>
        
        {/* ปุ่มเครื่องมือเพิ่มเติม */}
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" className="text-xs h-7 w-7 p-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12h20M2 12l5-5M2 12l5 5M22 12l-5-5M22 12l-5 5"/>
            </svg>
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-7 w-7 p-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
              <path d="M15 9h.01M9 15h.01M21 9h.01M21 15h.01M9 3v0M9 21v0M15 3v0M15 21v0M3 9v0M21 9v0M3 15v0M21 15v0"></path>
            </svg>
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-7 w-7 p-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 8v8"></path>
              <path d="M8 12h8"></path>
            </svg>
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-7 w-7 p-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M14 10l7-7M9 21H3v-6M10 14l-7 7"></path>
            </svg>
          </Button>
        </div>
      </div>
      
      <CardContent className="p-0">
        <div className="h-[450px] w-full">
          {mounted && (
            <iframe
              src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${crypto.symbol.toUpperCase()}USDT&interval=${interval}&hidesidetoolbar=0&hideTopBar=1&symboledit=0&saveimage=1&toolbarbg=f1f3f6&studies=[%22RSI%22]&theme=${theme === 'dark' ? 'dark' : 'light'}&style=1&timezone=exchange&withdateranges=1&showpopupbutton=1&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&showpopupbutton=1&locale=en&utm_source=&utm_medium=widget&utm_campaign=chart`}
              style={{ width: '100%', height: '100%' }}
              frameBorder="0"
              title="TradingView Chart"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}


