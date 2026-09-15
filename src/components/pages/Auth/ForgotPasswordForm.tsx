"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

      router.push(
        `/reset-password?email=${encodeURIComponent(values.email)}&restaurantId=${values.restaurantId ?? ""}`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("genericError"));
    }
  };

  return (
    <AuthPageShell>
      <AuthCard>
        <AuthBrand />
        <div className="mb-5 mt-7 flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/[0.09] text-primary">
            <KeyRound size={21} aria-hidden="true" />
          </div>
        </div>

        <h1 id="auth-page-title" className={AUTH_TITLE_CLASS}>
          {t("forgotPasswordTitle")}
        </h1>

        <p className={AUTH_DESCRIPTION_CLASS}>
          {t("forgotPasswordDescription")}
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

          <Link href="/login" className={AUTH_SECONDARY_LINK_CLASS}>
            <ArrowLeft size={16} aria-hidden="true" />
            {t("backToLogin")}
          </Link>
        </form>
      </AuthCard>
    </AuthPageShell>
  );
};

export default ForgotPasswordForm;
