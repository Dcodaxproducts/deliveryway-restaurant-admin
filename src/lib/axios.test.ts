import { describe, expect, it } from "vitest";

import { isAuthenticationRequest } from "./axios";

describe("isAuthenticationRequest", () => {
  it.each([
    "/auth/login",
    "/auth/login?role=BUSINESS_ADMIN",
    "/auth/staff/login",
    "https://api.example.com/auth/google-login",
  ])("identifies login endpoint %s", (requestUrl) => {
    expect(isAuthenticationRequest(requestUrl)).toBe(true);
  });

  it.each(["/auth/refresh", "/users/me", "/auth/login-history"])(
    "does not classify protected endpoint %s as login",
    (requestUrl) => {
      expect(isAuthenticationRequest(requestUrl)).toBe(false);
    },
  );
});
