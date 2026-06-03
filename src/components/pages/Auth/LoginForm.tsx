"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, type FormEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import FormInput from "@/components/forms/common/FormInput";
import AuthPageShell from "@/components/pages/Auth/components/AuthPageShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthContext } from "@/components/providers/auth-provider";
import { getRoleLabel, isAllowedAdminRole } from "@/lib/auth";
import { getSafeRedirectPath } from "@/lib/auth-routes";
import { authApi } from "@/services/auth/auth.api";
import {
  loginSchema,
  type LoginFormValues,
} from "@/validations/auth";

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthContext();
  const t = useTranslations("auth");

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const email = searchParams.get("email");
    if (email) setValue("email", email);
  }, [searchParams, setValue]);

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const authPayload = await authApi.loginWithFallback(values);
      const user = authPayload.user;

      if (!user) {
        throw new Error(t("invalidLoginResponse"));
      }

      if (!isAllowedAdminRole(user.role)) {
        toast.error(t("notAuthorized"));
        return;
      }

      if (user.role === "BRANCH_ADMIN" && !user.branchId) {
        toast.error(t("missingBranchAssignment"));
        return;
      }

      login(authPayload);
      toast.success(t("loginSuccess", { role: getRoleLabel(user.role) }));

      const defaultRedirectPath = user.role === "BRANCH_ADMIN" ? "/branch-workspace" : "/";
      const redirectPath = getSafeRedirectPath(searchParams.get("redirect") ?? defaultRedirectPath);

      router.push(redirectPath);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("genericError"));
    }
  };

  const submitLogin = handleSubmit(onSubmit);

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitLogin(event);
  };

  const handleLoginClick = () => {
    void submitLogin();
  };

  return (
    <AuthPageShell>
      <div className="w-full max-w-[420px]">
        <h1 className="text-center text-[26px] font-semibold">
          {t("try")} <br />
          <span className="text-primary">{t("saasTitle")}</span>
          <br />
          {t("buildBusiness")}
        </h1>

        <p className="mt-3 text-center text-sm text-gray-400">
          {t("loginSubtitle")}
        </p>

        <form className="mt-10 space-y-6" noValidate onSubmit={handleFormSubmit}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <FormInput
                label={t("email")}
                placeholder={t("emailPlaceholder")}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={Boolean(errors.email)}
                errorText={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <FormInput
                label={t("password")}
                type="password"
                placeholder={t("passwordPlaceholder")}
                showPasswordToggle
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={Boolean(errors.password)}
                errorText={errors.password?.message}
              />
            )}
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-gray-500">
              <Checkbox checked />
              {t("rememberMe")}
            </label>

            <Link href="/forgot-password" className="text-primary hover:underline">
              {t("forgotPasswordLink")}
            </Link>
          </div>

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleLoginClick}
            className="h-[48px] w-full rounded-[12px] text-base"
          >
            {isSubmitting ? t("signingIn") : t("signIn")}
          </Button>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-900">{t("or")}</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <button
            type="button"
            className="flex h-[48px] w-full items-center justify-center gap-3 rounded-[12px] border border-[#BBBBBB] text-sm font-medium transition hover:bg-gray-50"
          >
            <Image src="/google_icon.png" alt={t("googleAlt")} width={18} height={18} />
            {t("signInWithGoogle")}
          </button>
        </form>
      </div>
    </AuthPageShell>
  );
};

export default LoginForm;
