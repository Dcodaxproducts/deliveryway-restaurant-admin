import { describe, expect, it } from "vitest";

import { getLoginErrorKey } from "@/lib/login-error";

const httpError = (status?: number) => ({
  isAxiosError: true,
  message: "technical detail",
  response: status ? { status, data: {} } : undefined,
});

describe("getLoginErrorKey", () => {
  it("maps invalid credentials without exposing the transport error", () => {
    expect(getLoginErrorKey(httpError(401))).toBe("invalidCredentials");
  });

  it("maps throttling and network failures to actionable messages", () => {
    expect(getLoginErrorKey(httpError(429))).toBe("loginRateLimited");
    expect(getLoginErrorKey(httpError())).toBe("loginNetworkError");
  });

  it("uses a safe generic message for unknown failures", () => {
    expect(getLoginErrorKey(new Error("secret backend detail"))).toBe("genericError");
  });
});
