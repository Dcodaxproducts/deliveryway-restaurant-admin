import { beforeEach, describe, expect, it, vi } from "vitest";
import { httpClient } from "@/lib/axios";
import { getPosPrinterAccountErrorKey, normalizePosPrinterAccounts, posPrinterApi } from "@/services/pos-printer";

vi.mock("@/lib/axios", () => ({ httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
const getMock = vi.mocked(httpClient.get);
const postMock = vi.mocked(httpClient.post);
const patchMock = vi.mocked(httpClient.patch);

describe("POS printer account API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes scoped list responses without password fields", () => {
    const accounts = normalizePosPrinterAccounts({ data: [{
      id: "p1", email: "p@example.com", username: "kitchen.printer", firstName: "Kitchen", lastName: "Printer",
      branchId: "b1", branch: { id: "b1", name: "Main" }, isActive: true,
      plainPassword: "must-not-be-used",
    }] });
    expect(accounts).toEqual([expect.objectContaining({ id: "p1", username: "kitchen.printer", branch: { id: "b1", name: "Main" }, isActive: true })]);
    expect(accounts[0]).not.toHaveProperty("password");
    expect(accounts[0]).not.toHaveProperty("plainPassword");
  });

  it("creates business-admin credentials with explicit branch scope", async () => {
    postMock.mockResolvedValueOnce({ data: {} });
    await posPrinterApi.create({ username: "front.counter", email: "p@example.com", password: "Password@123", firstName: "POS", lastName: "Printer", branchId: "b1" });
    expect(postMock).toHaveBeenCalledWith("/pos-printer/accounts", expect.objectContaining({ username: "front.counter", branchId: "b1" }));
  });

  it("keeps optional email omitted for username-only credentials", async () => {
    postMock.mockResolvedValueOnce({ data: {} });
    const payload = { username: "Verona", password: "Password@123", firstName: "Haji", lastName: "Saad", branchId: "branch-verona" };
    await posPrinterApi.create(payload);
    expect(postMock).toHaveBeenCalledWith("/pos-printer/accounts", payload);
    expect(postMock.mock.calls[0]?.[1]).not.toHaveProperty("email");
  });

  it.each([[409, "accountIdentifierUnavailable"], [400, "accountInvalid"], [422, "accountInvalid"], [403, "accountBranchForbidden"], [500, "accountActionError"]] as const)(
    "maps Nest API status %s to localized key %s without exposing details", (status, key) => {
      expect(getPosPrinterAccountErrorKey({
        response: {
          status,
          data: {
            statusCode: status,
            message: "sensitive server implementation detail",
            error: { message: "sensitive nested detail" },
          },
        },
      })).toBe(key);
    },
  );

  it("allows branch-admin payloads to omit branchId for backend inference", async () => {
    postMock.mockResolvedValueOnce({ data: {} });
    const payload = { username: "front.counter", password: "Password@123", firstName: "POS", lastName: "Printer" };
    await posPrinterApi.create(payload);
    expect(postMock).toHaveBeenCalledWith("/pos-printer/accounts", payload);
  });

  it("lists branch choices through the scoped POS printer endpoint", async () => {
    getMock.mockResolvedValueOnce({ data: [{ id: "b1", name: "Main" }] });
    await expect(posPrinterApi.listBranches()).resolves.toEqual([{ id: "b1", name: "Main" }]);
    expect(getMock).toHaveBeenCalledWith("/pos-printer/accounts/branches");
  });

  it("uses dedicated status and reset endpoints", async () => {
    patchMock.mockResolvedValue({ data: {} });
    await posPrinterApi.updateStatus("p1", false);
    await posPrinterApi.resetPassword("p1", "NewPassword@123");
    expect(patchMock).toHaveBeenNthCalledWith(1, "/pos-printer/accounts/p1/status", { isActive: false });
    expect(patchMock).toHaveBeenNthCalledWith(2, "/pos-printer/accounts/p1/password", { newPassword: "NewPassword@123" });
  });

  it("surfaces list errors for the UI error state", async () => {
    getMock.mockRejectedValueOnce(new Error("offline"));
    await expect(posPrinterApi.list()).rejects.toThrow("offline");
  });
});
