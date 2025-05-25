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

// รูปภาพที่ใช้ในข่าว - placeholder
import placeholderImage from "@/assets/placeholder.svg";

// รูปภาพจาก Asia Plus Securities
import asiaPlus1 from "@assets/462601494_2872254826265363_8039408733850352485_n.png";
import asiaPlus2 from "@assets/462884981_2876000042557508_8492050558665398215_n.jpg";
import asiaPlus3 from "@assets/463194602_2877123072445205_400290765798955497_n.png";
import asiaPlus4 from "@assets/463199942_2878974105593435_496135016965127313_n.png";
import asiaPlus5 from "@assets/463883305_2883588198465359_7359262269516360381_n.png";
import asiaPlus6 from "@assets/469260309_2928765837280928_8586244591954648374_n.png";
import asiaPlus7 from "@assets/475770537_2978550502302461_2285734999134478019_n.png";
import asiaPlus8 from "@assets/481193256_3003680446456133_1544279445465180161_n.jpg";
import asiaPlus9 from "@assets/481247539_3003680433122801_4202088951531435287_n.jpg";
import asiaPlus10 from "@assets/481265377_3001713059986205_2798521872516734220_n.jpg";
import asiaPlus11 from "@assets/485370924_3024524554371722_736050699631465514_n.jpg";
import asiaPlus12 from "@assets/35301242_1006247372866127_4893868337596989440_n.png";

