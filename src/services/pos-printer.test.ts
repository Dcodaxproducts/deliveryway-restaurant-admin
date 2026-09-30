import { beforeEach, describe, expect, it, vi } from "vitest";
import { httpClient } from "@/lib/axios";
import {
  getPosPrinterAccountIdentifier,
  isLegacyPosPrinterContractRejection,
  isPosPrinterIdentifierConflict,
  normalizePosPrinterAccounts,
  posPrinterApi,
} from "@/services/pos-printer";

vi.mock("@/lib/axios", () => ({ httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
const getMock = vi.mocked(httpClient.get);
const postMock = vi.mocked(httpClient.post);
const patchMock = vi.mocked(httpClient.patch);

const payload = { displayName: " Kitchen  Printer ", username: " Kitchen-1 ", password: "CorrectHorseBattery1" };
const legacyRejection = {
  response: {
    status: 400,
    data: {
      message: "property username should not exist",
      error: {
        code: "VALIDATION_ERROR",
        details: [
          { name: "field", message: "property username should not exist" },
          { name: "field", message: "property displayName should not exist" },
        ],
      },
    },
  },
};

describe("POS printer account API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes username accounts and tolerates legacy fields without exposing passwords", () => {
    const accounts = normalizePosPrinterAccounts({ data: [
      {
        id: "p1", username: "Kitchen-1", displayName: "Kitchen Printer",
        email: "kitchen-1@pos-printer.feastflow.local", firstName: "Kitchen", lastName: "Printer",
        branchId: "b1", branch: { id: "b1", name: "Main" }, isActive: true, plainPassword: "must-not-be-used",
      },
      { id: "p2", email: "Legacy@Example.com", firstName: "Legacy", lastName: "Device", branchId: "b1", isActive: false },
      { id: "p3", email: "bar-2@pos-printer.feastflow.local", firstName: "Bar", lastName: "Printer", branchId: "b1", isActive: true },
    ] });

    expect(accounts).toHaveLength(3);
    expect(accounts[0]).toMatchObject({ id: "p1", username: "kitchen-1", displayName: "Kitchen Printer", branch: { id: "b1", name: "Main" }, isActive: true });
    expect(accounts[0]).not.toHaveProperty("password");
    expect(accounts[0]).not.toHaveProperty("plainPassword");
    // Legacy email-only account keeps working and derives a display name from the name fields.
    expect(accounts[1]).toMatchObject({ username: null, displayName: "Legacy Device", email: "legacy@example.com" });
    // Account created against a pre-username API still surfaces its username from the alias.
    expect(accounts[2]).toMatchObject({ username: "bar-2", displayName: "Bar Printer" });
    expect(getPosPrinterAccountIdentifier(accounts[0])).toEqual({ kind: "username", value: "kitchen-1" });
    expect(getPosPrinterAccountIdentifier(accounts[1])).toEqual({ kind: "email", value: "legacy@example.com" });
  });

  it("drops rows without an id or any identifier", () => {
    expect(normalizePosPrinterAccounts({ data: [{ id: "x" }, { username: "no-id" }, "junk"] })).toEqual([]);
  });

  it("creates accounts with the username contract and explicit branch scope for business admins", async () => {
    postMock.mockResolvedValueOnce({ data: {} });
    await posPrinterApi.create({ ...payload, branchId: "b1" });
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith("/pos-printer/accounts", {
      username: "kitchen-1", displayName: "Kitchen Printer", password: "CorrectHorseBattery1", branchId: "b1",
    });
  });

  it("omits branchId for branch admins so the API infers it and never sends legacy name fields by default", async () => {
    postMock.mockResolvedValueOnce({ data: {} });
    await posPrinterApi.create(payload);
    const body = postMock.mock.calls[0][1] as Record<string, unknown>;
    expect(body).not.toHaveProperty("branchId");
    expect(body).not.toHaveProperty("email");
    expect(body).not.toHaveProperty("firstName");
    expect(body).not.toHaveProperty("lastName");
  });

  it("falls back to the legacy email/name contract when the API rejects the username properties", async () => {
    postMock.mockRejectedValueOnce(legacyRejection).mockResolvedValueOnce({ data: {} });
    await posPrinterApi.create({ ...payload, branchId: "b1" });
    expect(postMock).toHaveBeenCalledTimes(2);
    expect(postMock).toHaveBeenLastCalledWith("/pos-printer/accounts", {
      email: "kitchen-1@pos-printer.feastflow.local", password: "CorrectHorseBattery1",
      firstName: "Kitchen", lastName: "Printer", branchId: "b1",
    });
  });

  it("does not retry other failures such as a taken username", async () => {
    const conflict = { response: { status: 409, data: { message: "Username is unavailable" } } };
    postMock.mockRejectedValueOnce(conflict);
    await expect(posPrinterApi.create(payload)).rejects.toBe(conflict);
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(isPosPrinterIdentifierConflict(conflict)).toBe(true);
    expect(isLegacyPosPrinterContractRejection(conflict)).toBe(false);
    expect(isLegacyPosPrinterContractRejection({ response: { status: 400, data: { message: "password must be longer" } } })).toBe(false);
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
