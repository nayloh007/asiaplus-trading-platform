import { useEffect, useRef } from 'react';

interface ChartComponentProps {
  data: number[];
  width?: number;
  height?: number;
  isPriceUp?: boolean;
  className?: string;
}

export function ChartComponent({ 
  data, 
  width = 100, 
  height = 40, 
  isPriceUp = true,
  className = ""
}: ChartComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
    
    if (isPriceUp) {
      gradient.addColorStop(0, 'rgba(0, 200, 83, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 200, 83, 0)');
      ctx.strokeStyle = 'hsl(var(--chart-1))';
    } else {
      gradient.addColorStop(0, 'rgba(255, 61, 0, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 61, 0, 0)');
      ctx.strokeStyle = 'hsl(var(--destructive))';
    }
    
    ctx.beginPath();
    
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const range = maxValue - minValue;
    
    // Calculate points
    const step = rect.width / (data.length - 1);
    
    data.forEach((value, i) => {
      const x = i * step;
      let y;
      
      if (range === 0) {
        // If all values are the same, draw a straight line in the middle
        y = rect.height / 2;
      } else {
        // Normalize the data
        y = rect.height - ((value - minValue) / range) * rect.height;
      }
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    // Fill area under the line
    ctx.lineTo(rect.width, rect.height);
    ctx.lineTo(0, rect.height);
    ctx.fillStyle = gradient;
    ctx.fill();
  }, [data, isPriceUp]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className={className} 
    />
  );
}
