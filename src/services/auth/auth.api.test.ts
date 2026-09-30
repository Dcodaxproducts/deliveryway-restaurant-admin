import { beforeEach, describe, expect, it, vi } from "vitest";

import { authApi, POS_PRINTER_LOGIN_ENDPOINT } from "@/services/auth/auth.api";
import { httpClient } from "@/lib/axios";

vi.mock("@/lib/axios", () => ({
  httpClient: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const postMock = vi.mocked(httpClient.post);

const makeHttpError = (status: number, message = "Invalid credentials") => ({
  response: { status, data: { message } },
});

describe("authApi POS printer authentication", () => {
  beforeEach(() => vi.clearAllMocks());

  it("posts identifier and password directly to the dedicated login endpoint", async () => {
    postMock.mockResolvedValueOnce({
      data: {
        accessToken: "pos-token",
        user: {
          id: "p1", email: "kitchen-1@pos-printer.feastflow.local", username: "kitchen-1",
          displayName: "Kitchen Printer", role: "STAFF", actorType: "STAFF", accountType: "POS_PRINTER", branchId: "b1",
        },
      },
    });
    const result = await authApi.posPrinterLogin({ identifier: "kitchen-1", password: "Password@123" });
    expect(POS_PRINTER_LOGIN_ENDPOINT).toBe("/auth/pos-printer/login");
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith("/auth/pos-printer/login", { identifier: "kitchen-1", password: "Password@123" });
    expect(result.user?.accountType).toBe("POS_PRINTER");
    expect(result.user?.branchId).toBe("b1");
  });

  it("normalizes the identifier and accepts a legacy email without remapping either", async () => {
    postMock.mockResolvedValue({ data: { accessToken: "pos-token", user: { id: "p1", email: "x", accountType: "POS_PRINTER" } } });
    await authApi.posPrinterLogin({ identifier: " Kitchen-1 ", password: "Password@123" });
    expect(postMock).toHaveBeenLastCalledWith("/auth/pos-printer/login", { identifier: "kitchen-1", password: "Password@123" });

    await authApi.posPrinterLogin({ identifier: "Legacy@Example.com", password: "Password@123" });
    expect(postMock).toHaveBeenLastCalledWith("/auth/pos-printer/login", { identifier: "legacy@example.com", password: "Password@123" });

    for (const [, body] of postMock.mock.calls) {
      expect(Object.keys(body as object).sort()).toEqual(["identifier", "password"]);
      expect(String((body as { identifier: string }).identifier)).not.toContain("pos-printer.feastflow.local");
    }
  });

  it("passes login failures through for the UI to render a generic error", async () => {
    const error = makeHttpError(401, "backend detail");
    postMock.mockRejectedValueOnce(error);
    await expect(authApi.posPrinterLogin({ identifier: "kitchen-1", password: "bad" })).rejects.toBe(error);
    expect(postMock).toHaveBeenCalledTimes(1);
  });
});

describe("authApi.loginWithFallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps normal business admin login on /auth/login", async () => {
    postMock.mockResolvedValueOnce({
      data: {
        accessToken: "business-token",
        user: { id: "admin-1", email: "admin@example.com", role: "BUSINESS_ADMIN" },
      },
    });

    const result = await authApi.loginWithFallback({
      email: "admin@example.com",
      password: "Password@123",
      role: "BUSINESS_ADMIN",
    });

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith("/auth/login", {
      email: "admin@example.com",
      password: "Password@123",
      role: "BUSINESS_ADMIN",
    });
    expect(result.user?.role).toBe("BUSINESS_ADMIN");
  });

  it("falls back to dedicated staff login for business-admin credential failures", async () => {
    postMock
      .mockRejectedValueOnce(makeHttpError(401))
      .mockResolvedValueOnce({
        data: {
          accessToken: "staff-token",
          user: {
            id: "staff-1",
            email: "staff@example.com",
            role: "STAFF",
            actorType: "STAFF",
            restaurantAccess: { restaurantIds: ["restaurant-1"], branchIds: [] },
            staffRole: { permissions: [{ access: "menu-items", operations: ["read"] }] },
          },
        },
      });

    const result = await authApi.loginWithFallback({
      email: "staff@example.com",
      password: "Password@123",
      role: "BUSINESS_ADMIN",
    });

    expect(postMock).toHaveBeenNthCalledWith(1, "/auth/login", {
      email: "staff@example.com",
      password: "Password@123",
      role: "BUSINESS_ADMIN",
    });
    expect(postMock).toHaveBeenNthCalledWith(2, "/auth/staff/login", {
      email: "staff@example.com",
      password: "Password@123",
    });
    expect(result.user?.role).toBe("STAFF");
    expect(result.user?.actorType).toBe("STAFF");
  });

  it("does not mask branch-admin login failures with staff fallback", async () => {
    const error = makeHttpError(401);
    postMock.mockRejectedValueOnce(error);

    await expect(
      authApi.loginWithFallback({
        email: "branch@example.com",
        password: "Password@123",
        role: "BRANCH_ADMIN",
      }),
    ).rejects.toBe(error);

    expect(postMock).toHaveBeenCalledTimes(1);
  });
});
