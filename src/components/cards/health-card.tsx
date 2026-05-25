"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HealthCardProps {
  title: string;
  value: string;
  subValue?: string;
  percentage: number;
  status?: "Healthy" | "Warning" | "Critical";
  className?: string;
}

export default function HealthCard({
  title,
  value,
  subValue,
  percentage,
  status,
  className,
}: HealthCardProps) {
  const barColor = status === "Warning" ? "bg-primary" : "bg-green";
  const textColor = status === "Warning" ? "text-primary" : "text-gray";

  return (
    <Card
      style={{
        background: `linear-gradient(134.39deg, rgba(216, 0, 39, 0) 50.72%, rgba(216, 0, 39, 0.08) 107.74%), #FFFFFF`,
      }}
      className={cn("p-[24px] border-none shadow-sm rounded-[14px] flex flex-col justify-between h-full", className)}
    >
      <div className="space-y-1">
        <h4 className="text-base text-dark">{title}</h4>
        <div className="flex items-end gap-1 text-xs">
          <span className="text-gray">{value}</span>
          {subValue && <span className="text-gray">/ {subValue}</span>}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="h-[6px] w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", barColor)}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {
          status &&
          <span className={cn("text-base block", textColor)}>
            {status}
          </span>
        }
      </div>
    </Card>
  );
}