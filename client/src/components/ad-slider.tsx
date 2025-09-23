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

// Import รูปภาพจาก assets
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

export function AdSlider() {
  const [api, setApi] = useState<any>();
  const [activeIndex, setActiveIndex] = useState(0);
  
  // ใช้รูปภาพจาก Asia Plus Securities
  const imageArray = [
    { src: asiaPlus1, alt: "Asia Plus Securities - การลงทุนที่ให้ผลตอบแทนดี" },
    { src: asiaPlus2, alt: "Asia Plus Securities - บริการซื้อขายหลักทรัพย์" },
    { src: asiaPlus3, alt: "Asia Plus Securities - ปีเสือ SET ขึ้นเหนือ 1800 จุด" },
    { src: asiaPlus4, alt: "Asia Plus Securities - วิเคราะห์ตลาดหุ้น" },
    { src: asiaPlus5, alt: "Asia Plus Securities - แนวโน้มตลาดหุ้น" },
    { src: asiaPlus6, alt: "Asia Plus Securities - ที่ปรึกษาการลงทุนมืออาชีพ" },
    { src: asiaPlus7, alt: "Asia Plus Securities - โลโก้บริษัท" },
    { src: asiaPlus8, alt: "Asia Plus Securities - วิเคราะห์ตลาด" },
    { src: asiaPlus9, alt: "Asia Plus Securities - ข้อมูลการลงทุน" },
    { src: asiaPlus10, alt: "Asia Plus Securities - แนะนำ 7 หุ้นเด่น Q3" },
    { src: asiaPlus11, alt: "Asia Plus Securities - วิเคราะห์การลงทุน" }
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
                    e.currentTarget.src = asiaPlus1; 
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