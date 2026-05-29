"use client";

import { statsData } from "@/config/employee-settings";
import { cn } from "@/lib/utils";

const StatsSection = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
     
        return (
          <div
            key={index}
            className="bg-white p-6 rounded-[14px] border border-[#EDEFF2] flex items-center gap-[24px]"
          >
            {/* Icon */}
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center bg-gray/10 text-primary",
              )}
            >
              <Icon size={22} />
            </div>

            {/* Content */}
            <div className="space-y-1">
              <p className="text-[32px] font-semibold text-dark leading-none">
                {stat.value}
              </p>

              <p className="text-base text-gray">
                {stat.title}
              </p>

              {/* Trend */}
              
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsSection;
