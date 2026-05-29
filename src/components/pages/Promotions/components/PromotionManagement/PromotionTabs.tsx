"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = {
  label: string;
  value: string;
};

type Props = {
  tabs: Tab[];
  active: string;
  onChange: (value: string) => void;
};

export default function PromotionTabs({ tabs, active, onChange }: Props) {
  return (
    <div className="w-full sm:w-[50%]">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#F5F5F5] rounded-[12px] p-[4px]">
        {tabs.map((tab) => {
          const isActive = active === tab.value;

          return (
          <Button
  key={tab.value}
  size="sm"
  variant={isActive ? "default" : "ghost"}
  onClick={() => onChange(tab.value)}
  className={cn(
    "w-full box-border px-2 sm:px-4 text-[14px] sm:text-[15px] py-2 rounded-[10px] font-semibold whitespace-nowrap transition-none",
    isActive
      ? "bg-primary text-white hover:bg-primary"
      : "text-gray-500 hover:text-black hover:bg-transparent"
  )}
>
  {tab.label}
</Button>

          );
        })}
      </div>
    </div>
  );
}
