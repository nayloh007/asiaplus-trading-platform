import { useState } from "react";
import { MobileContainer } from "@/components/layout/mobile-container";
import { TopNavigation } from "@/components/layout/top-navigation";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Share2, ChevronRight, Star, Newspaper, TrendingUp, Info, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

// รูปภาพที่ใช้ในข่าว
import passkey from "@assets/321.jpg";
import bitkubChain from "@assets/445.png";
import bitkubCEO from "@assets/1656586683_53839_Web_BK_011.png";
import bitkubCapital from "@assets/bitkub.jpg";
import bitkubBlockathon from "@assets/BITKUB-BLOCKATHON-2023-03112023.jpg";
import thbProgrammable from "@assets/Bitkub-Chain-เปิดทดสอบการใช้สื่อกลางการชำระเงิน.png";
import bitkubHowto from "@assets/hqdefault.jpg";
import bitkubNext from "@assets/OG_Bitkub_NEXT.png";
import bitkubKUB from "@assets/PJVlR0ljpN94J9mD9lBL1m6VWO6iyOPHweFucjic1Rv78JsXBJUQDWcx0x2hydrWCx.jpg";
import bitkubWallet from "@assets/XD_NEXT BA OG Tag 1200x800.png";
import bitkubCoin from "@assets/21-5-2564-7-53-43.png";
import bitkubListing from "@assets/u.png";

