import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const pageLayoutVariants = cva(
  "mx-auto mb-6 w-full min-w-0 space-y-6 px-[var(--ui-page-gutter)] py-5 lg:mb-12 lg:py-6",
  {
    variants: {
      width: {
        default: "max-w-[var(--ui-content-admin)]",
        wide: "max-w-[1800px]",
        full: "max-w-none",
      },
    },
    defaultVariants: {
      width: "default",
    },
  },
);

export type PageLayoutProps = {
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  actionsClassName?: string;
} & VariantProps<typeof pageLayoutVariants>;

export function PageLayout({
  children,
  className,
  width,
  actions,
  actionsClassName,
}: PageLayoutProps) {
  return (
    <div
      data-slot="page-layout"
      className={cn(pageLayoutVariants({ width }), className)}
    >
      {children}
      {actions ? (
        <div
          data-slot="page-layout-actions"
          className={cn(
            "sticky bottom-0 z-[var(--ui-layer-sticky)] -mx-[var(--ui-page-gutter)] border-t border-[var(--ui-border)] bg-[var(--ui-surface)]/95 px-[var(--ui-page-gutter)] py-3 backdrop-blur",
            actionsClassName,
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export default PageLayout;
