"use client";
import { Info } from "lucide-react";
import clsx from "clsx";

interface SectionProps {
  label?: string;
  children?: React.ReactNode;

  className?: string;
  contentClassName?: string;
  labelClassName?: string;

  padded?: boolean;
  withMargin?: boolean; // ⭐ NEW
}

export default function Section({
  label,
  children,
  className,
  contentClassName,
  labelClassName,
  padded = true,
  withMargin = false, // ⭐ default adds spacing between sections
}: SectionProps) {
  return (
    <div
      className={clsx(
        "grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-12 bg-white rounded-[14px]",
        padded && "p-8",     // use tailwind scale (better than p-[30px])
        withMargin && "mb-9", // ⭐ bottom spacing
        className
      )}
    >
      {/* Label */}
      {label && (
        <div
          className={clsx(
            "space-y-14 text-sm text-gray-500 pt-1",
            labelClassName
          )}
        >
          <div className="flex items-center gap-2">
            <Info size={14} />
            <span className="font-medium">{label}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={clsx("space-y-6", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
