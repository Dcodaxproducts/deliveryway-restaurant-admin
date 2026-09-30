import { httpClient } from "@/lib/axios";
import { getRecordValue, getStringValue, isRecord } from "@/lib/auth";
import {
  normalizePosPrinterDisplayName,
  normalizePosPrinterUsername,
} from "@/validations/pos-printer";

export const POS_PRINTER_ACCOUNTS_ENDPOINT = "/pos-printer/accounts";

/**
 * Account shape returned by `GET /pos-printer/accounts` (`PosPrinterService.toResponse`).
 *
 * `username` and `displayName` are the identity fields. `email`, `firstName`, and `lastName`
 * are legacy fields the API still returns; accounts created before usernames existed have
 * `username: null` and sign in with their email.
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

/** Body of `POST /pos-printer/accounts` (`CreatePosPrinterAccountDto`). */
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
  const username = getStringValue(value, "username")?.trim().toLowerCase() || null;
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
    username,
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

/** Exact request body for `CreatePosPrinterAccountDto`; `branchId` only when provided. */
export const buildPosPrinterCreateRequest = (payload: CreatePosPrinterAccountPayload) => ({
  username: normalizePosPrinterUsername(payload.username),
  displayName: normalizePosPrinterDisplayName(payload.displayName),
  password: payload.password,
  ...(payload.branchId ? { branchId: payload.branchId } : {}),
});

const getErrorStatus = (error: unknown) => {
  if (!isRecord(error)) return undefined;
  const response = getRecordValue(error, "response");
  return typeof response?.status === "number" ? response.status : undefined;
};

/** `409 Conflict` from the API means the username (or its account identifier) is taken. */
export const isPosPrinterIdentifierConflict = (error: unknown) => getErrorStatus(error) === 409;

export const posPrinterApi = {
  list: async () => normalizePosPrinterAccounts(await httpClient.get(POS_PRINTER_ACCOUNTS_ENDPOINT)),
  create: (payload: CreatePosPrinterAccountPayload) =>
    httpClient.post(POS_PRINTER_ACCOUNTS_ENDPOINT, buildPosPrinterCreateRequest(payload)),
  updateStatus: (id: string, isActive: boolean) =>
    httpClient.patch(`${POS_PRINTER_ACCOUNTS_ENDPOINT}/${id}/status`, { isActive }),
  resetPassword: (id: string, newPassword: string) =>
    httpClient.patch(`${POS_PRINTER_ACCOUNTS_ENDPOINT}/${id}/password`, { newPassword }),
};