// ข้อมูลข่าวสารแบบ mock ชั่วคราว
const mockNews = [
  {
    id: 1,
    title: "Bitcoin (BTC) ทะลุ 80,000 ดอลลาร์แล้ว นักวิเคราะห์คาดอาจแตะ 100,000 ดอลลาร์ในปีนี้",
    summary: "Bitcoin ทำราคาสูงสุดใหม่ที่ 80,000 ดอลลาร์ หลังจากมีการปรับตัวในเชิงบวกอย่างต่อเนื่อง นักวิเคราะห์ชั้นนำคาดการณ์ว่าอาจจะแตะ 100,000 ดอลลาร์ภายในสิ้นปีนี้",
    imageUrl: bitkubCoin,
    date: "15 พ.ค. 2025",
    category: "market",
    isFeatured: true,
    isHot: true
  },
  {
    id: 2,
    title: "Ethereum (ETH) เตรียมปรับปรุงโปรโตคอลใหญ่ คาดว่าลดค่าธรรมเนียมได้ถึง 90%",
    summary: "Ethereum เตรียมอัปเดตโปรโตคอลครั้งใหญ่ซึ่งจะช่วยลดค่าธรรมเนียมการทำธุรกรรมลงได้ถึง 90% ผู้ใช้สามารถประหยัดเงินได้มากขึ้นในการใช้งานบนเครือข่าย",
    imageUrl: bitkubNext,
    date: "14 พ.ค. 2025",
    category: "tech",
    isFeatured: false,
    isHot: true
  },
  {
    id: 3,
    title: "Bitkub เปิดตัวฟีเจอร์ Passkey ใหม่ เพิ่มความปลอดภัยในการเข้าถึงบัญชี",
    summary: "Bitkub เตรียมเปิดตัวฟีเจอร์ Passkey ใหม่ที่รองรับการยืนยันตัวตนด้วยเทคโนโลยีสมัยใหม่ ช่วยให้ผู้ใช้สามารถเข้าถึงบัญชีได้อย่างปลอดภัยมากขึ้น",
    imageUrl: passkey,
    date: "12 พ.ค. 2025",
    category: "bitkub",
    isFeatured: true,
    isHot: false
  },
  {
    id: 4,
    title: "กระทรวงการคลังไทยเตรียมออกกฎหมายภาษี NFT และสินทรัพย์ดิจิทัล",
    summary: "กระทรวงการคลังไทยเตรียมออกกฎหมายภาษีสำหรับ NFT และสินทรัพย์ดิจิทัล คาดว่าจะมีผลบังคับใช้ในช่วงไตรมาสที่ 4 ของปีนี้ นักลงทุนควรเตรียมตัวรับมือ",
    imageUrl: bitkubCEO,
    date: "10 พ.ค. 2025",
    category: "regulation",
    isFeatured: false,
    isHot: false
  },
  {
    id: 5,
    title: "Bitkub Chain เปิดทดสอบการใช้ THB Programmable Payment บนบล็อกเชน",
    summary: "Bitkub Chain เปิดทดสอบการใช้ THB Programmable Payment ซึ่งเป็นสื่อกลางการชำระเงินด้วยเงินบาทบนระบบบล็อกเชน พร้อมให้ทดสอบการใช้งานภายในปี 2025",
    imageUrl: thbProgrammable,
    date: "8 พ.ค. 2025",
    category: "regulation",
    isFeatured: false,
    isHot: true
  },
  {
    id: 6,
    title: "Bitkub Exchange ประกาศเปิดเทรด Grass (GRASS) คริปโตน้องใหม่ล่าสุด",
    summary: "Bitkub Exchange ประกาศเปิดให้ฝาก-ถอน และเทรด Grass (GRASS) คริปโตเคอร์เรนซี่น้องใหม่ล่าสุด เริ่มฝาก-ถอนวันที่ 9 เมษายน และเปิดเทรด 10 เมษายน 2025",
    imageUrl: bitkubListing,
    date: "5 พ.ค. 2025",
    category: "market",
    isFeatured: false,
    isHot: false
  },
  {
    id: 7,
    title: "Bitkub จัดงาน BLOCKATHON 2023 ชวนนักพัฒนามาร่วมสร้างนวัตกรรมบล็อกเชน",
    summary: "Bitkub จัดงาน BLOCKATHON 2023 เชิญชวนนักพัฒนาและผู้สนใจเทคโนโลยีบล็อกเชนมาร่วมสร้างสรรค์นวัตกรรมและแอปพลิเคชันบนเครือข่าย Bitkub Chain",
    imageUrl: bitkubBlockathon,
    date: "3 พ.ค. 2025",
    category: "bitkub",
    isFeatured: true,
    isHot: false
  },
  {
    id: 8,
    title: "วิธีสมัคร Bitkub และยืนยันตัวตนล่าสุด 2024 แบบละเอียดทุกขั้นตอน",
    summary: "แนะนำวิธีการสมัครและยืนยันตัวตนบนแพลตฟอร์ม Bitkub แบบละเอียดทุกขั้นตอน อัปเดตล่าสุดปี 2024 สำหรับผู้ที่สนใจเริ่มต้นลงทุนในคริปโตเคอร์เรนซี่",
    imageUrl: bitkubHowto,
    date: "1 พ.ค. 2025",
    category: "market",
    isFeatured: false,
    isHot: true
  },
  {
    id: 9,
    title: "Bitkub เปลี่ยนชื่อ Bitkub Chain เป็น KUB พร้อมแผนพัฒนาเครือข่ายในอนาคต",
    summary: "Bitkub ประกาศเปลี่ยนชื่อ Bitkub Chain เป็น KUB อย่างเป็นทางการ พร้อมเผยแผนการพัฒนาเครือข่ายบล็อกเชนในอนาคตเพื่อรองรับการเติบโตของอุตสาหกรรมคริปโต",
    imageUrl: bitkubKUB,
    date: "30 เม.ย. 2025",
    category: "bitkub",
    isFeatured: false,
    isHot: true
  },
  {
    id: 10,
    title: "Bitkub NEXT เปิดตัว Digital Hub ศูนย์รวมบริการดิจิทัลครบวงจร",
    summary: "Bitkub NEXT เปิดตัวบริการ Digital Hub ศูนย์รวมบริการดิจิทัลครบวงจร ทั้งการลงทุน การเงิน และไลฟ์สไตล์ รองรับการใช้งานทั้งคริปโตและสินทรัพย์ดิจิทัลรูปแบบอื่น",
    imageUrl: bitkubWallet,
    date: "28 เม.ย. 2025",
    category: "bitkub",
    isFeatured: true,
    isHot: false
  }
];

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState("all");
  
  // กรองข่าวตามหมวดหมู่
  const filteredNews = activeTab === "all" 
    ? mockNews 
    : mockNews.filter(news => news.category === activeTab);
  
  // แยกข่าวที่แนะนำ
  const featuredNews = mockNews.filter(news => news.isFeatured);
  
  return (
    <MobileContainer>
      <TopNavigation title="ข่าวสารคริปโต" />
      
      <div className="pb-20 w-full">
        {/* แบนเนอร์ข่าวเด่น */}
        <div className="py-3 w-full">
          <h2 className="text-lg font-bold flex items-center mb-3 px-4">
            <Newspaper className="w-5 h-5 mr-2 text-primary" />
            ข่าวแนะนำ
          </h2>
          
          <div className="space-y-4 px-0">
            {featuredNews.map(news => (
              <Card key={news.id} className="overflow-hidden rounded-none border-x-0 shadow-none">
                <div className="relative h-48">
                  <img 
                    src={news.imageUrl} 
                    alt={news.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-lg line-clamp-2">{news.title}</h3>
                    <div className="flex items-center mt-2">
                      <Badge variant="secondary" className="mr-2">แนะนำ</Badge>
                      {news.isHot && <Badge variant="destructive">มาแรง</Badge>}
                      <div className="flex items-center text-white/80 ml-auto text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {news.date}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
        
        <Separator className="my-1" />
        
        {/* แท็บหมวดหมู่ข่าว */}
        <div className="w-full pt-2">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-4">
              <TabsList className="w-full flex overflow-x-auto mb-4">
                <TabsTrigger value="all" className="flex-1">ทั้งหมด</TabsTrigger>
                <TabsTrigger value="market" className="flex-1">ตลาด</TabsTrigger>
                <TabsTrigger value="tech" className="flex-1">เทคโนโลยี</TabsTrigger>
                <TabsTrigger value="regulation" className="flex-1">กฎหมาย</TabsTrigger>
                <TabsTrigger value="bitkub" className="flex-1">Bitkub</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              <div className="space-y-0">
                {filteredNews.map(news => (
                  <Card key={news.id} className="overflow-hidden rounded-none border-x-0 border-t-0 shadow-none">
                    <div className="flex p-4">
                      <div className="w-1/3 pr-3">
                        <div className="relative h-24 rounded-lg overflow-hidden">
                          <img 
                            src={news.imageUrl} 
                            alt={news.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="w-2/3">
                        <h3 className="font-bold line-clamp-2 text-sm">{news.title}</h3>
                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{news.summary}</p>
                        <div className="flex items-center mt-2">
                          <div className="flex items-center text-muted-foreground text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {news.date}
                          </div>
                          {news.isHot && (
                            <Badge variant="destructive" className="ml-2 text-[10px] h-5">
                              <TrendingUp className="w-3 h-3 mr-1" /> มาแรง
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="px-4 mt-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <Info className="w-4 h-4 mr-2" />
                เกี่ยวกับข่าวสาร
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                ข่าวสารจะได้รับการอัพเดททุกวัน เพื่อให้คุณได้ทันต่อสถานการณ์ตลาดคริปโตเคอร์เรนซี่และข่าวสารล่าสุดเกี่ยวกับ Bitkub
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="px-4 mt-4 mb-6">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center text-yellow-700">
                <Lightbulb className="w-4 h-4 mr-2" />
                คำแนะนำสำหรับนักลงทุน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-yellow-700/80">
                ควรศึกษาข้อมูลและข่าวสารให้รอบด้านก่อนตัดสินใจลงทุน การลงทุนมีความเสี่ยง ผู้ลงทุนควรทำความเข้าใจก่อนตัดสินใจลงทุน
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <BottomNavigation />
    </MobileContainer>
  );
}