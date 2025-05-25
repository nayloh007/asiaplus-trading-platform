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
    { src: "assets/20220817-a-cover.jpg", alt: "Asia Plus Securities - การลงทุนที่ให้ผลตอบแทนดี" },
    { src: "assets/a3723684-c60a-409c-bb99-408c85902672.webp", alt: "Asia Plus Securities - บริการซื้อขายหลักทรัพย์" },
    { src: "assets/ASP.jpg", alt: "Asia Plus Securities - ที่ปรึกษาการลงทุนมืออาชีพ" },
    { src: "assets/gR8QI0ZY9LXIUopdOXvc.jpg", alt: "Asia Plus Securities - ติดตามการลงทุนอย่างใกล้ชิด" },
    { src: "assets/gVPK6VaFv8EDKlvFu0Ae.webp", alt: "Asia Plus Securities - เทคโนโลยีการลงทุนสมัยใหม่" },
    { src: "assets/w644 (2).jpg", alt: "Asia Plus Securities - วิเคราะห์การลงทุนอย่างแม่นยำ" },
    { src: "assets/พบสื่อ-Q1-65-ช่วงที่1-e1641968185261.jpg", alt: "Asia Plus Securities - ปีเสือ SET ขึ้นเหนือ 1800 จุด" }
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
                  className="w-full h-auto object-cover"
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