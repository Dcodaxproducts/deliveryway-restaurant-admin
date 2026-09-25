import { api } from "@/lib/axios";
import { parseSchema } from "@/lib/zod-errors";
import {
  BranchValues,
  BulkBranchSchema,
  BulkBranchValues,
  OpeningHoursValues,
} from "@/validations/branches";
import type { BranchSettings } from "@/types/branch";
import type { HolidayOpeningHoursPayload } from "@/types/opening-hours";

/**
 * ==============================
 * BRANCH APIS
 * ==============================
 */

export const createBranch = async (payload: Omit<BranchValues, "isMain">) => {
  const { data } = await api.post("/branches", payload);
  return data;
};

export const getBranches = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortOrder?: "ASC" | "DESC";
  withDeleted?: boolean;
  includeInactive?: boolean;
  restaurantId?: string;
  lat?: string;
  lng?: string;
}) => {
  const { data } = await api.get("/branches", { params });
  return data;
};

export const getBranch = async (id: string) => {
  const { data } = await api.get(`/branches/${id}`);
  return data.data;
};

export type BranchMenuAssignment = {
  branchId: string;
  menuIds: string[];
  defaultMenuId: string | null;
};

export type ReplaceBranchMenuAssignmentPayload = {
  menuIds: [string, ...string[]];
  defaultMenuId: string;
};

const toCanonicalMenuId = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const normalizeBranchMenuAssignment = (
  response: unknown,
  branchId: string,
): BranchMenuAssignment => {
  const envelope =
    response && typeof response === "object" && "data" in response
      ? (response as { data?: unknown }).data
      : response;
  const data =
    envelope && typeof envelope === "object"
      ? (envelope as Record<string, unknown>)
      : {};
  const canonicalMenuIds = Array.isArray(data.menuIds)
    ? data.menuIds.flatMap((id) => {
        const canonicalId = toCanonicalMenuId(id);
        return canonicalId ? [canonicalId] : [];
      })
    : [];
  const assignmentMenuIds = Array.isArray(data.assignments)
    ? data.assignments.flatMap((assignment) => {
        if (!assignment || typeof assignment !== "object") return [];
        const restaurantMenuId = (assignment as { restaurantMenuId?: unknown })
          .restaurantMenuId;
        const canonicalId = toCanonicalMenuId(restaurantMenuId);
        return canonicalId ? [canonicalId] : [];
      })
    : [];
  const legacyMenuIds = Array.isArray(data.menus)
    ? data.menus.flatMap((menu) => {
        if (!menu || typeof menu !== "object") return [];
        const canonicalId = toCanonicalMenuId(
          (menu as { id?: unknown }).id,
        );
        return canonicalId ? [canonicalId] : [];
      })
    : [];
  const menuIds = Array.from(
    new Set(
      canonicalMenuIds.length
        ? canonicalMenuIds
        : assignmentMenuIds.length
          ? assignmentMenuIds
          : legacyMenuIds,
    ),
  );

  return {
    branchId: typeof data.branchId === "string" ? data.branchId : branchId,
    menuIds,
    defaultMenuId: toCanonicalMenuId(data.defaultMenuId),
  };
};

export const getBranchMenuAssignment = async (branchId: string) => {
  const { data } = await api.get(`/branches/${branchId}/menus`);
  return normalizeBranchMenuAssignment(data, branchId);
};

export const replaceBranchMenuAssignment = async (
  branchId: string,
  payload: ReplaceBranchMenuAssignmentPayload,
) => {
  const menuIds = Array.from(
    new Set(payload.menuIds.map(toCanonicalMenuId).filter(Boolean)),
  ) as string[];
  const defaultMenuId = toCanonicalMenuId(payload.defaultMenuId);

  if (!menuIds.length || !defaultMenuId || !menuIds.includes(defaultMenuId)) {
    throw new Error(
      "Branch menu assignment requires menuIds and a matching defaultMenuId",
    );
  }

  const { data } = await api.put(`/branches/${branchId}/menus`, {
    menuIds,
    defaultMenuId,
  });
  return normalizeBranchMenuAssignment(data, branchId);
};

