import { useState, useEffect } from "react";
import { MobileContainer } from "@/components/layout/mobile-container";
import { TopNavigation } from "@/components/layout/top-navigation";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { useLocation } from "wouter";
import { CryptoList } from "@/components/crypto-list";
import { CryptoCurrency } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { MarketBarChart } from "@/components/ui/market-bar-chart";
import { AdSlider } from "@/components/ad-slider";

export default function HomePage() {
  const [, navigate] = useLocation();
  const [greeting, setGreeting] = useState("สวัสดี");
  
  // กำหนดคำทักทายตามเวลา
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("สวัสดียามเช้า");
    } else if (hour >= 12 && hour < 18) {
      setGreeting("สวัสดียามบ่าย");
    } else {
      setGreeting("สวัสดียามค่ำ");
    }
  }, []);
  
  // ดึงข้อมูล crypto จาก API
  const { data: cryptos } = useQuery<CryptoCurrency[]>({
    queryKey: ["/api/crypto/market"],
  });
  
  const handleSelectCrypto = (crypto: CryptoCurrency) => {
    navigate(`/trade?id=${crypto.id}`);
  };
  
  // นับจำนวน crypto ที่ราคาขึ้น/ลง
  const marketStats = {
    up: cryptos?.filter(c => c.price_change_percentage_24h > 0).length || 0,
    down: cryptos?.filter(c => c.price_change_percentage_24h < 0).length || 0,
    total: cryptos?.length || 0
  };
  
  return (
    <MobileContainer>
      <div className="pb-20">
        <TopNavigation />
        
        {/* ส่วนต้อนรับผู้ใช้ */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5">
          {/* สไลด์โฆษณา */}
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mt-3 w-full"
          >
            <AdSlider />
          </motion.div>
        </div>
        

        
        {/* รายชื่อคริปโตทั้งหมด */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6 w-full"
        >
          <Separator className="mb-0" />
          <div className="bg-black dark:bg-gray-900 text-white p-3">
            <h2 className="font-semibold">รายชื่อคริปโตทั้งหมด</h2>
          </div>
          
          <div className="px-0">
            <CryptoList 
              onSelectCrypto={handleSelectCrypto}
            />
          </div>
        </motion.div>
      </div>
      
      <BottomNavigation />
    </MobileContainer>
  );
}
