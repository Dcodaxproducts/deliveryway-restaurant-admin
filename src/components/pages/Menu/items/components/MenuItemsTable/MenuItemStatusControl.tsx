"use client";

import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export type MenuItemStatusControlProps = {
  active: boolean;
  pending: boolean;
  disabled: boolean;
  activeLabel: string;
  inactiveLabel: string;
  ariaLabel: string;
  pendingLabel: string;
  disabledReason?: string;
  onCheckedChange: (checked: boolean) => void;
};

export default function MenuItemStatusControl({
  active,
  pending,
  disabled,
  activeLabel,
  inactiveLabel,
  ariaLabel,
  pendingLabel,
  disabledReason,
  onCheckedChange,
}: MenuItemStatusControlProps) {
  const statusLabel = active ? activeLabel : inactiveLabel;

  return (
    <div
      className="inline-flex min-w-[126px] items-center justify-center gap-2"
      title={disabledReason}
    >
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
          active
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {statusLabel}
      </span>
      <span className="relative inline-flex items-center">
        <Switch
          checked={active}
          disabled={disabled || pending}
          onCheckedChange={onCheckedChange}
          aria-label={ariaLabel}
          aria-busy={pending}
          className="focus-visible:ring-primary/40"
        />
        {pending ? (
          <Loader2
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 animate-spin text-white"
          />
        ) : null}
        <span className="sr-only" aria-live="polite">
          {pending ? pendingLabel : statusLabel}
        </span>
      </span>
    </div>
  );
}
