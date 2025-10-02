import { ReactNode } from "react";

interface DesktopContainerProps {
  children: ReactNode;
}

export function DesktopContainer({ children }: DesktopContainerProps) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}