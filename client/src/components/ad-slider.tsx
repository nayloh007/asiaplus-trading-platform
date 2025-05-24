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
  
  const imageArray = [
    { src: "/d.jpg", alt: "Fibonacci คืออะไร" },
    { src: "/e.png", alt: "ระวังแอพปลอม Bitkub Desktop" },
    { src: "/f.jpg", alt: "วิธีโอนเหรียญมาไว้ที่ Bitkub Exchange" },
    { src: "/g.jpg", alt: "Bitcoin Halving คืออะไร?" },
    { src: "/h.png", alt: "แหล่งความรู้มือใหม่หัดลงทุน" },
    { src: "/i.png", alt: "New Listing Plume (PLUME)" },
    { src: "/o.png", alt: "New Listing XDC Network (XDC)" },
    { src: "/p.png", alt: "รวมข่าวเด่นประจำสัปดาห์" },
    { src: "/q.png", alt: "Bitkub x XDC: Vision Day" },
    { src: "/r.png", alt: "Proof of Reserve" },
    { src: "/s.jpg", alt: "ภัยคุกคามประเภทฟิชชิ่ง" },
    { src: "/t.jpg", alt: "บิทคับ เอ็กซ์เชนจ์ Call Center 1518" }
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