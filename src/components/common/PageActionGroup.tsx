import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageActionGroupProps = {
  children: ReactNode;
  className?: string;
};

export function PageActionGroup({ children, className }: PageActionGroupProps) {
  return (
    <div
      data-slot="page-action-group"
      className={cn(
        "flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end [&_[data-slot=button]]:h-10 [&_[data-slot=button]]:rounded-[var(--ui-radius-control)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
