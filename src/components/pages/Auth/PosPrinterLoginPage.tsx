"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Printer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";

import FormInput from "@/components/forms/common/FormInput";
import AuthPageShell from "@/components/pages/Auth/components/AuthPageShell";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/components/providers/auth-provider";
import { isPosPrinterAccount } from "@/lib/auth";
import { authApi } from "@/services/auth/auth.api";

const schema = z.object({
  usernameOrEmail: z.string().trim().min(1),
  password: z.string().min(1),
});
type Values = z.infer<typeof schema>;

export default function PosPrinterLoginPage() {
  const t = useTranslations("posPrinter");
  const router = useRouter();
  const { login } = useAuthContext();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { usernameOrEmail: "", password: "" },
  });

  const submit = handleSubmit(async (values) => {
    try {
      const payload = await authApi.posPrinterLogin(values);
      if (!payload.user || !isPosPrinterAccount(payload.user)) throw new Error("invalid");
      login(payload);
      router.replace("/orders?tab=today");
    } catch {
      toast.error(t("loginError"));
    }
  });

  return (
    <AuthPageShell>
      <main className="w-full max-w-[440px] py-10">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Printer size={28} aria-hidden="true" /></div>
        <h1 className="mt-5 text-center text-2xl font-semibold text-gray-950">{t("loginTitle")}</h1>
        <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-gray-500">{t("loginDescription")}</p>
        <form className="mt-8 space-y-5" noValidate onSubmit={submit}>
          <Controller control={control} name="usernameOrEmail" render={({ field }) => <FormInput {...field} label={t("usernameOrEmail")} type="text" autoComplete="username" placeholder={t("usernameOrEmailPlaceholder")} error={Boolean(errors.usernameOrEmail)} errorText={errors.usernameOrEmail ? t("usernameOrEmailError") : undefined} />} />
          <Controller control={control} name="password" render={({ field }) => <FormInput {...field} label={t("password")} type="password" autoComplete="current-password" showPasswordToggle placeholder={t("passwordPlaceholder")} error={Boolean(errors.password)} errorText={errors.password ? t("passwordRequired") : undefined} />} />
          <Button className="h-12 w-full rounded-xl text-base" type="submit" disabled={isSubmitting}><LockKeyhole size={18} />{isSubmitting ? t("signingIn") : t("signIn")}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">{t("adminPrompt")} <Link className="font-semibold text-primary hover:underline" href="/login">{t("adminLogin")}</Link></p>
      </main>
    </AuthPageShell>
  );
}
