import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { TopNavigation } from "@/components/layout/top-navigation";
import { MobileContainer } from "@/components/layout/mobile-container";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatShortDate } from "@/lib/formatters";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trade } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function TradeHistoryPage() {
  const { user } = useAuth();
  
  // ดึงข้อมูลประวัติการเทรด
  const { 
    data: trades,
    isLoading: isLoadingTrades,
    error: tradesError 
  } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
    refetchInterval: 15000, // รีเฟรชทุก 15 วินาที เพื่อติดตามสถานะ
  });

  // ฟังก์ชันแปลงผลลัพธ์ให้เป็นภาษาไทย
  const getResultText = (result: string | null | undefined) => {
    if (!result) return "";
    switch (result) {
      case "win": return "ชนะ";
      case "lose": return "แพ้";
      case "draw": return "เสมอ";
      default: return result;
    }
  };
  
  // ฟังก์ชันแปลงสถานะให้เป็นภาษาไทย
  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "กำลังทำรายการ";
      case "completed": return "เสร็จสิ้น";
      case "cancelled": return "ยกเลิก";
      default: return status;
    }
  };
  
  // ฟังก์ชันแปลงทิศทางเป็นภาษาไทย
  const getDirectionText = (direction: string) => {
    return direction === "up" ? "ขึ้น" : "ลง";
  };
  
  // ฟังก์ชันแปลงระยะเวลาเป็นรูปแบบที่อ่านง่าย
  const formatDuration = (duration: string | number) => {
    let seconds: number;
    
    // ตรวจสอบประเภทของข้อมูลที่ได้รับ
    if (typeof duration === 'number') {
      // กรณีที่เป็นตัวเลขวินาที
      seconds = duration;
    } else if (typeof duration === 'string') {
      // กรณีที่เป็นสตริง ตรวจสอบว่าลงท้ายด้วย 'S' หรือไม่
      if (duration.endsWith('S')) {
        seconds = parseInt(duration.replace('S', ''));
      } else {
        // พยายามแปลงเป็นตัวเลข
        seconds = parseInt(duration);
      }
    } else {
      return 'ไม่ระบุ';
    }
    
    // ตรวจสอบว่าการแปลงเป็นตัวเลขสำเร็จหรือไม่
    if (isNaN(seconds)) {
      return 'ไม่ระบุ';
    }
    
    // แปลงเป็นรูปแบบนาที:วินาที
    if (seconds < 60) {
      return `${seconds} วินาที`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 
        ? `${minutes} นาที ${remainingSeconds} วินาที` 
        : `${minutes} นาที`;
    }
  };

  return (
    <MobileContainer>
      <TopNavigation title="ประวัติการเทรด" showBackButton />
      
      <div className="flex-1 overflow-y-auto">
        <Card className="rounded-none border-x-0 shadow-none">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">ประวัติการเทรด</h3>
            
            {isLoadingTrades ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : tradesError ? (
              <div className="text-center text-red-500 py-8">
                เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง
              </div>
            ) : trades && trades.length > 0 ? (
              <div>
                {/* แยกการเทรดเป็น 3 แท็บ */}
                <Tabs defaultValue="all" className="mb-4">
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
                    <TabsTrigger value="active">กำลังทำรายการ</TabsTrigger>
                    <TabsTrigger value="completed">เสร็จสิ้น</TabsTrigger>
                  </TabsList>

                  {/* แท็บแสดงธุรกรรมทั้งหมด */}
                  <TabsContent value="all" className="space-y-3 mt-2">
                    {[...trades].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((trade) => (
                      <div key={trade.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            {trade.direction === "up" ? (
                              <div className="rounded-full bg-green-100 p-2 mr-3">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              </div>
                            ) : (
                              <div className="rounded-full bg-red-100 p-2 mr-3">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">
                                {trade.cryptoId.charAt(0).toUpperCase() + trade.cryptoId.slice(1)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatShortDate(trade.createdAt)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              ฿{parseFloat(trade.amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <Badge 
                              className={`mt-1 ${
                                trade.result === "win" ? "bg-green-500 hover:bg-green-600 text-white" : 
                                trade.result === "lose" ? "bg-red-500 hover:bg-red-600 text-white" : ""
                              }`}
                              variant={
                                trade.status === "active" ? "outline" :
                                trade.result === "win" ? "default" :
                                trade.result === "lose" ? "destructive" : "secondary"
                              }
                            >
                              {trade.status === "active" ? getStatusText(trade.status) : getResultText(trade.result)}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2 text-sm grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-muted-foreground">ทิศทาง:</span> {getDirectionText(trade.direction)}
                          </div>
                          <div>
                            <span className="text-muted-foreground">ราคาเข้า:</span> {formatCurrency(parseFloat(trade.entryPrice))}
                          </div>
                          <div>
                            <span className="text-muted-foreground">ระยะเวลา:</span> {formatDuration(trade.duration)}
                          </div>
                          {trade.result && (
                            <div>
                              <span className="text-muted-foreground">สถานะ:</span> {getResultText(trade.result)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  {/* แท็บแสดงเฉพาะการเทรดที่กำลังทำรายการ */}
                  <TabsContent value="active" className="space-y-3 mt-2">
                    {trades
                      .filter((trade) => trade.status === "active")
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((trade) => (
                        <div key={trade.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              {trade.direction === "up" ? (
                                <div className="rounded-full bg-green-100 p-2 mr-3">
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                </div>
                              ) : (
                                <div className="rounded-full bg-red-100 p-2 mr-3">
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">
                                  {trade.cryptoId.charAt(0).toUpperCase() + trade.cryptoId.slice(1)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatShortDate(trade.createdAt)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                ฿{parseFloat(trade.amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <Badge variant="outline">
                                {getStatusText(trade.status)}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-2 text-sm grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-muted-foreground">ทิศทาง:</span> {getDirectionText(trade.direction)}
                            </div>
                            <div>
                              <span className="text-muted-foreground">ราคาเข้า:</span> {formatCurrency(parseFloat(trade.entryPrice))}
                            </div>
                            <div>
                              <span className="text-muted-foreground">ระยะเวลา:</span> {formatDuration(trade.duration)}
                            </div>
                          </div>
                        </div>
                      ))}
                      {trades.filter(t => t.status === "active").length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          ไม่มีรายการที่กำลังทำรายการอยู่
                        </div>
                      )}
                  </TabsContent>

                  {/* แท็บแสดงเฉพาะการเทรดที่เสร็จสิ้น */}
                  <TabsContent value="completed" className="space-y-3 mt-2">
                    {trades
                      .filter((trade) => trade.status === "completed")
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((trade) => (
                        <div key={trade.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              {trade.direction === "up" ? (
                                <div className="rounded-full bg-green-100 p-2 mr-3">
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                </div>
                              ) : (
                                <div className="rounded-full bg-red-100 p-2 mr-3">
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">
                                  {trade.cryptoId.charAt(0).toUpperCase() + trade.cryptoId.slice(1)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatShortDate(trade.createdAt)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                ฿{parseFloat(trade.amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <Badge 
                                className={`mt-1 ${
                                  trade.result === "win" ? "bg-green-500 hover:bg-green-600 text-white" : 
                                  trade.result === "lose" ? "bg-red-500 hover:bg-red-600 text-white" : ""
                                }`}
                                variant={
                                  trade.result === "win" ? "default" :
                                  trade.result === "lose" ? "destructive" : "secondary"
                                }
                              >
                                {getResultText(trade.result)}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-2 text-sm grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-muted-foreground">ทิศทาง:</span> {getDirectionText(trade.direction)}
                            </div>
                            <div>
                              <span className="text-muted-foreground">ราคาเข้า:</span> {formatCurrency(parseFloat(trade.entryPrice))}
                            </div>
                            <div>
                              <span className="text-muted-foreground">ระยะเวลา:</span> {formatDuration(trade.duration)}
                            </div>
                            <div>
                              <span className="text-muted-foreground">สถานะ:</span> {getResultText(trade.result)}
                            </div>
                          </div>
                        </div>
                      ))}
                      {trades.filter(t => t.status === "completed").length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          ไม่มีประวัติการเทรดที่เสร็จสิ้น
                        </div>
                      )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                ไม่มีประวัติการเทรด
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation />
    </MobileContainer>
  );
}