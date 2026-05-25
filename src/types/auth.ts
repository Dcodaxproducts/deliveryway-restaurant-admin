import type { AuthStorage, AuthUser } from "@/lib/auth";

export type LoginPayload = {
  email: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
  restaurantId?: string;
};

export type ResetPasswordPayload = {
  email: string;
  restaurantId: string;
  otp: string;
  newPassword: string;
};

export type ResendOtpPayload = {
  email: string;
  restaurantId: string;
};

export type AuthResponse = AuthStorage & {
  user?: AuthUser | null;
};
