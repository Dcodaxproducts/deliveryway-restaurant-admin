"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { AlertCircle, Inbox, LockKeyhole, RefreshCw, WifiOff } from "lucide-react";

import { cn } from "@/lib/utils";

export type StatePanelState =
  | "loading"
  | "empty"
  | "error"
  | "unavailable"
  | "permission";

export type StatePanelProps = {
  state?: StatePanelState;
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
  className?: string;
};

/* ---------- Route → Content Map (SCALABLE) ---------- */

const emptyStateMap: Record<
  string,
  { titleKey: string; descriptionKey: string }
> = {
  "/menu": {
    titleKey: "emptyMenuTitle",
    descriptionKey: "emptyMenuDescription",
  },

  "/menu/trash": {
    titleKey: "emptyTrashTitle",
    descriptionKey: "emptyTrashDescription",
  },

  "/branches": {
    titleKey: "emptyBranchesTitle",
    descriptionKey: "emptyBranchesDescription",
  },

  "/products": {
    titleKey: "emptyProductsTitle",
    descriptionKey: "emptyProductsDescription",
  },
};

/* ---------- Component ---------- */

const stateIcons: Record<Exclude<StatePanelState, "loading">, ReactNode> = {
  empty: <Inbox aria-hidden="true" />,
  error: <AlertCircle aria-hidden="true" />,
  unavailable: <WifiOff aria-hidden="true" />,
  permission: <LockKeyhole aria-hidden="true" />,
};

export function StatePanel({
  state = "empty",
  title,
  description,
  action,
  icon,
  compact = false,
  className,
}: StatePanelProps) {
  const pathname = usePathname();
  const t = useTranslations("common");

  const routeContent = emptyStateMap[pathname];

  const finalTitle =
    title ?? (routeContent ? t(routeContent.titleKey) : t("emptyDefaultTitle"));

  const finalDescription =
    description ??
    (routeContent ? t(routeContent.descriptionKey) : t("emptyDefaultDescription"));

  const toneClassName =
    state === "error"
      ? "bg-[var(--ui-danger-soft)] text-[var(--ui-danger)]"
      : state === "permission"
        ? "bg-[var(--ui-warning-soft)] text-[var(--ui-warning)]"
        : state === "unavailable"
          ? "bg-[var(--ui-info-soft)] text-[var(--ui-info)]"
          : "bg-[var(--ui-brand-soft)] text-primary";

  return (
    <div
      data-slot="state-panel"
      data-state={state}
      role={state === "error" ? "alert" : "status"}
      aria-live={state === "error" ? "assertive" : "polite"}
      className={cn(
        "flex w-full flex-col items-center justify-center rounded-[var(--ui-radius-card)] bg-[var(--ui-surface-subtle)] px-6 text-center",
        compact ? "min-h-40 py-8" : "min-h-64 py-12",
        className,
      )}
    >
      <div
        className={cn(
          "mb-4 flex size-11 items-center justify-center rounded-[var(--ui-radius-compact)] [&_svg]:size-5",
          toneClassName,
        )}
      >
        {state === "loading" ? (
          <RefreshCw aria-hidden="true" className="animate-spin" />
        ) : (
          icon ?? stateIcons[state]
        )}
      </div>
      <h2 className="text-balance text-xl font-semibold leading-7 text-[var(--ui-text)]">
        {finalTitle}
      </h2>
      <p className="mt-1 max-w-[52ch] text-pretty text-sm leading-6 text-[var(--ui-text-muted)]">
        {finalDescription}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export default StatePanel;
