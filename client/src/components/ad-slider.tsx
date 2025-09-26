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

// Import รูปภาพจาก assets (ใช้ WebP ที่ปรับปรุงแล้ว)
import aspSlide1 from "@/assets/ASP.jpg";
import aspSlide2 from "@/assets/เอเซีย-พลัส_1758695663097.jpg";
import aspSlide3 from "@/assets/9e580530fe2e1b35827f96b7f38b3804_1758695673871.jpg";
import aspSlide4 from "@/assets/w644 (1)_1758695727957.jpg";
import aspSlide5 from "@/assets/gVPK6VaFv8EDKlvFu0Ae_1758695731786.webp";
import aspSlide6 from "@/assets/Asia-Plus-Securities_1758695735624.jpg";

export function AdSlider() {
  const [api, setApi] = useState<any>();
  const [activeIndex, setActiveIndex] = useState(0);
  
  // ใช้รูปภาพใหม่จาก Asia Plus Securities
  const imageArray = [
    { src: aspSlide1, alt: "Asia Plus Securities - ที่ปรึกษาการลงทุนมืออาชีพ" },
    { src: aspSlide2, alt: "Asia Plus Securities - เทคโนโลยีการลงทุนสมัยใหม่" },
    { src: aspSlide3, alt: "Asia Plus Securities - ส่อง 15 หุ้นไทย ต่างชาติซื้อขายมากสุดในปี 67" },
    { src: aspSlide4, alt: "Asia Plus Securities - เอเชียพลัส ส่องกำไรกู้วิกฤติ ซื้อเหมาะเทนตรอลหาร์ ชู Top Pick" },
    { src: aspSlide5, alt: "Asia Plus Securities - การลงทุนอัจฉริยะด้วยเทคโนโลยี" },
    { src: aspSlide6, alt: "Asia Plus Securities - วิเคราะห์ตลาดหุ้นด้วยข้อมูลแม่นยำ" }
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
                    console.error(`Failed to load image: ${image.alt}`);
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = aspSlide1; 
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