import { getLocalizedMessage } from "@/lib/localized-message";
import { z } from "zod";
import { validationMessages } from "@/lib/validation";

export const loginSchema = z.object({
  email: z.string().min(1, validationMessages.required).email(validationMessages.email),
  password: z.string().min(1, validationMessages.required),
  role: z.enum(["BUSINESS_ADMIN", "BRANCH_ADMIN", "STAFF"]).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, validationMessages.required).email(validationMessages.email),
  restaurantId: z.string().optional(),
});

export const resetPasswordSchema = z.object({
  email: z.string().min(1, validationMessages.required).email(validationMessages.email),
  restaurantId: z.string().min(1, getLocalizedMessage("validation055")),
  otp: z.string().min(5, getLocalizedMessage("validation088")),
  newPassword: z.string().min(8, validationMessages.passwordMin),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
