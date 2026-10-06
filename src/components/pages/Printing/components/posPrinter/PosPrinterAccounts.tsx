"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Printer, RefreshCw, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { FormField } from "@/components/common/FormField";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  useCreatePosPrinterAccount, usePosPrinterAccounts,
  useResetPosPrinterPassword, useUpdatePosPrinterStatus,
} from "@/hooks/usePosPrinterAccounts";
import { hasStaffPermission, isStaffRole } from "@/lib/auth";
import { posPrinterApi, type PosPrinterAccount } from "@/services/pos-printer";
import { POS_PRINTER_PASSWORD_MIN, type PosPrinterAccountCreateValues } from "@/validations/pos-printer";

import { formatPosPrinterAccountLabel, PosPrinterAccountCard } from "./PosPrinterAccountCard";
import { PosPrinterAccountCreateForm } from "./PosPrinterAccountCreateForm";

const CREATE_FORM_ID = "pos-printer-account-create";
const RESET_FORM_ID = "pos-printer-account-reset";

export default function PosPrinterAccounts() {
  const t = useTranslations("posPrinter");
  const { user, role, branchId } = useAuth();
  const isBusinessAdmin = role === "BUSINESS_ADMIN";
  const isBranchAdmin = role === "BRANCH_ADMIN";
  const isStaff = isStaffRole(user?.role, user?.actorType);
  const canRead = isBusinessAdmin || isBranchAdmin ||
    hasStaffPermission(user, ["auto-printing-pos"], ["read", "create", "update", "write"]);
  const canCreate = isBusinessAdmin || isBranchAdmin ||
    hasStaffPermission(user, ["auto-printing-pos"], ["create", "write"]);
  const canUpdate = isBusinessAdmin || isBranchAdmin ||
    hasStaffPermission(user, ["auto-printing-pos"], ["update", "write"]);
  const requiresBranchSelection = isBusinessAdmin || isStaff;
  const accounts = usePosPrinterAccounts(canRead);
  const branches = useQuery({
    queryKey: ["pos-printer-account-branches"],
    queryFn: posPrinterApi.listBranches,
    enabled: canRead && requiresBranchSelection,
  });
  const create = useCreatePosPrinterAccount();
  const status = useUpdatePosPrinterStatus();
  const reset = useResetPosPrinterPassword();
  const [createOpen, setCreateOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<PosPrinterAccount | null>(null);
  const [resetTarget, setResetTarget] = useState<PosPrinterAccount | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const branchList = useMemo(() => branches.data ?? [], [branches.data]);
  const fixedBranchName = user?.branchName || branchId || "—";

  if (!canRead) return null;

  const submitCreate = async (values: PosPrinterAccountCreateValues) => {
    await create.mutateAsync({
      displayName: values.displayName,
      username: values.username,
      password: values.password,
      branchId: requiresBranchSelection ? values.branchId : undefined,
    });
    setCreateOpen(false);
    toast.success(t("accountCreated"));
  };
  const confirmStatus = async () => {
    if (!statusTarget) return;
    try {
      await status.mutateAsync({ id: statusTarget.id, isActive: !statusTarget.isActive });
      toast.success(t(statusTarget.isActive ? "accountDeactivated" : "accountActivated"));
      setStatusTarget(null);
    } catch { toast.error(t("accountActionError")); }
  };
  const closeReset = () => { setResetTarget(null); setNewPassword(""); };
  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetTarget || newPassword.length < POS_PRINTER_PASSWORD_MIN) return;
    try {
      await reset.mutateAsync({ id: resetTarget.id, newPassword });
      closeReset();
      toast.success(t("passwordResetSuccess"));
    } catch { toast.error(t("accountActionError")); }
  };

  return (
    <section
      className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
      aria-labelledby="pos-printer-accounts-title"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Printer size={20} aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider">{t("secureDeviceAccess")}</span>
          </div>
          <h2 id="pos-printer-accounts-title" className="mt-2 text-xl font-semibold">{t("accountsTitle")}</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{t("accountsDescription")}</p>
        </div>
        {canCreate ? (
          <Button className="w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
            <Plus size={17} aria-hidden="true" />
            {t("createAccount")}
          </Button>
        ) : null}
      </div>

      {role === "BRANCH_ADMIN" ? (
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <ShieldCheck size={18} aria-hidden="true" />
          {t("fixedBranch", { branch: fixedBranchName })}
        </div>
      ) : null}
      {accounts.isPending ? (
        <div className="mt-6 space-y-3" role="status" aria-label={t("loadingAccounts")}>
          {[1, 2].map((n) => <div key={n} className="h-20 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : null}
      {accounts.isError ? (
        <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{t("accountsLoadError")}</p>
          <Button className="mt-3" size="sm" variant="outline" onClick={() => accounts.refetch()}>
            <RefreshCw size={15} aria-hidden="true" />
            {t("retry")}
          </Button>
        </div>
      ) : null}
      {accounts.data?.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">{t("noAccounts")}</div>
      ) : null}
      {accounts.data?.length ? (
        <ul className="mt-6 grid gap-3" aria-label={t("accountList")}>
          {accounts.data.map((account) => (
            <PosPrinterAccountCard
              key={account.id}
              account={account}
              canUpdate={canUpdate}
              onResetPassword={(target) => { setNewPassword(""); setResetTarget(target); }}
              onToggleStatus={setStatusTarget}
            />
          ))}
        </ul>
      ) : null}

      <ResponsiveDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={t("createAccount")}
        description={t("createDescription")}
        busy={create.isPending}
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={create.isPending}>
              {t("cancel")}
            </Button>
            <Button type="submit" form={CREATE_FORM_ID} disabled={create.isPending || (requiresBranchSelection && branches.isPending)}>
              {create.isPending ? t("creating") : t("create")}
            </Button>
          </>
        }
      >
        {createOpen ? (
          <PosPrinterAccountCreateForm
            formId={CREATE_FORM_ID}
            requiresBranchSelection={requiresBranchSelection}
            fixedBranchName={fixedBranchName}
            branches={{ options: branchList, isPending: branches.isPending, isError: branches.isError }}
            onSubmit={submitCreate}
            onError={() => toast.error(t("accountActionError"))}
          />
        ) : null}
      </ResponsiveDialog>

      <AlertDialog open={Boolean(statusTarget)} onOpenChange={(open) => !open && setStatusTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(statusTarget?.isActive ? "deactivateTitle" : "activateTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(statusTarget?.isActive ? "deactivateDescription" : "activateDescription", {
                account: statusTarget ? formatPosPrinterAccountLabel(statusTarget) : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={status.isPending} onClick={confirmStatus}>
              {status.isPending ? t("saving") : t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ResponsiveDialog
        open={Boolean(resetTarget)}
        onOpenChange={(open) => { if (!open) closeReset(); }}
        title={t("resetPassword")}
        description={t("resetDescription", { account: resetTarget ? formatPosPrinterAccountLabel(resetTarget) : "" })}
        busy={reset.isPending}
        size="sm"
        actions={
          <>
            <Button type="button" variant="outline" onClick={closeReset} disabled={reset.isPending}>{t("cancel")}</Button>
            <Button type="submit" form={RESET_FORM_ID} disabled={reset.isPending || newPassword.length < POS_PRINTER_PASSWORD_MIN}>
              {reset.isPending ? t("saving") : t("resetPassword")}
            </Button>
          </>
        }
      >
        <form id={RESET_FORM_ID} className="space-y-4" onSubmit={submitReset}>
          <FormField id={`${RESET_FORM_ID}-password`} label={t("newPassword")} required help={t("passwordHint")}>
            {(controlProps) => (
              <Input
                {...controlProps}
                type="password"
                autoComplete="new-password"
                minLength={POS_PRINTER_PASSWORD_MIN}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            )}
          </FormField>
        </form>
      </ResponsiveDialog>
    </section>
  );
}
