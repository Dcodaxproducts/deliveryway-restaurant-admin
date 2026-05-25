import { normalizeAuthPayload, normalizeUser, type AuthStorage, type AuthUser } from "@/lib/auth";
import { httpClient } from "@/lib/axios";
import type {
  ForgotPasswordPayload,
  LoginPayload,
  ResendOtpPayload,
  ResetPasswordPayload,
} from "@/types/auth";

export const authApi = {
  loginWithFallback: async (payload: LoginPayload) => {
    let lastError: Error | null = null;

    for (const endpoint of ["/auth/staff/login", "/auth/login"]) {
      try {
        const response = await httpClient.post(endpoint, payload);
        return normalizeAuthPayload(response);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Login failed");
      }
    }

    throw lastError || new Error("Login failed");
  },
  forgotPassword: (payload: ForgotPasswordPayload) =>
    httpClient.post("/auth/forgot-password", payload),
  resetPassword: (payload: ResetPasswordPayload) =>
    httpClient.post("/auth/reset-password", payload),
  resendOtp: (payload: ResendOtpPayload) =>
    httpClient.post("/auth/resend-otp", payload),
  me: async (accessToken?: string, fallback?: AuthStorage | null): Promise<AuthUser | null> => {
    const response = await httpClient.get("/auth/me", {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });

    return normalizeUser((response as any)?.data ?? response, fallback?.user ?? null);
  },
  verifyEmail: (payload: Record<string, unknown>) =>
    httpClient.post("/auth/verify-email", payload),
  registerTenant: (payload: unknown) =>
    httpClient.post("/auth/register-tenant", payload),
};
