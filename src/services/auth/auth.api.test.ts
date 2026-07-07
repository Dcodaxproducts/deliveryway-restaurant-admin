import { beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "@/services/auth/auth.api";
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
