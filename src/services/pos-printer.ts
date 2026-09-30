import { httpClient } from "@/lib/axios";
import { getRecordValue, getStringValue, isRecord } from "@/lib/auth";
import {
  buildPosPrinterLoginEmail,
  getPosPrinterUsernameFromEmail,
  normalizePosPrinterDisplayName,
  normalizePosPrinterUsername,
  splitPosPrinterDisplayName,
} from "@/validations/pos-printer";

/**
 * Account shape returned by `GET /pos-printer/accounts`.
 *
 * `username` and `displayName` are the primary identity fields (platform API
 * `PosPrinterService.toResponse`). `email`, `firstName`, and `lastName` are legacy fields
 * that older accounts and older API versions still return; they are tolerated, never required.
 */
export type PosPrinterAccount = {
  id: string;
  username: string | null;
  displayName: string;
  email: string;
  firstName: string;
  lastName: string;
  branchId: string;
  branch: { id: string; name: string } | null;
  isActive: boolean;
  createdAt?: string;
};

/** Primary UX contract: display name, username, initial password, branch. */
export type CreatePosPrinterAccountPayload = {
  displayName: string;
  username: string;
  password: string;
  branchId?: string;
};

export type PosPrinterAccountIdentifier = { kind: "username" | "email"; value: string };

/** Login identifier to show for an account: username first, legacy email otherwise. */
export const getPosPrinterAccountIdentifier = (
  account: Pick<PosPrinterAccount, "username" | "email">
): PosPrinterAccountIdentifier =>
  account.username
    ? { kind: "username", value: account.username }
    : { kind: "email", value: account.email };

const normalizeAccount = (value: unknown): PosPrinterAccount | null => {
  if (!isRecord(value)) return null;
  const id = getStringValue(value, "id");
  const email = getStringValue(value, "email")?.trim().toLowerCase() ?? "";
  const username =
    getStringValue(value, "username")?.trim().toLowerCase() ||
    getStringValue(value, "loginUsername")?.trim().toLowerCase() ||
    getPosPrinterUsernameFromEmail(email);
  if (!id || (!email && !username)) return null;
  const firstName = getStringValue(value, "firstName")?.trim() ?? "";
  const lastName = getStringValue(value, "lastName")?.trim() ?? "";
  const displayName =
    normalizePosPrinterDisplayName(getStringValue(value, "displayName") ?? "") ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    username ||
    email;
  const branchRecord = getRecordValue(value, "branch");
  const branchId = getStringValue(value, "branchId") ?? getStringValue(branchRecord, "id") ?? "";
  return {
    id,
    username: username || null,
    displayName,
    email,
    firstName,
    lastName,
    branchId,
    branch: branchRecord && getStringValue(branchRecord, "id") ? {
      id: getStringValue(branchRecord, "id") ?? branchId,
      name: getStringValue(branchRecord, "name") ?? branchId,
    } : null,
    isActive: value.isActive === true,
    createdAt: getStringValue(value, "createdAt"),
  };
};

export const normalizePosPrinterAccounts = (response: unknown) => {
  const root = isRecord(response) ? response : {};
  const data = root.data;
  const rows = Array.isArray(data) ? data : Array.isArray(response) ? response : [];
  return rows.map(normalizeAccount).filter((account): account is PosPrinterAccount => Boolean(account));
};

/** Request body for the current `CreatePosPrinterAccountDto` (username + displayName). */
export const buildPosPrinterCreateRequest = (payload: CreatePosPrinterAccountPayload) => ({
  username: normalizePosPrinterUsername(payload.username),
  displayName: normalizePosPrinterDisplayName(payload.displayName),
  password: payload.password,
  ...(payload.branchId ? { branchId: payload.branchId } : {}),
});

/**
 * Request body for the pre-username DTO (`email` + `firstName` + `lastName`). The synthetic
 * email alias and the name split match the API's own derivation, so an account created this
 * way signs in with the same username and displays the same way once the API is upgraded.
 */
export const buildLegacyPosPrinterCreateRequest = (payload: CreatePosPrinterAccountPayload) => ({
  email: buildPosPrinterLoginEmail(payload.username),
  password: payload.password,
  ...splitPosPrinterDisplayName(payload.displayName),
  ...(payload.branchId ? { branchId: payload.branchId } : {}),
});

const collectStrings = (value: unknown, depth = 0): string[] => {
  if (depth > 4) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap((item) => collectStrings(item, depth + 1));
  if (isRecord(value)) return Object.values(value).flatMap((item) => collectStrings(item, depth + 1));
  return [];
};

const getErrorStatus = (error: unknown) => {
  if (!isRecord(error)) return undefined;
  const response = getRecordValue(error, "response");
  return typeof response?.status === "number" ? response.status : undefined;
};

/**
 * An API without the username contract runs `forbidNonWhitelisted` validation and rejects
 * the new properties with "property username should not exist".
 */
export const isLegacyPosPrinterContractRejection = (error: unknown) => {
  if (getErrorStatus(error) !== 400 || !isRecord(error)) return false;
  const data = getRecordValue(error, "response")?.data;
  return collectStrings(data).some((message) =>
    /property (username|displayName) should not exist/i.test(message)
  );
};

/** `409 Conflict` from the API means the username (or its email alias) is already taken. */
export const isPosPrinterIdentifierConflict = (error: unknown) => getErrorStatus(error) === 409;

export const posPrinterApi = {
  list: async () => normalizePosPrinterAccounts(await httpClient.get("/pos-printer/accounts")),
  create: async (payload: CreatePosPrinterAccountPayload) => {
    try {
      return await httpClient.post("/pos-printer/accounts", buildPosPrinterCreateRequest(payload));
    } catch (error) {
      if (!isLegacyPosPrinterContractRejection(error)) throw error;
      return httpClient.post("/pos-printer/accounts", buildLegacyPosPrinterCreateRequest(payload));
    }
  },
  updateStatus: (id: string, isActive: boolean) => httpClient.patch(`/pos-printer/accounts/${id}/status`, { isActive }),
  resetPassword: (id: string, newPassword: string) => httpClient.patch(`/pos-printer/accounts/${id}/password`, { newPassword }),
};
