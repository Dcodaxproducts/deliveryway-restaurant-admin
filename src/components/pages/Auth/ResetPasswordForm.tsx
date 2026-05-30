"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

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
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/validations/auth";

const ResetPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      toast.success("Password reset successfully!");
      router.push("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const handleResendOtp = async () => {
    const { email, restaurantId } = getValues();

    if (!email || !restaurantId) {
      toast.error("Missing email or restaurant id");
      return;
    }

    try {
      setIsResending(true);
      await authApi.resendOtp({ email, restaurantId });
      toast.success("OTP resent successfully");
      setCountdown(60);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthPageShell>
      <div className={AUTH_CARD_CLASS}>
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none">
              <path d="M12 1C9 1 7 3 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8H17V6C17 3 15 1 12 1Z" fill="#ECF0F4" />
            </svg>
          </div>
        </div>

        <h1 className={AUTH_TITLE_CLASS}>
          Reset your password
        </h1>

        <p className={AUTH_DESCRIPTION_CLASS}>
          Enter the OTP sent to your email and choose a new password.
        </p>

        <form className="mt-8 space-y-6" noValidate onSubmit={handleSubmit(onSubmit)}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <FormInput
                label="Email"
                placeholder="Enter your email"
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
                label="OTP"
                placeholder="Enter 5 digit OTP"
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
              <span className="text-gray-500">Resend OTP in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending}
                className="text-blue-600 hover:underline"
              >
                {isResending ? "Sending..." : "Resend OTP"}
              </button>
            )}
          </div>

          <Controller
            control={control}
            name="newPassword"
            render={({ field }) => (
              <FormInput
                label="New Password"
                type="password"
                placeholder="Enter new password"
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
                label="Restaurant ID"
                placeholder="Enter Your restaurant id"
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
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </Button>

          <div className="flex items-center gap-4">
            <div className={AUTH_DIVIDER_LINE_CLASS} />
            <span className="text-sm text-gray-700">or</span>
            <div className={AUTH_DIVIDER_LINE_CLASS} />
          </div>

          <Link href="/login" className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] border border-gray-300 text-sm font-medium text-blue-600 transition hover:bg-gray-50">
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </form>
      </div>
    </AuthPageShell>
  );
};

export default ResetPasswordForm;
