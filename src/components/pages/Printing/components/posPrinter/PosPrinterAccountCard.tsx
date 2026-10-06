"use client";

import { KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { getPosPrinterAccountIdentifier, type PosPrinterAccount } from "@/services/pos-printer";

export type PosPrinterAccountCardProps = {
  account: PosPrinterAccount;
  canUpdate: boolean;
  onResetPassword: (account: PosPrinterAccount) => void;
  onToggleStatus: (account: PosPrinterAccount) => void;
};

/** Human-readable label for confirmation dialogs: display name plus the sign-in identifier. */
export const formatPosPrinterAccountLabel = (account: PosPrinterAccount) => {
  const identifier = getPosPrinterAccountIdentifier(account).value;
  return account.displayName && account.displayName !== identifier
    ? `${account.displayName} (${identifier})`
    : identifier;
};

export function PosPrinterAccountCard({ account, canUpdate, onResetPassword, onToggleStatus }: PosPrinterAccountCardProps) {
  const t = useTranslations("posPrinter");
  const titleId = `pos-printer-account-${account.id}-title`;
  const identifier = getPosPrinterAccountIdentifier(account);

  return (
    <li>
      <article
        aria-labelledby={titleId}
        className="flex flex-col gap-4 rounded-xl border border-[var(--ui-border)] p-4 sm:flex-row sm:items-center"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={titleId} className="truncate text-base font-semibold text-[var(--ui-text)]">
              {account.displayName}
            </h3>
            <StatusBadge tone={account.isActive ? "success" : "neutral"}>
              {t(account.isActive ? "active" : "inactive")}
            </StatusBadge>
          </div>
          <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_minmax(0,1fr)]">
            <dt className="text-[var(--ui-text-muted)]">{t(identifier.kind === "username" ? "username" : "email")}</dt>
            <dd className="truncate font-medium text-[var(--ui-text)]" data-testid="pos-printer-account-identifier">
              {identifier.value}
            </dd>
            <dt className="text-[var(--ui-text-muted)]">{t("branch")}</dt>
            <dd className="truncate text-[var(--ui-text)]">{account.branch?.name || account.branchId || "—"}</dd>
          </dl>
        </div>
        {canUpdate ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" aria-describedby={titleId} onClick={() => onResetPassword(account)}>
              <KeyRound size={15} aria-hidden="true" />
              {t("resetPassword")}
            </Button>
            <Button
              size="sm"
              variant={account.isActive ? "destructive" : "default"}
              aria-describedby={titleId}
              onClick={() => onToggleStatus(account)}
            >
              {t(account.isActive ? "deactivate" : "activate")}
            </Button>
          </div>
        ) : null}
      </article>
    </li>
  );
}
