import { httpClient } from "@/lib/axios";
import { getRecordValue, getStringValue, isRecord } from "@/lib/auth";

export type PosPrinterAccount = {
  id: string;
  email: string | null;
  username: string | null;
  firstName: string;
  lastName: string;
  branchId: string;
  branch: { id: string; name: string } | null;
  isActive: boolean;
  createdAt?: string;
};

export type CreatePosPrinterAccountPayload = {
  username: string;
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  branchId?: string;
};

const normalizeAccount = (value: unknown): PosPrinterAccount | null => {
  if (!isRecord(value)) return null;
  const id = getStringValue(value, "id");
  const email = getStringValue(value, "email") ?? null;
  const username = getStringValue(value, "username") ?? null;
  if (!id || (!email && !username)) return null;
  const branchRecord = getRecordValue(value, "branch");
  const branchId = getStringValue(value, "branchId") ?? getStringValue(branchRecord, "id") ?? "";
  return {
    id,
    email,
    username,
    firstName: getStringValue(value, "firstName") ?? "",
    lastName: getStringValue(value, "lastName") ?? "",
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

export const posPrinterApi = {
  list: async () => normalizePosPrinterAccounts(await httpClient.get("/pos-printer/accounts")),
  listBranches: async () => {
    const response = await httpClient.get("/pos-printer/accounts/branches");
    const root = isRecord(response) ? response : {};
    const rows = Array.isArray(root.data) ? root.data : [];
    return rows.flatMap((row) => {
      if (!isRecord(row)) return [];
      const id = getStringValue(row, "id");
      return id ? [{ id, name: getStringValue(row, "name") ?? id }] : [];
    });
  },
  create: (payload: CreatePosPrinterAccountPayload) => httpClient.post("/pos-printer/accounts", payload),
  updateStatus: (id: string, isActive: boolean) => httpClient.patch(`/pos-printer/accounts/${id}/status`, { isActive }),
  resetPassword: (id: string, newPassword: string) => httpClient.patch(`/pos-printer/accounts/${id}/password`, { newPassword }),
};
