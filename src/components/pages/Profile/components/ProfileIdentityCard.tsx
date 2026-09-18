import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SectionCard } from "@/components/common/SectionCard";

type ProfileIdentityCardProps = {
  avatarUrl?: string | null;
  initials: string;
  name: string;
  email?: string | null;
  description?: string | null;
  status?: ReactNode;
  actions?: ReactNode;
  notice?: ReactNode;
};

export function ProfileIdentityCard({
  avatarUrl,
  initials,
  name,
  email,
  description,
  status,
  actions,
  notice,
}: ProfileIdentityCardProps) {
  return (
    <SectionCard padding="md" className="h-fit">
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left xl:flex-col xl:items-center xl:text-center">
        <div className="relative shrink-0">
          <Avatar className="size-20 rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] shadow-[var(--ui-shadow-xs)]">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
            <AvatarFallback className="rounded-[var(--ui-radius-card)] bg-[var(--ui-surface-subtle)] text-xl font-semibold text-[var(--ui-text)]">
              {initials}
            </AvatarFallback>
          </Avatar>
          {actions}
        </div>

        <div className="mt-3 min-w-0 sm:ml-4 sm:mt-0 xl:ml-0 xl:mt-3">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start xl:justify-center">
            <h2 className="truncate text-lg font-semibold text-[var(--ui-text)]">
              {name || "-"}
            </h2>
            {status}
          </div>
          <p className="mt-0.5 break-all text-sm text-[var(--ui-text-muted)]">
            {email || "-"}
          </p>
          {description ? (
            <p className="mt-3 text-sm leading-5 text-[var(--ui-text-muted)]">
              {description}
            </p>
          ) : null}
          {notice ? (
            <div className="mt-2 text-xs text-[var(--ui-text-subtle)]">
              {notice}
            </div>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}
