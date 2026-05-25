import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      tone: {
        success: "bg-green-50 text-green-700",
        warning: "bg-yellow-50 text-yellow-700",
        danger: "bg-red-50 text-red-700",
        info: "bg-blue-50 text-blue-700",
        neutral: "bg-gray-100 text-gray-700",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
);

type StatusBadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof statusBadgeVariants>;

export function StatusBadge({ className, tone, ...props }: StatusBadgeProps) {
  return <span className={cn(statusBadgeVariants({ tone }), className)} {...props} />;
}
