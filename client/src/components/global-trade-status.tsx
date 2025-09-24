import { useState } from 'react';
import { useWebSocket } from '@/contexts/websocket-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Eye
} from 'lucide-react';
import { TradeCountdown } from './trade-countdown';
import { formatCurrency } from '@/lib/formatters';

export function GlobalTradeStatus() {
  const { isConnected, trades } = useWebSocket();
  const [isOpen, setIsOpen] = useState(false);
  
  // ฟิลเตอร์การเทรดที่กำลังดำเนินอยู่
  const activeTrades = trades.filter(trade => trade.status === 'active');
  
  // ถ้าไม่มีการเทรดใดๆ ให้ซ่อน component
  if (activeTrades.length === 0) {
    return null;
  }

  return (
    <>
      {/* แสดงสถานะการเทรดแบบลอย */}
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="bg-background/95 backdrop-blur-sm border shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              {/* สถานะการเชื่อมต่อ */}
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
              </div>
              
              {/* จำนวนการเทรดที่กำลังดำเนินอยู่ */}
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{activeTrades.length}</span>
                <span className="text-xs text-muted-foreground">trades</span>
              </div>
              
              {/* ปุ่มดูรายละเอียด */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="button-view-trades">
                    <Eye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-500" />
                      การเทรดที่กำลังดำเนินอยู่ ({activeTrades.length})
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* สถานะการเชื่อมต่อ */}
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      {isConnected ? (
                        <>
                          <Wifi className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">เชื่อมต่อ Real-time แล้ว</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600">ไม่สามารถเชื่อมต่อ Real-time ได้</span>
                        </>
                      )}
                    </div>
                    
                    {/* รายการการเทรด */}
                    {activeTrades.map((trade) => (
                      <Card key={trade.id} className="relative">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{trade.cryptoId?.toUpperCase()}</span>
                              <Badge variant={trade.direction === 'up' ? 'default' : 'destructive'}>
                                {trade.direction === 'up' ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {trade.direction === 'up' ? 'ขาขึ้น' : 'ขาลง'}
                              </Badge>
                            </div>
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              {Math.floor((trade.duration || 0) / 60)}:{String((trade.duration || 0) % 60).padStart(2, '0')}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">จำนวนเงิน:</span>
                              <div className="font-medium" data-testid={`text-amount-${trade.id}`}>
                                {formatCurrency(parseFloat(trade.amount || '0'))}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">ราคาเข้า:</span>
                              <div className="font-medium" data-testid={`text-entry-price-${trade.id}`}>
                                ${parseFloat(trade.entryPrice || '0').toLocaleString()}
                              </div>
                            </div>
                          </div>
                          
                          {/* Countdown timer */}
                          {trade.endTime && (
                            <div className="mt-4">
                              <TradeCountdown
                                duration={trade.duration || 60}
                                entryPrice={parseFloat(trade.entryPrice || '0')}
                                amount={parseFloat(trade.amount || '0')}
                                direction={trade.direction as "up" | "down"}
                                profitPercentage={parseInt(trade.profitPercentage || '30')}
                                cryptoSymbol={trade.cryptoId?.toUpperCase() || 'BTC'}
                                endTime={typeof trade.endTime === 'string' ? new Date(trade.endTime) : trade.endTime}
                                onComplete={() => {
                                  // อัปเดตข้อมูลหลังจากการเทรดเสร็จสิ้น
                                  console.log(`Trade ${trade.id} completed`);
                                }}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    
                    {activeTrades.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        ไม่มีการเทรดที่กำลังดำเนินอยู่
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}