import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function AdSlider() {
  const [api, setApi] = useState<any>();
  const [activeIndex, setActiveIndex] = useState(0);
  
  // ใช้รูปภาพจาก Asia Plus Securities
  const imageArray = [
    { src: "https://static.thairath.co.th/media/dFQROr7oWzulq5Fa5LFdxcIa26hqueL6RwsHNPI4t2aRVd94wvZ5IS9p2D9KZtf8Vsg.jpg", alt: "Asia Plus Securities - การลงทุนที่ให้ผลตอบแทนดี" },
    { src: "https://www.thunkhaotoday.com/storage/news/investing/2022/08/20220817-a-cover.jpg", alt: "Asia Plus Securities - บริการซื้อขายหลักทรัพย์" },
    { src: "https://www.thaipr.net/wp-content/uploads/2022/01/%E0%B8%9E%E0%B8%9A%E0%B8%AA%E0%B8%B7%E0%B9%88%E0%B8%AD-Q1-65-%E0%B8%8A%E0%B9%88%E0%B8%A7%E0%B8%87%E0%B8%97%E0%B8%B5%E0%B9%881-e1641968185261.jpg", alt: "Asia Plus Securities - ปีเสือ SET ขึ้นเหนือ 1800 จุด" },
    { src: "https://image.bangkokbiznews.com/image/kt/media/image/news/2021/07/01/946462/750x422_946462_1625117217.jpeg", alt: "Asia Plus Securities - วิเคราะห์ตลาดหุ้น" },
    { src: "https://thunhoon.com/cache/image/article/286253/5dcbcebb-08cf-4271-b8dc-c6f73ad3d544.jpeg", alt: "Asia Plus Securities - แนวโน้มตลาดหุ้น" },
    { src: "https://www.kaohoon.com/wp-content/uploads/2020/07/ASP.jpg", alt: "Asia Plus Securities - ที่ปรึกษาการลงทุนมืออาชีพ" },
    { src: "https://www.tnnthailand.com/static/2025/a3723684-c60a-409c-bb99-408c85902672.webp", alt: "Asia Plus Securities - โลโก้บริษัท" },
    { src: "https://image.bangkokbiznews.com/uploads/images/md/2024/04/gR8QI0ZY9LXIUopdOXvc.webp?x-image-process=style/LG", alt: "Asia Plus Securities - วิเคราะห์ตลาด" },
    { src: "https://today-obs.line-scdn.net/0hF_f8PVppGXBbQQm8TQpmJ2MXFQFoJwN5eSRWH34RT0FybQslYi9KE3ZHR1x_d1wmeyBVECxDRhd1eVpxMw/w644", alt: "Asia Plus Securities - ข้อมูลการลงทุน" },
    { src: "https://www.kaohoon.com/wp-content/uploads/2022/07/%E0%B8%AD%E0%B9%80%E0%B8%8B%E0%B8%B5%E0%B8%A2%E0%B8%9E%E0%B8%A5%E0%B8%B1%E0%B8%AA-%E0%B9%81%E0%B8%99%E0%B8%B0%E0%B8%AA%E0%B8%AD%E0%B8%A2-7-%E0%B8%AB%E0%B8%B8%E0%B9%89%E0%B8%99%E0%B9%80%E0%B8%94%E0%B9%88%E0%B8%99-Q3-%E0%B8%A3%E0%B8%B1%E0%B8%9A%E0%B8%94%E0%B8%AD%E0%B8%81%E0%B9%80%E0%B8%9A%E0%B8%B5%E0%B9%89%E0%B8%A2%E0%B8%82%E0%B8%B2.jpeg", alt: "Asia Plus Securities - แนะนำ 7 หุ้นเด่น Q3" },
    { src: "https://www.prachachat.net/wp-content/uploads/2025/03/cover-2025-03-12T160142.887-728x485.jpg", alt: "Asia Plus Securities - วิเคราะห์การลงทุน" }
  ];

  useEffect(() => {
    if (!api) return;
    
    // เมื่อมีการเปลี่ยนแปลงใน active slide ของ Carousel, อัพเดท activeIndex
    const onSelect = () => {
      if (!api) return;
      setActiveIndex(api.selectedScrollSnap());
    };
    
    api.on("select", onSelect);
    
    // Auto-advance slides
    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);
    
    return () => {
      api.off("select", onSelect);
      clearInterval(interval);
    };
  }, [api]);

  // เมื่อ activeIndex เปลี่ยน ให้เลื่อนไปยัง slide นั้น
  useEffect(() => {
    if (!api) return;
    api.scrollTo(activeIndex);
  }, [activeIndex, api]);

  return (
    <div className="w-full">
      <Carousel
        className="w-full relative"
        setApi={setApi}
        opts={{ loop: true }}>
        <CarouselContent>
          {imageArray.map((image, index) => (
            <CarouselItem key={index}>
              <div className="overflow-hidden rounded-lg shadow-lg">
                <img 
                  src={image.src} 
                  alt={image.alt}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    console.error(`Failed to load image: ${image.src}`);
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://www.asiaplus.co.th/images/logo/symbol/original/1587976780795.png"; 
                  }}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="flex justify-center mt-4">
          <div className="flex space-x-1.5">
            {imageArray.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  activeIndex === index ? "bg-primary w-3" : "bg-gray-300"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        {/* ปุ่มนำทางถูกลบออกตามความต้องการของผู้ใช้ */}
      </Carousel>
    </div>
  );
}