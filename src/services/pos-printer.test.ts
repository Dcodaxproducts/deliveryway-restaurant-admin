import { beforeEach, describe, expect, it, vi } from "vitest";
import { httpClient } from "@/lib/axios";
import {
  getPosPrinterAccountIdentifier,
  isPosPrinterIdentifierConflict,
  normalizePosPrinterBranches,
  normalizePosPrinterAccounts,
  POS_PRINTER_ACCOUNTS_ENDPOINT,
  POS_PRINTER_BRANCHES_ENDPOINT,
  posPrinterApi,
} from "@/services/pos-printer";

vi.mock("@/lib/axios", () => ({ httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
const getMock = vi.mocked(httpClient.get);
const postMock = vi.mocked(httpClient.post);
const patchMock = vi.mocked(httpClient.patch);

const payload = { displayName: " Kitchen  Printer ", username: " Kitchen-1 ", password: "CorrectHorseBattery1" };

describe("POS printer account API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes username accounts and legacy email accounts without exposing passwords", () => {
    const accounts = normalizePosPrinterAccounts({ data: [
      {
        id: "p1", username: "Kitchen-1", displayName: "Kitchen Printer",
        email: "kitchen-1@pos-printer.feastflow.local", firstName: "Kitchen", lastName: "Printer",
        branchId: "b1", branch: { id: "b1", name: "Main" }, isActive: true, plainPassword: "must-not-be-used",
      },
      { id: "p2", username: null, email: "Legacy@Example.com", firstName: "Legacy", lastName: "Device", branchId: "b1", isActive: false },
    ] });

    expect(accounts).toHaveLength(2);
    expect(accounts[0]).toMatchObject({ id: "p1", username: "kitchen-1", displayName: "Kitchen Printer", branch: { id: "b1", name: "Main" }, isActive: true });
    expect(accounts[0]).not.toHaveProperty("password");
    expect(accounts[0]).not.toHaveProperty("plainPassword");
    // Legacy email-only account keeps working and derives a display name from the name fields.
    expect(accounts[1]).toMatchObject({ username: null, displayName: "Legacy Device", email: "legacy@example.com" });
    expect(getPosPrinterAccountIdentifier(accounts[0])).toEqual({ kind: "username", value: "kitchen-1" });
    expect(getPosPrinterAccountIdentifier(accounts[1])).toEqual({ kind: "email", value: "legacy@example.com" });
  });

  it("never derives a username from an email alias; only the API username field counts", () => {
    const [account] = normalizePosPrinterAccounts({ data: [
      { id: "p3", email: "bar-2@pos-printer.feastflow.local", firstName: "Bar", lastName: "Printer", branchId: "b1", isActive: true },
    ] });
    expect(account).toMatchObject({ username: null, displayName: "Bar Printer", email: "bar-2@pos-printer.feastflow.local" });
    expect(getPosPrinterAccountIdentifier(account)).toEqual({ kind: "email", value: "bar-2@pos-printer.feastflow.local" });
  });

  it("drops rows without an id or any identifier", () => {
    expect(normalizePosPrinterAccounts({ data: [{ id: "x" }, { username: "no-id" }, "junk"] })).toEqual([]);
  });

  it("creates accounts by posting username, displayName, password, and branchId directly", async () => {
    postMock.mockResolvedValueOnce({ data: {} });
    await posPrinterApi.create({ ...payload, branchId: "b1" });
    expect(POS_PRINTER_ACCOUNTS_ENDPOINT).toBe("/pos-printer/accounts");
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith("/pos-printer/accounts", {
      username: "kitchen-1", displayName: "Kitchen Printer", password: "CorrectHorseBattery1", branchId: "b1",
    });
  });

  it("omits branchId for branch admins so the API infers it and never sends legacy name fields", async () => {
    postMock.mockResolvedValueOnce({ data: {} });
    await posPrinterApi.create(payload);
    const body = postMock.mock.calls[0][1] as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(["displayName", "password", "username"]);
  });

  it("loads branch choices through the scoped POS printer endpoint", async () => {
    getMock.mockResolvedValueOnce({ data: [{ id: "b1", name: "Main" }, { id: "b2" }, null] });

    await expect(posPrinterApi.listBranches()).resolves.toEqual([
      { id: "b1", name: "Main" },
      { id: "b2", name: "b2" },
    ]);
    expect(POS_PRINTER_BRANCHES_ENDPOINT).toBe("/pos-printer/accounts/branches");
    expect(getMock).toHaveBeenCalledWith("/pos-printer/accounts/branches");
    expect(normalizePosPrinterBranches({ data: "invalid" })).toEqual([]);
  });

  it("does not retry with a legacy payload when the API rejects the request", async () => {
    const rejection = { response: { status: 400, data: { message: "property username should not exist" } } };
    postMock.mockRejectedValueOnce(rejection);
    await expect(posPrinterApi.create({ ...payload, branchId: "b1" })).rejects.toBe(rejection);
    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it("surfaces a taken username as a conflict", async () => {
    const conflict = { response: { status: 409, data: { message: "Username is unavailable" } } };
    postMock.mockRejectedValueOnce(conflict);
    await expect(posPrinterApi.create(payload)).rejects.toBe(conflict);
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(isPosPrinterIdentifierConflict(conflict)).toBe(true);
    expect(isPosPrinterIdentifierConflict({ response: { status: 400, data: { message: "password must be longer" } } })).toBe(false);
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
