import { z } from "zod";
import { validationMessages } from "@/lib/validation";

export const loginSchema = z.object({
  email: z.string().min(1, validationMessages.required).email(validationMessages.email),
  password: z.string().min(1, validationMessages.required),
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, validationMessages.required).email(validationMessages.email),
  restaurantId: z.string().optional(),
});

export const resetPasswordSchema = z.object({
  email: z.string().min(1, validationMessages.required).email(validationMessages.email),
  restaurantId: z.string().min(1, "Invalid restaurant ID"),
  otp: z.string().min(5, "Please enter the 5 digit OTP"),
  newPassword: z.string().min(8, validationMessages.passwordMin),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
