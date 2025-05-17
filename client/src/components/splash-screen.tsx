import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
  minDisplayTime?: number;
}

export function SplashScreen({
  onComplete,
  minDisplayTime = 2000, // ลดเวลาเหลือ 2 วินาที
}: SplashScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    
    // จำลองการโหลดข้อมูลแบบมี Progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 200);
    
    // จำลองการโหลดข้อมูล
    const timer = setTimeout(() => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
      
      // ตรวจสอบว่าเวลาผ่านไปตาม minDisplayTime หรือยัง
      setTimeout(() => {
        setLoadingProgress(100);
        clearInterval(progressInterval);
        setIsLoading(false);
        onComplete();
      }, remainingTime);
    }, 800); // ลดเวลาในการรอใน timeout แรก
    
    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [onComplete, minDisplayTime]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden">
      <div 
        className="w-full h-full flex flex-col items-center justify-center relative"
        style={{
          background: "linear-gradient(135deg, #004d2e 0%, #00321e 100%)"
        }}
      >
        {/* พื้นหลังพิเศษมีลวดลาย */}
        <div className="absolute inset-0 overflow-hidden">
          {/* เส้นตาราง */}
          <div className="absolute inset-0 opacity-5">
            {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={`h-${i}`} 
                className="absolute bg-white h-px w-full left-0"
                style={{ top: `${i * 5}%` }}
              />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={`v-${i}`} 
                className="absolute bg-white w-px h-full top-0"
                style={{ left: `${i * 5}%` }}
              />
            ))}
          </div>
          
          {/* พาติเคิลแสงลอยขึ้น */}
          {Array.from({ length: 20 }).map((_, index) => (
            <div 
              key={`particle-${index}`} 
              className="absolute w-1 h-1 rounded-full bg-[#06C755]"
              style={{
                left: `${Math.random() * 100}%`,
                bottom: `-20px`,
                opacity: Math.random() * 0.5 + 0.1,
                transform: `scale(${Math.random() * 2 + 0.5})`,
                animation: `floatUp ${Math.random() * 10 + 10}s linear infinite`,
                animationDelay: `${Math.random() * 10}s`
              }}
            />
          ))}
        </div>
        
        {/* ลายเส้นกราฟิกแนวเฉียง */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          {Array.from({ length: 10 }).map((_, index) => (
            <div 
              key={index} 
              className="absolute bg-white" 
              style={{
                height: '2px',
                width: '100%',
                transform: `rotate(45deg) translateY(${index * 100 - 500}px)`,
                left: 0
              }}
            />
          ))}
        </div>
        
        {/* เอฟเฟกต์วงกลมเรืองแสง */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#06C755]/10 blur-3xl animate-pulse"></div>
        
        {/* โลโก้บิทคับแบบวงกลมที่คุณต้องการ */}
        <div className="relative mb-6">
          <div className="w-32 h-32 relative flex items-center justify-center">
            {/* เอฟเฟกต์เรืองแสงด้านหลัง */}
            <div className="absolute w-full h-full rounded-full bg-[#06C755]/30 blur-xl animate-pulse"></div>
            
            {/* โลโก้วงกลม */}
            <img 
              src="/images/bitkub-circle-logo.png" 
              alt="Bitkub Logo" 
              className="w-28 h-28 object-contain relative z-10 animate-pulse"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(6,199,85,0.5))'
              }}
            />
            
            {/* เอฟเฟกต์ประกายดาว */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="w-2 h-2 bg-white rounded-full opacity-80 animate-ping"></div>
            </div>
            
            {/* วงแหวนเรืองแสงรอบโลโก้ */}
            <div 
              className="absolute w-full h-full rounded-full border-2 border-[#06C755]/30"
              style={{
                animation: 'pulse 2s infinite'
              }}
            ></div>
            
            {/* วงแหวนด้านนอกที่หมุน */}
            <div 
              className="absolute w-36 h-36 rounded-full border border-[#06C755]/20"
              style={{
                animation: 'spin 10s linear infinite'
              }}
            ></div>
          </div>
        </div>
        
        <div className="text-white text-center mb-8">
          <h1 className="text-4xl font-bold mb-1" style={{ textShadow: '0 0 10px rgba(0,200,83,0.5)' }}>บิทคับ</h1>
          <p className="text-sm text-gray-300 tracking-widest">EXCHANGE</p>
        </div>
        
        <div className="mt-4 flex flex-col items-center w-80">
          {/* Progress bar แบบมี gradient และเอฟเฟกต์พิเศษ */}
          <div className="w-full bg-black/30 backdrop-blur-sm rounded-full h-3 mb-4 overflow-hidden" 
            style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)' }}>
            <div 
              className="h-3 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{ 
                width: `${loadingProgress}%`,
                background: 'linear-gradient(90deg, #08CC5E 0%, #06C755 100%)',
                boxShadow: '0 0 10px rgba(6,199,85,0.7)'
              }}
            >
              {/* เอฟเฟกต์เส้นแสงวิ่งผ่าน progress bar */}
              <div 
                className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{
                  animation: 'progressShine 1.5s linear infinite'
                }}
              ></div>
            </div>
          </div>
          
          {/* ไอคอนโหลดและข้อความ */}
          <div className="flex items-center justify-center w-full">
            <div className="relative mr-3">
              <Loader2 className="h-6 w-6 text-[#06C755] animate-spin" />
              <div className="absolute inset-0 rounded-full bg-[#06C755]/10 blur-md"></div>
            </div>
            <p className="text-white text-sm font-medium">
              กำลังโหลด... <span className="text-[#06C755]">{Math.round(loadingProgress)}%</span>
            </p>
          </div>
          
          {/* ใช้ style ของ React แทน JSX style */}
        </div>
        
        {/* เอฟเฟกต์แสงด้านล่าง */}
        <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-[#06C755]/20 to-transparent"></div>
      </div>
    </div>
  );
}