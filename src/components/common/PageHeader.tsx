import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PageActionGroup } from "@/components/common/PageActionGroup";

export type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  breadcrumbs?: ReactNode;
  backAction?: ReactNode;
  actions?: ReactNode;
  tabs?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export default function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumbs,
  backAction,
  actions,
  tabs,
  className,
  titleClassName,
  descriptionClassName,
}: PageHeaderProps) {
  return (
    <header data-slot="page-header" className={cn("space-y-3", className)}>
      {breadcrumbs ? (
        <div data-slot="page-header-breadcrumbs">{breadcrumbs}</div>
      ) : null}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {backAction ? (
            <div className="shrink-0 pt-0.5">{backAction}</div>
          ) : null}
          <div className="min-w-0 space-y-1">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                {eyebrow}
              </p>
            ) : null}
            <h1
              className={cn(
                "text-balance text-xl font-semibold leading-tight tracking-[-0.02em] text-[var(--ui-text)] lg:text-2xl",
                titleClassName,
              )}
            >
              {title}
            </h1>
            {description ? (
              <p
                className={cn(
                  "max-w-[65ch] text-pretty text-sm leading-5 text-[var(--ui-text-muted)]",
                  descriptionClassName,
                )}
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <PageActionGroup className="shrink-0">{actions}</PageActionGroup>
        ) : null}
      </div>
      {tabs ? <div data-slot="page-header-tabs">{tabs}</div> : null}
    </header>
  );
}
