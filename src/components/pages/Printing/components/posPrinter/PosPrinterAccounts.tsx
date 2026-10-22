"use client";

import { useQuery } from "@tanstack/react-query";
import { KeyRound, Plus, Printer, RefreshCw, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import {
  useCreatePosPrinterAccount, usePosPrinterAccounts,
  useResetPosPrinterPassword, useUpdatePosPrinterStatus,
} from "@/hooks/usePosPrinterAccounts";
import { hasStaffPermission, isStaffRole } from "@/lib/auth";
import { getPosPrinterAccountErrorKey, posPrinterApi, type PosPrinterAccount } from "@/services/pos-printer";

const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,64}$/;
const emptyForm = { firstName: "", lastName: "", username: "", email: "", password: "", branchId: "" };

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
  const [form, setForm] = useState(emptyForm);
  const [statusTarget, setStatusTarget] = useState<PosPrinterAccount | null>(null);
  const [resetTarget, setResetTarget] = useState<PosPrinterAccount | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const branchList = useMemo(() => branches.data ?? [], [branches.data]);

  if (!canRead) return null;

  const closeCreate = () => { setCreateOpen(false); setForm(emptyForm); };
  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!USERNAME_PATTERN.test(form.username.trim()) || form.password.length < 12 ||
      (requiresBranchSelection && !form.branchId)) return;
    try {
      await create.mutateAsync({
        username: form.username.trim(),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        password: form.password,
        firstName: form.firstName.trim(), lastName: form.lastName.trim(),
        branchId: requiresBranchSelection ? form.branchId : undefined,
      });
      closeCreate();
      toast.success(t("accountCreated"));
    } catch (error: unknown) { toast.error(t(getPosPrinterAccountErrorKey(error))); }
  };
  const confirmStatus = async () => {
    if (!statusTarget) return;
    try {
      await status.mutateAsync({ id: statusTarget.id, isActive: !statusTarget.isActive });
      toast.success(t(statusTarget.isActive ? "accountDeactivated" : "accountActivated"));
      setStatusTarget((current) => current?.id === statusTarget.id ? null : current);
    } catch (error: unknown) {
      toast.error(t(getPosPrinterAccountErrorKey(error)));
    }
  };
  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetTarget || newPassword.length < 12) return;
    try {
      await reset.mutateAsync({ id: resetTarget.id, newPassword });
      setNewPassword("");
      setResetTarget((current) => current?.id === resetTarget.id ? null : current);
      toast.success(t("passwordResetSuccess"));
    } catch (error: unknown) {
      toast.error(t(getPosPrinterAccountErrorKey(error)));
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="pos-printer-accounts-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><div className="flex items-center gap-2 text-primary"><Printer size={20} /><span className="text-xs font-bold uppercase tracking-wider">{t("secureDeviceAccess")}</span></div><h2 id="pos-printer-accounts-title" className="mt-2 text-xl font-semibold">{t("accountsTitle")}</h2><p className="mt-1 max-w-2xl text-sm text-gray-500">{t("accountsDescription")}</p></div>
        {canCreate ? <Button onClick={() => setCreateOpen(true)}><Plus size={17} />{t("createAccount")}</Button> : null}
      </div>
      {role === "BRANCH_ADMIN" ? <div className="mt-5 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900"><ShieldCheck size={18} />{t("fixedBranch", { branch: user?.branchName || branchId || "—" })}</div> : null}
      {accounts.isPending ? <div className="mt-6 space-y-3" aria-label={t("loadingAccounts")}>{[1,2].map((n) => <div key={n} className="h-20 animate-pulse rounded-xl bg-gray-100" />)}</div> : null}
      {accounts.isError ? <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p>{t("accountsLoadError")}</p><Button className="mt-3" size="sm" variant="outline" onClick={() => accounts.refetch()}><RefreshCw size={15} />{t("retry")}</Button></div> : null}
      {accounts.data?.length === 0 ? <div className="mt-6 rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">{t("noAccounts")}</div> : null}
      <div className="mt-6 grid gap-3">
        {accounts.data?.map((account) => <article key={account.id} className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-semibold">{account.firstName} {account.lastName}</p><span className={account.isActive ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700" : "rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600"}>{t(account.isActive ? "active" : "inactive")}</span></div><p className="mt-1 truncate text-sm font-medium text-gray-700">{account.username ?? account.email}</p>{account.username && account.email ? <p className="mt-1 truncate text-xs text-gray-500">{account.email}</p> : null}<p className="mt-1 text-xs text-gray-500">{account.branch?.name || account.branchId}</p></div>{canUpdate ? <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => { setNewPassword(""); setResetTarget(account); }}><KeyRound size={15} />{t("resetPassword")}</Button><Button size="sm" variant={account.isActive ? "destructive" : "default"} onClick={() => setStatusTarget(account)}>{t(account.isActive ? "deactivate" : "activate")}</Button></div> : null}</article>)}
      </div>

      <Dialog open={createOpen} onOpenChange={(open) => { if (open) setCreateOpen(true); else if (!create.isPending) closeCreate(); }}><DialogContent><DialogHeader><DialogTitle>{t("createAccount")}</DialogTitle><DialogDescription>{t("createDescription")}</DialogDescription></DialogHeader><form className="grid gap-4 sm:grid-cols-2" onSubmit={submitCreate}><label className="text-sm font-medium">{t("firstName")}<Input className="mt-2" value={form.firstName} onChange={(e) => setForm({...form, firstName:e.target.value})} required /></label><label className="text-sm font-medium">{t("lastName")}<Input className="mt-2" value={form.lastName} onChange={(e) => setForm({...form, lastName:e.target.value})} required /></label><label className="text-sm font-medium sm:col-span-2">{t("username")}<Input className="mt-2" autoComplete="off" minLength={3} maxLength={64} pattern="[A-Za-z0-9._-]{3,64}" value={form.username} onChange={(e) => setForm({...form, username:e.target.value})} required /><span className="mt-1 block text-xs text-gray-500">{t("usernameHint")}</span></label><label className="text-sm font-medium sm:col-span-2">{t("emailOptional")}<Input className="mt-2" type="email" autoComplete="off" value={form.email} onChange={(e) => setForm({...form, email:e.target.value})} /></label><label className="text-sm font-medium sm:col-span-2">{t("initialPassword")}<Input className="mt-2" type="password" autoComplete="new-password" minLength={12} value={form.password} onChange={(e) => setForm({...form, password:e.target.value})} required /><span className="mt-1 block text-xs text-gray-500">{t("passwordHint")}</span></label>{requiresBranchSelection ? <label className="text-sm font-medium sm:col-span-2">{t("branch")}<select className="mt-2 h-10 w-full rounded-md border bg-white px-3" value={form.branchId} onChange={(e) => setForm({...form, branchId:e.target.value})} required disabled={branches.isPending}><option value="">{branches.isPending ? t("loadingBranches") : t("selectBranch")}</option>{branchList.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>{branches.isError ? <span role="alert" className="mt-1 block text-xs text-red-600">{t("branchesLoadError")}</span> : null}</label> : null}<DialogFooter className="sm:col-span-2"><Button type="button" variant="outline" onClick={closeCreate} disabled={create.isPending}>{t("cancel")}</Button><Button type="submit" disabled={create.isPending || !USERNAME_PATTERN.test(form.username.trim()) || form.password.length < 12 || (requiresBranchSelection && !form.branchId)}>{create.isPending ? t("creating") : t("create")}</Button></DialogFooter></form></DialogContent></Dialog>
      <AlertDialog open={Boolean(statusTarget)} onOpenChange={(open) => !open && setStatusTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t(statusTarget?.isActive ? "deactivateTitle" : "activateTitle")}</AlertDialogTitle><AlertDialogDescription>{t(statusTarget?.isActive ? "deactivateDescription" : "activateDescription", { email: statusTarget?.username || statusTarget?.email || "" })}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t("cancel")}</AlertDialogCancel><AlertDialogAction disabled={status.isPending} onClick={confirmStatus}>{status.isPending ? t("saving") : t("confirm")}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <Dialog open={Boolean(resetTarget)} onOpenChange={(open) => { if (!open) { setResetTarget(null); setNewPassword(""); } }}><DialogContent><DialogHeader><DialogTitle>{t("resetPassword")}</DialogTitle><DialogDescription>{t("resetDescription", { email: resetTarget?.username || resetTarget?.email || "" })}</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={submitReset}><label className="text-sm font-medium">{t("newPassword")}<Input className="mt-2" type="password" autoComplete="new-password" minLength={12} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /><span className="mt-1 block text-xs text-gray-500">{t("passwordHint")}</span></label><DialogFooter><Button type="button" variant="outline" onClick={() => { setResetTarget(null); setNewPassword(""); }}>{t("cancel")}</Button><Button type="submit" disabled={reset.isPending || newPassword.length < 12}>{reset.isPending ? t("saving") : t("resetPassword")}</Button></DialogFooter></form></DialogContent></Dialog>
    </section>
  );
}
