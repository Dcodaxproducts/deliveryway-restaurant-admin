"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Printer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import FormInput from "@/components/forms/common/FormInput";
import AuthPageShell from "@/components/pages/Auth/components/AuthPageShell";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/components/providers/auth-provider";
import { isPosPrinterAccount } from "@/lib/auth";
import { authApi } from "@/services/auth/auth.api";
import {
  isPosPrinterErrorCode,
  posPrinterLoginSchema,
  type PosPrinterLoginValues,
} from "@/validations/pos-printer";

const TITLE_ID = "pos-printer-login-title";

/**
 * Dedicated device sign-in: one identifier field (username or legacy email) plus password,
 * sent as-is to `POST /auth/pos-printer/login`. There is intentionally no role selector;
 * the endpoint only accepts POS printer accounts.
 */
export default function PosPrinterLoginPage() {
  const t = useTranslations("posPrinter");
  const router = useRouter();
  const { login } = useAuthContext();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<PosPrinterLoginValues>({
    resolver: zodResolver(posPrinterLoginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const errorText = (message?: string) =>
    message ? (isPosPrinterErrorCode(message) ? t(`errors.${message}`) : message) : undefined;

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
    <AuthPageShell titleId={TITLE_ID}>
      <div className="w-full max-w-[440px] py-10">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Printer size={28} aria-hidden="true" />
        </div>
        <h1 id={TITLE_ID} className="mt-5 text-center text-2xl font-semibold text-gray-950">{t("loginTitle")}</h1>
        <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-gray-500">{t("loginDescription")}</p>
        <form className="mt-8 space-y-5" noValidate onSubmit={submit} data-testid="pos-printer-login-form">
          <Controller
            control={control}
            name="identifier"
            render={({ field }) => (
              <FormInput
                {...field}
                id="pos-printer-login-identifier"
                label={t("identifier")}
                type="text"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder={t("identifierPlaceholder")}
                error={Boolean(errors.identifier)}
                errorText={errorText(errors.identifier?.message)}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <FormInput
                {...field}
                id="pos-printer-login-password"
                label={t("password")}
                type="password"
                autoComplete="current-password"
                showPasswordToggle
                placeholder={t("passwordPlaceholder")}
                error={Boolean(errors.password)}
                errorText={errorText(errors.password?.message)}
              />
            )}
          />
          <Button className="h-12 w-full rounded-xl text-base" type="submit" disabled={isSubmitting}>
            <LockKeyhole size={18} aria-hidden="true" />
            {isSubmitting ? t("signingIn") : t("signIn")}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          {t("adminPrompt")}{" "}
          <Link className="font-semibold text-primary hover:underline" href="/login">{t("adminLogin")}</Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
