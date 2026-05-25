import { describe, expect, it } from "vitest";

import { loginSchema, resetPasswordSchema } from "./auth";

describe("auth validation schemas", () => {
  it("requires email and password for login", () => {
    expect(loginSchema.safeParse({ email: "", password: "" }).success).toBe(false);
  });

  it("fails invalid login email", () => {
    expect(loginSchema.safeParse({ email: "bad-email", password: "secret" }).success).toBe(false);
  });

  it("accepts valid login", () => {
    expect(loginSchema.safeParse({ email: "admin@example.com", password: "secret" }).success).toBe(true);
  });

  it("requires OTP and minimum password length for reset", () => {
    expect(
      resetPasswordSchema.safeParse({
        email: "admin@example.com",
        restaurantId: "restaurant-1",
        otp: "",
        newPassword: "short",
      }).success
    ).toBe(false);
  });
});
