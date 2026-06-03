"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import FormInput from "@/components/forms/common/FormInput";
import AuthPageShell, {
  AUTH_CARD_CLASS,
  AUTH_DESCRIPTION_CLASS,
  AUTH_DIVIDER_LINE_CLASS,
  AUTH_PRIMARY_SUBMIT_BUTTON_CLASS,
  AUTH_TITLE_CLASS,
} from "@/components/pages/Auth/components/AuthPageShell";
import { Button } from "@/components/ui/button";
import { authApi } from "@/services/auth/auth.api";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/validations/auth";

const ForgotPasswordForm = () => {
  const router = useRouter();
  const t = useTranslations("auth");
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      restaurantId: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await authApi.forgotPassword(values);
      toast.success(t("forgotPasswordSuccess"));

      router.push(`/reset-password?email=${encodeURIComponent(values.email)}&restaurantId=${values.restaurantId ?? ""}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("genericError"));
    }
  };

  return (
    <AuthPageShell>
      <div className={AUTH_CARD_CLASS}>
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 1C10.6739 1 9.40215 1.52678 8.46447 2.46447C7.52678 3.40215 7 4.67392 7 6V8H6C5.46957 8 4.96086 8.21071 4.58579 8.58579C4.21071 8.96086 4 9.46957 4 10V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V10C20 9.46957 19.7893 8.96086 19.4142 8.58579C19.0391 8.21071 18.5304 8 18 8H17V6C17 5.34339 16.8707 4.69321 16.6194 4.08658C16.3681 3.47995 15.9998 2.92876 15.5355 2.46447C15.0712 2.00017 14.52 1.63188 13.9134 1.3806C13.3068 1.12933 12.6566 1 12 1ZM12 2.9C13.71 2.9 15.1 4.29 15.1 6V8H8.9V6C8.9 4.29 10.29 2.9 12 2.9ZM12.19 10.5C13.13 10.5 13.88 10.71 14.42 11.12C14.96 11.54 15.23 12.1 15.23 12.8C15.23 13.24 15.08 13.63 14.79 14C14.5 14.36 14.12 14.64 13.66 14.85C13.4 15 13.23 15.15 13.14 15.32C13.05 15.5 13 15.72 13 16H11C11 15.5 11.1 15.16 11.29 14.92C11.5 14.68 11.84 14.4 12.36 14.08C12.62 13.94 12.83 13.76 13 13.54C13.14 13.33 13.22 13.08 13.22 12.8C13.22 12.5 13.13 12.28 12.95 12.11C12.77 11.93 12.5 11.85 12.19 11.85C11.92 11.85 11.7 11.92 11.5 12.06C11.34 12.2 11.24 12.41 11.24 12.69H9.27C9.22 12 9.5 11.4 10.05 11.04C10.59 10.68 11.3 10.5 12.19 10.5ZM11 17H13V19H11V17Z" fill="#ECF0F4" />
            </svg>
          </div>
        </div>

        <h1 className={AUTH_TITLE_CLASS}>
          {t("forgotPasswordTitle")}
        </h1>

        <p className={AUTH_DESCRIPTION_CLASS}>
          {t("forgotPasswordDescription")}
        </p>

        <form className="mt-8 space-y-6" noValidate onSubmit={handleSubmit(onSubmit)}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <FormInput
                label={t("email")}
                placeholder={t("emailPlaceholderTitle")}
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
            name="restaurantId"
            render={({ field }) => (
              <FormInput
                label={t("restaurantId")}
                placeholder={t("restaurantIdPlaceholder")}
                value={field.value ?? ""}
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
            {isSubmitting ? t("sending") : t("sendResetLink")}
          </Button>

          <div className="flex items-center gap-4">
            <div className={AUTH_DIVIDER_LINE_CLASS} />
            <span className="text-sm text-gray-700">{t("or")}</span>
            <div className={AUTH_DIVIDER_LINE_CLASS} />
          </div>

          <Link href="/login" className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] border border-gray-300 text-sm font-medium text-blue-600 transition hover:bg-gray-50">
            <ArrowLeft size={16} />
            {t("backToLogin")}
          </Link>
        </form>
      </div>
    </AuthPageShell>
  );
};

export default ForgotPasswordForm;
