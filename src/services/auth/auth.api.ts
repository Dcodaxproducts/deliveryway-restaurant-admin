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
import { normalizePosPrinterIdentifier } from "@/validations/pos-printer";

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

export const POS_PRINTER_LOGIN_ENDPOINT = "/auth/pos-printer/login";

/**
 * Body of `POST /auth/pos-printer/login` (`PosPrinterLoginDto`): the API resolves
 * `identifier` against the username first and the legacy account email second.
 */
export type PosPrinterLoginPayload = { identifier: string; password: string };

export const buildPosPrinterLoginRequest = (payload: PosPrinterLoginPayload) => ({
  identifier: normalizePosPrinterIdentifier(payload.identifier),
  password: payload.password,
});

export const authApi = {
  posPrinterLogin: async (payload: PosPrinterLoginPayload) => {
    const response = await httpClient.post(
      POS_PRINTER_LOGIN_ENDPOINT,
      buildPosPrinterLoginRequest(payload),
    );
    return normalizeAuthPayload(response);
  },
  logout: () => httpClient.post("/auth/logout"),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    httpClient.patch("/auth/change-password", payload),
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
      if (role && role !== "BUSINESS_ADMIN") {
        throw error;
      }

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
