import { useQuery } from "@tanstack/react-query";
import { CryptoCurrency } from "@shared/schema";
import { PriceCard } from "@/components/ui/price-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CryptoListProps {
  onSelectCrypto?: (crypto: CryptoCurrency) => void;
  showCompact?: boolean;
}

export function CryptoList({ onSelectCrypto, showCompact = false }: CryptoListProps) {
  const { data: cryptos, isLoading, error } = useQuery<CryptoCurrency[]>({
    queryKey: ["/api/crypto/market"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[70px]" />
            </div>
            <div className="ml-auto space-y-2">
              <Skeleton className="h-4 w-[60px]" />
              <Skeleton className="h-4 w-[40px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load cryptocurrency data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!cryptos || cryptos.length === 0) {
    return (
      <Alert>
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>
          No cryptocurrency data available at the moment.
        </AlertDescription>
      </Alert>
    );
  }

  if (showCompact) {
    return (
      <ScrollArea className="pb-2">
        <div className="flex space-x-3">
          {cryptos.slice(0, 5).map((crypto) => (
            <PriceCard 
              key={crypto.id} 
              crypto={crypto} 
              onClick={() => onSelectCrypto?.(crypto)}
              compact
            />
          ))}
        </div>
      </ScrollArea>
    );
  }

  return (
    <div className="space-y-3 w-full">
      {cryptos.map((crypto) => (
        <PriceCard 
          key={crypto.id} 
          crypto={crypto} 
          onClick={() => onSelectCrypto?.(crypto)}
          className="w-full"
        />
      ))}
    </div>
  );
}
