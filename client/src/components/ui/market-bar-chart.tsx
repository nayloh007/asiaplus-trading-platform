import { useState } from "react";
import { Card } from "@/components/ui/card";

interface MarketBarChartProps {
  upCount: number;
  downCount: number;
  totalCount: number;
}

export function MarketBarChart({ upCount, downCount, totalCount }: MarketBarChartProps) {
  const upPercentage = totalCount ? (upCount / totalCount) * 100 : 0;
  const downPercentage = totalCount ? (downCount / totalCount) * 100 : 0;
  
  return (
    <div className="mt-3">
      <div className="flex text-xs mb-1 justify-between">
        <span className="text-[hsl(var(--chart-1))]">{upPercentage.toFixed(0)}%</span>
        <span className="text-destructive">{downPercentage.toFixed(0)}%</span>
      </div>
      <div className="w-full h-2 bg-card border border-border rounded-full overflow-hidden flex">
        <div 
          className="h-full bg-[hsl(var(--chart-1))]"
          style={{ width: `${upPercentage}%` }}
        />
        <div 
          className="h-full bg-destructive"
          style={{ width: `${downPercentage}%` }}
        />
      </div>
    </div>
  );
}