export type BranchAdminUpdateInput = {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export type BranchUpdatePayload = {
  restaurantId?: string;
  name?: string;
  street?: string;
  shopNumber?: string;
  city?: string;
  state?: string;
  country?: string;
  lat?: string | number | null;
  lng?: string | number | null;
  isMain?: boolean;
  area?: string;
  postalCode?: string;
  logoUrl?: string;
  coverImage?: string;
  description?: string;
  isActive?: boolean;
  branchAdmin?: BranchAdminUpdateInput;
  settings?: BranchSettings;
};

const hasServiceChargeSetting = (settings: BranchSettings | undefined) =>
  Boolean(settings) &&
  Object.prototype.hasOwnProperty.call(settings, "serviceCharge");

const branchSettingsPatchBlocklist = [
  "deliveryIntervalMinutes",
  "pickupIntervalMinutes",
  "printing",
  "openingHours",
  "openingsHours",
  "deliveryHours",
  "holidayRanges",
  "temporaryClosure",
  "currentTemporaryClosure",
  "temporaryClosures",
  "closure",
  "closures",
  "holidayOpeningHours",
  "reservationDateRanges",
  "tableReservationDateRanges",
  "reservationBlackoutRanges",
] as const;

const sanitizeBranchSettingsForPatch = (
  settings: BranchSettings | undefined,
): BranchSettings => {
  const safeSettings: BranchSettings = { ...(settings ?? {}) };

  branchSettingsPatchBlocklist.forEach((key) => {
    delete safeSettings[key];
  });

  return safeSettings;
};

export const updateBranch = async (
  id: string,
  payload: BranchUpdatePayload,
) => {
  const nextPayload = { ...payload };

  if (hasServiceChargeSetting(payload.settings)) {
    const existingBranch = (await getBranch(id)) as {
      settings?: BranchSettings;
    };

    nextPayload.settings = {
      ...sanitizeBranchSettingsForPatch(existingBranch.settings),
      ...sanitizeBranchSettingsForPatch(payload.settings),
      serviceCharge: payload.settings?.serviceCharge,
    };
  } else if (payload.settings) {
    nextPayload.settings = sanitizeBranchSettingsForPatch(payload.settings);
  }

  const { data } = await api.patch(`/branches/${id}`, nextPayload);
  return data;
};

export const updateBranchNotificationSettings = async (
  id: string,
  payload: { emailAddress?: string; enabled: boolean },
) => {
  const { data } = await api.patch(
    `/branches/${id}/notification-settings`,
    payload,
  );
  return data;
};

export const deleteBranch = async (id: string) => {
  const { data } = await api.delete(`/branches/${id}`);
  return data;
};

/**
 * ==============================
 * ==============================
 */

export const createBranchesBulk = async (payload: BulkBranchValues) => {
  const result = parseSchema(BulkBranchSchema, payload);

  if (!result.success) {
    const message = Object.entries(result.errors)
      .map(([path, error]) => `${path}: ${error}`)
      .join("\n");

    throw new Error(message || "Invalid branch import data");
  }

  const { data } = await api.post("/branches/bulk", result.data);
  return data;
};

/**
 * ==============================
 * OPENING HOURS
 * ==============================
 */

export const getOpeningHours = async (branchId: string) => {
  const { data } = await api.get(`/branches/${branchId}/opening-hours`);
  return data;
};

export const updateOpeningHours = async (
  branchId: string,
  payload: OpeningHoursValues,
) => {
  const { data } = await api.put(
    `/branches/${branchId}/opening-hours`,
    payload,
  );
  return data;
};

export type DeliveryHoursValues = {
  deliveryHours: OpeningHoursValues["openingHours"];
};

export type BranchDeliveryTimePayload = {
  deliveryTime: number;
  deliveryIntervalMinutes: number;
  pickupIntervalMinutes: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const unwrapDataRecord = (response: unknown) => {
  if (!isRecord(response)) return {};

  const data = response.data;
  return isRecord(data) ? data : response;
};

const toNonNegativeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) return fallback;

  return Math.trunc(parsed);
};

export const normalizeBranchDeliveryTime = (
  response: unknown,
): BranchDeliveryTimePayload => {
  const data = unwrapDataRecord(response);

  return {
    deliveryTime: toNonNegativeNumber(data.deliveryTime),
    deliveryIntervalMinutes: toNonNegativeNumber(data.deliveryIntervalMinutes),
    pickupIntervalMinutes: toNonNegativeNumber(data.pickupIntervalMinutes),
  };
};

export const getBranchDeliveryTime = async (branchId: string) => {
  const { data } = await api.get(`/branches/${branchId}/delivery-time`);

  return normalizeBranchDeliveryTime(data);
};

export const updateBranchDeliveryTime = async (
  branchId: string,
  payload: BranchDeliveryTimePayload,
) => {
  const { data } = await api.put(
    `/branches/${branchId}/delivery-time`,
    payload,
  );

  return normalizeBranchDeliveryTime(data);
};

export const getDeliveryHours = async (branchId: string) => {
  const { data } = await api.get(`/branches/${branchId}/delivery-hours`);
  return data;
};

export const updateDeliveryHours = async (
  branchId: string,
  payload: DeliveryHoursValues,
) => {
  const { data } = await api.put(
    `/branches/${branchId}/delivery-hours`,
    payload,
  );
  return data;
};

/**
 * ==============================
 * STATUS CONTROL
 * ==============================
 */

export const suspendBranch = async (id: string) => {
  const { data } = await api.patch(`/branches/${id}/suspend`);
  return data;
};

export const activateBranch = async (id: string) => {
  const { data } = await api.patch(`/branches/${id}/activate`);
  return data;
};

/**
 * ==============================
 * IMAGES
 * ==============================
 */
export const updateBranchImages = async (
  id: string,
  payload:
    | {
        logoUrl?: string;
        coverImage?: string;
      }
    | FormData,
) => {
  const isFormData = payload instanceof FormData;

  const { data } = await api.patch(`/branches/${id}/images`, payload, {
    headers: isFormData
      ? { "Content-Type": "multipart/form-data" }
      : { "Content-Type": "application/json" },
  });

  return data;
};
/**
 * ==============================
 * FORCE DELETE
 * ==============================
 */

export const forceDeleteBranch = async (id: string) => {
  const { data } = await api.delete(`/branches/${id}/force`);
  return data;
};

// services/branches.ts

export type TemporaryClosurePayload =
  | {
      isClosed: true;
      closedUntil: string;
      reason?: string;
      message?: string;
    }
  | {
      isClosed: false;
    };

export const updateBranchTemporaryClosure = async (
  id: string,
  payload: TemporaryClosurePayload,
) => {
  const { data } = await api.patch(
    `/branches/${id}/temporary-closure`,
    payload,
  );
  return data;
};

export type UpdateBranchHolidayOpeningHoursPayload = HolidayOpeningHoursPayload;

export const getBranchHolidayOpeningHours = async (branchId: string) => {
  const { data } = await api.get(`/branches/${branchId}/holiday-opening-hours`);

  return data;
};

export const updateBranchHolidayOpeningHours = async ({
  branchId,
  payload,
}: {
  branchId: string;
  payload: UpdateBranchHolidayOpeningHoursPayload;
}) => {
  const { data } = await api.put(
    `/branches/${branchId}/holiday-opening-hours`,
    payload,
  );

  return data;
};