// ข้อมูลข่าวสารแบบ mock ชั่วคราว
const mockNews = [
  {
    id: 1,
    title: "Bitcoin (BTC) ทะลุ 80,000 ดอลลาร์แล้ว นักวิเคราะห์คาดอาจแตะ 100,000 ดอลลาร์ในปีนี้",
    summary: "Bitcoin ทำราคาสูงสุดใหม่ที่ 80,000 ดอลลาร์ หลังจากมีการปรับตัวในเชิงบวกอย่างต่อเนื่อง นักวิเคราะห์ชั้นนำคาดการณ์ว่าอาจจะแตะ 100,000 ดอลลาร์ภายในสิ้นปีนี้",
    imageUrl: asiaPlus8,
    date: "15 พ.ค. 2025",
    category: "market",
    isFeatured: true,
    isHot: true
  },
  {
    id: 2,
    title: "Ethereum (ETH) เตรียมปรับปรุงโปรโตคอลใหญ่ คาดว่าลดค่าธรรมเนียมได้ถึง 90%",
    summary: "Ethereum เตรียมอัปเดตโปรโตคอลครั้งใหญ่ซึ่งจะช่วยลดค่าธรรมเนียมการทำธุรกรรมลงได้ถึง 90% ผู้ใช้สามารถประหยัดเงินได้มากขึ้นในการใช้งานบนเครือข่าย",
    imageUrl: asiaPlus9,
    date: "14 พ.ค. 2025",
    category: "tech",
    isFeatured: false,
    isHot: true
  },
  {
    id: 3,
    title: "เอเซีย พลัส เปิดตัวฟีเจอร์ใหม่ เพิ่มความปลอดภัยในการเข้าถึงบัญชี",
    summary: "เอเซีย พลัส เตรียมเปิดตัวฟีเจอร์ใหม่ที่รองรับการยืนยันตัวตนด้วยเทคโนโลยีสมัยใหม่ ช่วยให้ผู้ใช้สามารถเข้าถึงบัญชีได้อย่างปลอดภัยมากขึ้น",
    imageUrl: asiaPlus11,
    date: "12 พ.ค. 2025",
    category: "asiap",
    isFeatured: true,
    isHot: false
  },
  {
    id: 4,
    title: "กระทรวงการคลังไทยเตรียมออกกฎหมายภาษี NFT และสินทรัพย์ดิจิทัล",
    summary: "กระทรวงการคลังไทยเตรียมออกกฎหมายภาษีสำหรับ NFT และสินทรัพย์ดิจิทัล คาดว่าจะมีผลบังคับใช้ในช่วงไตรมาสที่ 4 ของปีนี้ นักลงทุนควรเตรียมตัวรับมือ",
    imageUrl: asiaPlus5,
    date: "10 พ.ค. 2025",
    category: "regulation",
    isFeatured: false,
    isHot: false
  },
  {
    id: 5,
    title: "เอเซีย พลัส Chain เปิดทดสอบการใช้ THB Programmable Payment บนบล็อกเชน",
    summary: "เอเซีย พลัส Chain เปิดทดสอบการใช้ THB Programmable Payment ซึ่งเป็นสื่อกลางการชำระเงินด้วยเงินบาทบนระบบบล็อกเชน พร้อมให้ทดสอบการใช้งานภายในปี 2025",
    imageUrl: asiaPlus1,
    date: "8 พ.ค. 2025",
    category: "regulation",
    isFeatured: false,
    isHot: true
  },
  {
    id: 6,
    title: "เอเซีย พลัส Exchange ประกาศเปิดเทรด Grass (GRASS) คริปโตน้องใหม่ล่าสุด",
    summary: "เอเซีย พลัส Exchange ประกาศเปิดให้ฝาก-ถอน และเทรด Grass (GRASS) คริปโตเคอร์เรนซี่น้องใหม่ล่าสุด เริ่มฝาก-ถอนวันที่ 9 เมษายน และเปิดเทรด 10 เมษายน 2025",
    imageUrl: asiaPlus3,
    date: "5 พ.ค. 2025",
    category: "market",
    isFeatured: false,
    isHot: false
  },
  {
    id: 7,
    title: "เอเซีย พลัส จัดงาน BLOCKATHON 2023 ชวนนักพัฒนามาร่วมสร้างนวัตกรรมบล็อกเชน",
    summary: "เอเซีย พลัส จัดงาน BLOCKATHON 2023 เชิญชวนนักพัฒนาและผู้สนใจเทคโนโลยีบล็อกเชนมาร่วมสร้างสรรค์นวัตกรรมและแอปพลิเคชันบนเครือข่าย เอเซีย พลัส Chain",
    imageUrl: asiaPlus4,
    date: "3 พ.ค. 2025",
    category: "asiap",
    isFeatured: true,
    isHot: false
  },
  {
    id: 8,
    title: "วิธีสมัคร เอเซีย พลัส และยืนยันตัวตนล่าสุด 2024 แบบละเอียดทุกขั้นตอน",
    summary: "แนะนำวิธีการสมัครและยืนยันตัวตนบนแพลตฟอร์ม เอเซีย พลัส แบบละเอียดทุกขั้นตอน อัปเดตล่าสุดปี 2024 สำหรับผู้ที่สนใจเริ่มต้นลงทุนในคริปโตเคอร์เรนซี่",
    imageUrl: asiaPlus2,
    date: "1 พ.ค. 2025",
    category: "market",
    isFeatured: false,
    isHot: true
  },
  {
    id: 9,
    title: "เอเซีย พลัส เตรียมเปิดตัวแอปพลิเคชันใหม่ ASP Smart พร้อมฟีเจอร์ที่น่าสนใจ",
    summary: "เอเซีย พลัส ประกาศเตรียมเปิดตัวแอปพลิเคชันใหม่ ASP Smart ที่มีฟีเจอร์การวิเคราะห์ตลาดขั้นสูง พร้อมให้ผู้ใช้สามารถเข้าถึงการเทรดได้ทุกที่ทุกเวลา",
    imageUrl: asiaPlus2,
    date: "30 เม.ย. 2025",
    category: "asiap",
    isFeatured: false,
    isHot: true
  },
  {
    id: 10,
    title: "เอเซีย พลัส NEXT เปิดตัว Digital Hub ศูนย์รวมบริการดิจิทัลครบวงจร",
    summary: "เอเซีย พลัส NEXT เปิดตัวบริการ Digital Hub ศูนย์รวมบริการดิจิทัลครบวงจร ทั้งการลงทุน การเงิน และไลฟ์สไตล์ รองรับการใช้งานทั้งคริปโตและสินทรัพย์ดิจิทัลรูปแบบอื่น",
    imageUrl: asiaPlus6,
    date: "28 เม.ย. 2025",
    category: "asiap",
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