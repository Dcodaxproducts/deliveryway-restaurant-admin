"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import FormInput from "@/components/forms/common/FormInput";
import AuthPageShell, {
  AuthBrand,
  AuthCard,
  AUTH_DESCRIPTION_CLASS,
  AUTH_DIVIDER_LINE_CLASS,
  AUTH_PRIMARY_SUBMIT_BUTTON_CLASS,
  AUTH_SECONDARY_LINK_CLASS,
  AUTH_TITLE_CLASS,
} from "@/components/pages/Auth/components/AuthPageShell";
import { Button } from "@/components/ui/button";
import { authApi } from "@/services/auth/auth.api";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/validations/auth";

const ResetPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const {
    control,
    getValues,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      restaurantId: "",
      otp: "",
      newPassword: "",
    },
  });

  useEffect(() => {
    const emailFromUrl = searchParams.get("email");
    const restaurantIdFromUrl = searchParams.get("restaurantId");

    if (emailFromUrl) setValue("email", emailFromUrl);
    if (restaurantIdFromUrl) setValue("restaurantId", restaurantIdFromUrl);
  }, [searchParams, setValue]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    try {
      await authApi.resetPassword(values);
      toast.success(t("passwordResetSuccess"));
      router.push("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("genericError"));
    }
  };

  const handleResendOtp = async () => {
    const { email, restaurantId } = getValues();

    if (!email || !restaurantId) {
      toast.error(t("missingEmailOrRestaurant"));
      return;
    }

    try {
      setIsResending(true);
      await authApi.resendOtp({ email, restaurantId });
      toast.success(t("otpResent"));
      setCountdown(60);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("genericError"));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthPageShell>
      <AuthCard>
        <AuthBrand />
        <div className="mb-5 mt-7 flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/[0.09] text-primary">
            <ShieldCheck size={21} aria-hidden="true" />
          </div>
        </div>

        <h1 id="auth-page-title" className={AUTH_TITLE_CLASS}>
          {t("resetPasswordTitle")}
        </h1>

        <p className={AUTH_DESCRIPTION_CLASS}>
          {t("resetPasswordDescription")}
        </p>

        <form
          className="mt-8 space-y-6"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
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
            name="otp"
            render={({ field }) => (
              <FormInput
                label={t("otp")}
                placeholder={t("otpPlaceholder")}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={Boolean(errors.otp)}
                errorText={errors.otp?.message}
              />
            )}
          />

          <div className="flex items-center justify-between text-sm">
            {countdown > 0 ? (
              <span className="text-gray-500">
                {t("resendOtpCountdown", { seconds: countdown })}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending}
                className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {isResending ? t("sending") : t("resendOtp")}
              </button>
            )}
          </div>

          <Controller
            control={control}
            name="newPassword"
            render={({ field }) => (
              <FormInput
                label={t("newPassword")}
                type="password"
                placeholder={t("newPasswordPlaceholder")}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                showPasswordToggle
                error={Boolean(errors.newPassword)}
                errorText={errors.newPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="restaurantId"
            render={({ field }) => (
              <FormInput
                label={t("restaurantId")}
                placeholder={t("restaurantIdPlaceholder")}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={Boolean(errors.restaurantId)}
                errorText={errors.restaurantId?.message}
              />
            )}
          />

          <Button
            type="submit"
            className={AUTH_PRIMARY_SUBMIT_BUTTON_CLASS}
            disabled={isSubmitting}
          >
            {isSubmitting ? t("resetting") : t("resetPassword")}
          </Button>

          <div className="flex items-center gap-4">
            <div className={AUTH_DIVIDER_LINE_CLASS} />
            <span className="text-sm text-gray-700">{t("or")}</span>
            <div className={AUTH_DIVIDER_LINE_CLASS} />
          </div>

          <Link href="/login" className={AUTH_SECONDARY_LINK_CLASS}>
            <ArrowLeft size={16} aria-hidden="true" />
            {t("backToLogin")}
          </Link>
        </form>
      </AuthCard>
    </AuthPageShell>
  );
};

export default ResetPasswordForm;
