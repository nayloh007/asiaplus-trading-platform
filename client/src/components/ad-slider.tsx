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
    { src: "/images/Asia_Plus_Securities.png", alt: "Asia Plus Securities - การลงทุนที่ให้ผลตอบแทนดี" },
    { src: "/images/asia_plus_logo.png", alt: "Asia Plus Securities - บริการซื้อขายหลักทรัพย์" },
    { src: "/images/asiaplus-circle-logo.png", alt: "Asia Plus Securities - ที่ปรึกษาการลงทุนมืออาชีพ" },
    { src: "/images/asiaplus-circle-logo.svg", alt: "Asia Plus Securities - เทคโนโลยีการลงทุนสมัยใหม่" }
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
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    console.error(`Failed to load image: ${image.src}`);
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/images/asiaplus-circle-logo.png"; 
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