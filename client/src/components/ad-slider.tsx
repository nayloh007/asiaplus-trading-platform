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

// ใช้ URL โดยตรงแทนการ import
export function AdSlider() {
  const [api, setApi] = useState<any>();
  const [activeIndex, setActiveIndex] = useState(0);
  
  // ใช้รูปภาพจาก assets โดยตรง
  const imageArray = [
    { src: "/assets/1.jpg", alt: "รูปภาพสไลด์ 1" },
    { src: "/assets/2.jpg", alt: "รูปภาพสไลด์ 2" },
    { src: "/assets/3.jpg", alt: "รูปภาพสไลด์ 3" },
    { src: "/assets/4.jpg", alt: "รูปภาพสไลด์ 4" },
    { src: "/assets/5.jpg", alt: "รูปภาพสไลด์ 5" },
    { src: "/assets/6.jpg", alt: "รูปภาพสไลด์ 6" },
    { src: "/assets/7.jpg", alt: "รูปภาพสไลด์ 7" },
    { src: "/assets/8.jpg", alt: "รูปภาพสไลด์ 8" },
    { src: "/assets/9.jpg", alt: "รูปภาพสไลด์ 9" }
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
                    e.currentTarget.src = slide1; 
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