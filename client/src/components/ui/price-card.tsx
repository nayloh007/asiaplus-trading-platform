import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { ChartComponent } from "@/components/ui/chart-component";
import { CryptoCurrency } from "@shared/schema";

interface PriceCardProps {
  crypto: CryptoCurrency;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}

export function PriceCard({ crypto, onClick, compact = false, className = "" }: PriceCardProps) {
  const isPriceUp = crypto.price_change_percentage_24h >= 0;
  const priceData = crypto.sparkline_in_7d?.price || generateDummyData(isPriceUp);

  // Format price with Thai Baht symbol
  const formattedPrice = formatCurrency(crypto.current_price);

  return (
    <Card 
      className={`flex-shrink-0 w-full rounded-lg shadow-sm border-0 transition cursor-pointer bg-white dark:bg-card ${className}`}
      onClick={onClick}
    >
      <CardContent className="py-1.5 px-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <img
              src={crypto.image}
              alt={crypto.name}
              className="w-6 h-6 rounded-full mr-2"
            />
            <div className="flex flex-col space-y-1.5">
              <span className="text-xs font-bold leading-tight">{crypto.symbol.toUpperCase()}/USDT</span>
              <span className="text-[9px] font-semibold text-muted-foreground leading-tight">{crypto.symbol.toUpperCase()}/USDT</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={isPriceUp ? "crypto-price-up text-base font-bold leading-tight" : "crypto-price-down text-base font-bold leading-tight"}>
              {formattedPrice.replace('$', '')}
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isPriceUp ? "rgb(0, 200, 83)" : "rgb(255, 61, 0)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
          </div>
        </div>
        
        {!compact && (
          <div className="mt-0.5 h-5">
            <ChartComponent 
              data={priceData} 
              isPriceUp={isPriceUp}
              className="w-full h-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Generate synthetic data for preview when no data is available
function generateDummyData(isPositive: boolean): number[] {
  const data = [];
  let value = 0.5;
  
  for (let i = 0; i < 20; i++) {
    if (isPositive) {
      value += Math.random() * 0.05 - 0.02; // Slightly trending up
    } else {
      value += Math.random() * 0.05 - 0.03; // Slightly trending down
    }
    value = Math.max(0.1, Math.min(0.9, value)); // Keep within bounds
    data.push(value);
  }
  
  return data;
}
