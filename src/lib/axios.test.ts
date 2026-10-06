import { describe, expect, it } from "vitest";

import {
  getRotatedAccessToken,
  isAuthenticationRequest,
  shouldClearAuthAfterRefreshFailure,
} from "./axios";

describe("isAuthenticationRequest", () => {
  it.each([
    "/auth/login",
    "/auth/login?role=BUSINESS_ADMIN",
    "/auth/staff/login",
    "/auth/pos-printer/login",
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

  it.each([400, 401, 403, 422])(
    "clears an invalid refresh session after HTTP %s",
    (status) => {
      expect(shouldClearAuthAfterRefreshFailure(status)).toBe(true);
    },
  );

  it.each([undefined, 0, 429, 500, 502, 503])(
    "preserves a printer session after transient refresh status %s",
    (status) => {
      expect(shouldClearAuthAfterRefreshFailure(status)).toBe(false);
    },
  );

  it("reuses a token rotated by another tab instead of clearing auth", () => {
    expect(
      getRotatedAccessToken("old-refresh", {
        accessToken: "new-access",
        refreshToken: "new-refresh",
      }),
    ).toBe("new-access");
    expect(
      getRotatedAccessToken("same-refresh", {
        accessToken: "old-access",
        refreshToken: "same-refresh",
      }),
    ).toBeNull();
  });
});
