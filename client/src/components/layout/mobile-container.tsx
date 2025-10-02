import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileContainerProps {
  children: ReactNode;
  className?: string;
}

export function MobileContainer({ children, className }: MobileContainerProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-background flex justify-center w-full">
      <div 
        className={cn(
          "min-h-screen w-full max-w-md bg-background relative",
          !isMobile && "shadow-xl",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
