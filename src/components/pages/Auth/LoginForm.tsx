"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, type FormEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

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
        throw new Error("Invalid login response");
      }

      if (!isAllowedAdminRole(user.role)) {
        toast.error("You are not authorized to access this admin panel");
        return;
      }

      if (user.role === "BRANCH_ADMIN" && !user.branchId) {
        toast.error("Branch admin account is missing branch assignment");
        return;
      }

      login(authPayload);
      toast.success(`Login successful as ${getRoleLabel(user.role)}`);

      const defaultRedirectPath = user.role === "BRANCH_ADMIN" ? "/branch-workspace" : "/";
      const redirectPath = getSafeRedirectPath(searchParams.get("redirect") ?? defaultRedirectPath);

      router.push(redirectPath);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
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
          Try <br />
          <span className="text-primary">SaaS Based Food Delivery</span>
          <br />
          to build your business
        </h1>

        <p className="mt-3 text-center text-sm text-gray-400">
          Digitalize your business and empowering growth
        </p>

        <form className="mt-10 space-y-6" noValidate onSubmit={handleFormSubmit}>
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
            name="password"
            render={({ field }) => (
              <FormInput
                label="Password"
                type="password"
                placeholder="Enter your password"
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
              Remember me
            </label>

            <Link href="/forgot-password" className="text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleLoginClick}
            className="h-[48px] w-full rounded-[12px] text-base"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-900">or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <button
            type="button"
            className="flex h-[48px] w-full items-center justify-center gap-3 rounded-[12px] border border-[#BBBBBB] text-sm font-medium transition hover:bg-gray-50"
          >
            <Image src="/google_icon.png" alt="Google" width={18} height={18} />
            Sign in With Google
          </button>
        </form>
      </div>
    </AuthPageShell>
  );
};

export default LoginForm;
