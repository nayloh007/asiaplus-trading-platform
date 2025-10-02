import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MobileContainer } from "@/components/layout/mobile-container";
import { TopNavigation } from "@/components/layout/top-navigation";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { CryptoChart } from "@/components/crypto-chart";
import { TradingOptions } from "@/components/trading-options";
import { CryptoCurrency } from "@shared/schema";
import { CryptoList } from "@/components/crypto-list";
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TradingPage() {
  const [, navigate] = useLocation();
  const params = useSearch();
  const searchParams = new URLSearchParams(params);
  const cryptoId = searchParams.get('id') || 'bitcoin';

  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency | null>(null);

  const { data: crypto, isLoading, error } = useQuery<CryptoCurrency>({
    queryKey: [`/api/crypto/${cryptoId}`],
    enabled: !!cryptoId,
  });

  useEffect(() => {
    if (crypto) {
      setSelectedCrypto(crypto);
    }
  }, [crypto]);

  const handleBack = () => {
    navigate('/');
  };

  const handleSelectCrypto = (crypto: CryptoCurrency) => {
    setSelectedCrypto(crypto);
    navigate(`/trade?id=${crypto.id}`);
  };

  return (
    <MobileContainer>
      <div className="pb-20"> {/* Add padding for bottom navigation */}
        <TopNavigation 
          actionButton={
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/trades/history')}
              className="text-xs"
            >
              ประวัติการเทรด
            </Button>
          }
        />
        
        <div className="w-full">
          {isLoading ? (
            <>
              <Card className="w-full rounded-none">
                <CardHeader className="flex flex-row items-center">
                  <Skeleton className="h-8 w-8 rounded-full mr-2" />
                  <Skeleton className="h-4 w-40" />
                  <div className="ml-auto">
                    <Skeleton className="h-4 w-20" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
              <Card className="mt-4 w-full rounded-none">
                <CardContent>
                  <Skeleton className="h-4 w-40 mb-4" />
                  <Skeleton className="h-10 w-full mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : error ? (
            <Alert variant="destructive" className="rounded-none">
              <AlertDescription>
                Failed to load cryptocurrency data. Please try again later.
              </AlertDescription>
            </Alert>
          ) : selectedCrypto ? (
            <>
              <div className="w-full">
                <CryptoChart crypto={selectedCrypto} />
                <TradingOptions crypto={selectedCrypto} />
              </div>
            </>
          ) : (
            <div className="text-center py-8 w-full">
              <p>Select a cryptocurrency to trade</p>
            </div>
          )}
          
          <Card className="mt-4 w-full rounded-none border-t">
            <CardHeader className="px-0 mx-0">
              <CardTitle className="mx-4">Select Cryptocurrency</CardTitle>
            </CardHeader>
            <CardContent className="px-0 mx-0">
              <CryptoList onSelectCrypto={handleSelectCrypto} />
            </CardContent>
          </Card>
        </div>
      </div>
      
      <BottomNavigation />
    </MobileContainer>
  );
}
