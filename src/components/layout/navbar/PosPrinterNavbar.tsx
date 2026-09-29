"use client";

import { KeyRound, LogOut, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import LanguageSelector from "@/components/layout/navbar/LanguageSelector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/services/auth/auth.api";

export function PosPrinterNavbar() {
  const t = useTranslations("posPrinter");
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pending, setPending] = useState(false);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* local logout must still complete */ }
    logout();
    router.replace("/pos-printer/login");
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 12) return;
    setPending(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setOpen(false);
      toast.success(t("passwordChanged"));
    } catch {
      toast.error(t("genericError"));
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <nav className="flex min-h-[76px] items-center gap-3 border-b bg-white px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Printer size={20} /></span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{t("deviceConsole")}</p>
            <p className="truncate text-xs text-gray-500">{user?.branchName || user?.email}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <LanguageSelector />
          <Button variant="ghost" size="sm" onClick={() => setOpen(true)}><KeyRound size={17} /><span className="hidden sm:inline">{t("changePassword")}</span></Button>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={handleLogout}><LogOut size={17} /><span className="hidden sm:inline">{t("logout")}</span></Button>
        </div>
      </nav>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("changePassword")}</DialogTitle><DialogDescription>{t("changePasswordDescription")}</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={handlePasswordChange}>
            <label className="block text-sm font-medium">{t("currentPassword")}<Input className="mt-2" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></label>
            <label className="block text-sm font-medium">{t("newPassword")}<Input className="mt-2" type="password" autoComplete="new-password" minLength={12} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /><span className="mt-1 block text-xs text-gray-500">{t("passwordHint")}</span></label>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button><Button type="submit" disabled={pending || newPassword.length < 12}>{pending ? t("saving") : t("save")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
