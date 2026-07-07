import {
  getRecordValue,
  isRecord,
  normalizeAuthPayload,
  normalizeUser,
  type AuthStorage,
  type AuthUser,
} from "@/lib/auth";
import { httpClient } from "@/lib/axios";
import type {
  ForgotPasswordPayload,
  GoogleLoginPayload,
  LoginPayload,
  ResendOtpPayload,
  ResetPasswordPayload,
} from "@/types/auth";

export type UpdateProfilePayload = {
  firstName: string;
  lastName: string;
  avatarUrl: string;
  phone: string;
  bio: string;
};

const unwrapEnvelope = (response: unknown) => {
  if (!isRecord(response)) return response;
  return getRecordValue(response, "data") ?? response;
};

const getHttpStatus = (error: unknown) => {
  if (!isRecord(error)) return undefined;
  const response = getRecordValue(error, "response");
  const status = response?.status;
  return typeof status === "number" ? status : undefined;
};

const shouldTryStaffLogin = (payload: LoginPayload, error: unknown) => {
  if (payload.role !== "BUSINESS_ADMIN") return false;
  const status = getHttpStatus(error);
  return status === 401 || status === 403;
};

const toStaffLoginPayload = (payload: LoginPayload) => ({
  email: payload.email,
  password: payload.password,
});

export const authApi = {
  loginWithFallback: async (payload: LoginPayload) => {
    const { role, ...credentials } = payload;

    if (role === "STAFF") {
      const response = await httpClient.post("/auth/staff/login", credentials);
      return normalizeAuthPayload(response);
    }

    try {
      const response = await httpClient.post("/auth/login", payload);
      return normalizeAuthPayload(response);
    } catch (error) {
      const response = await httpClient.post("/auth/staff/login", credentials);
      return normalizeAuthPayload(response);
    }
  },
  googleLogin: async (payload: GoogleLoginPayload) => {
    const response = await httpClient.post("/auth/google-login", payload);
    return normalizeAuthPayload(response);
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

    return normalizeUser(unwrapEnvelope(response), fallback?.user ?? null);
  },
  updateProfile: (payload: UpdateProfilePayload) =>
    httpClient.patch("/auth/me/profile", payload),
  verifyEmail: (payload: Record<string, unknown>) =>
    httpClient.post("/auth/verify-email", payload),
  registerTenant: (payload: unknown) =>
    httpClient.post("/auth/register-tenant", payload),
};
