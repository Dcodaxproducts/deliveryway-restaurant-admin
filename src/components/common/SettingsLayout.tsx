import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type SettingsLayoutProps = HTMLAttributes<HTMLDivElement> & {
  navigation?: ReactNode;
  navigationLabel?: string;
  status?: ReactNode;
  actions?: ReactNode;
  actionsClassName?: string;
};

export function SettingsLayout({
  navigation,
  navigationLabel = "Settings sections",
  status,
  actions,
  actionsClassName,
  children,
  className,
  ...props
}: SettingsLayoutProps) {
  return (
    <div data-slot="settings-layout" className={cn("min-w-0 space-y-5", className)} {...props}>
      <div
        data-slot="settings-layout-body"
        className={cn(
          "grid min-w-0 gap-5",
          navigation && "lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start",
        )}
      >
        {navigation ? (
          <nav
            data-slot="settings-layout-navigation"
            aria-label={navigationLabel}
            className="min-w-0 overflow-x-auto rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-2 lg:sticky lg:top-24"
          >
            {navigation}
          </nav>
        ) : null}
        <div data-slot="settings-layout-content" className="min-w-0 space-y-5">
          {status ? (
            <div
              data-slot="settings-layout-status"
              aria-live="polite"
              className="text-sm text-[var(--ui-text-muted)]"
            >
              {status}
            </div>
          ) : null}
          {children}
        </div>
      </div>
      {actions ? (
        <div
          data-slot="settings-layout-actions"
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

