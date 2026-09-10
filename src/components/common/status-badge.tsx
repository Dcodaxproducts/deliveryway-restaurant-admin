import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const statusBadgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 border font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        success: "border-transparent bg-[var(--ui-success-soft)] text-[var(--ui-success)]",
        warning: "border-transparent bg-[var(--ui-warning-soft)] text-[var(--ui-warning)]",
        danger: "border-transparent bg-[var(--ui-danger-soft)] text-[var(--ui-danger)]",
        info: "border-transparent bg-[var(--ui-info-soft)] text-[var(--ui-info)]",
        neutral: "border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] text-[var(--ui-text-muted)]",
      },
      size: {
        sm: "rounded-[8px] px-2 py-0.5 text-[11px]",
        md: "rounded-[var(--ui-radius-control)] px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      tone: "neutral",
      size: "md",
    },
  }
);

type StatusBadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof statusBadgeVariants>;

export function StatusBadge({ className, tone, size, ...props }: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      className={cn(statusBadgeVariants({ tone, size }), className)}
      {...props}
    />
  );
}
