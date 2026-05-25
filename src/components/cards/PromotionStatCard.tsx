import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  icon: ReactNode;
  value: string | number;
  label: string;
  loading?: boolean;
};

export default function PromotionStatCard({
  icon,
  value,
  label,
  loading = false,
}: Props) {
  return (
    <div className="bg-white border border-[#EDEFF2] rounded-xl p-6 flex items-center gap-4">
      <div
        className={cn(
          "w-10 h-10 rounded-full bg-[#F9F9F9] flex items-center justify-center text-primary shrink-0"
        )}
      >
        {loading ? (
          <div className="h-5 w-5 animate-pulse rounded-full bg-gray-200" />
        ) : (
          icon
        )}
      </div>

      <div className="space-y-1 flex-1">
        {loading ? (
          <>
            <div className="h-7 w-14 rounded-md bg-gray-200 animate-pulse" />
            <div className="h-4 w-28 rounded-md bg-gray-200 animate-pulse" />
          </>
        ) : (
          <>
            <p className="text-2xl font-semibold text-dark">{value ?? 0}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </>
        )}
      </div>
    </div>
  );
}