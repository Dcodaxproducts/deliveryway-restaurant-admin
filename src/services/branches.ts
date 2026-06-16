import api from "@/lib/axios";
import { parseSchema } from "@/lib/zod-errors";
import { PAYMENT_METHOD_CODES } from "@/types/payment-methods";
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

export const createBranch = async (payload: BranchValues) => {
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

const defaultAllowedPaymentMethods = [...PAYMENT_METHOD_CODES];

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
  settings: BranchSettings | undefined
): BranchSettings => {
  const safeSettings: BranchSettings = { ...(settings ?? {}) };

  branchSettingsPatchBlocklist.forEach((key) => {
    delete safeSettings[key];
  });

  return safeSettings;
};

export const updateBranch = async (
  id: string,
  payload: BranchUpdatePayload
) => {
  const nextPayload = { ...payload };

  if (hasServiceChargeSetting(payload.settings)) {
    const existingBranch = (await getBranch(id)) as { settings?: BranchSettings };

    nextPayload.settings = {
      ...sanitizeBranchSettingsForPatch(existingBranch.settings),
      ...sanitizeBranchSettingsForPatch(payload.settings),
      allowedPaymentMethods: defaultAllowedPaymentMethods,
      serviceCharge: payload.settings?.serviceCharge,
    };
  } else if (payload.settings) {
    nextPayload.settings = {
      ...sanitizeBranchSettingsForPatch(payload.settings),
      allowedPaymentMethods: defaultAllowedPaymentMethods,
    };
  }

  const { data } = await api.patch(`/branches/${id}`, nextPayload);
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
  payload: OpeningHoursValues
) => {
  const { data } = await api.put(
    `/branches/${branchId}/opening-hours`,
    payload
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
  response: unknown
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
  payload: BranchDeliveryTimePayload
) => {
  const { data } = await api.put(
    `/branches/${branchId}/delivery-time`,
    payload
  );

  return normalizeBranchDeliveryTime(data);
};

export const getDeliveryHours = async (branchId: string) => {
  const { data } = await api.get(`/branches/${branchId}/delivery-hours`);
  return data;
};

export const updateDeliveryHours = async (
  branchId: string,
  payload: DeliveryHoursValues
) => {
  const { data } = await api.put(
    `/branches/${branchId}/delivery-hours`,
    payload
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
  payload: {
    logoUrl?: string;
    coverImage?: string;
  } | FormData
) => {
  const isFormData = payload instanceof FormData;

  const { data } = await api.patch(
    `/branches/${id}/images`,
    payload,
    {
      headers: isFormData
        ? { "Content-Type": "multipart/form-data" }
        : { "Content-Type": "application/json" },
    }
  );

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
  payload: TemporaryClosurePayload
) => {
  const { data } = await api.patch(`/branches/${id}/temporary-closure`, payload);
  return data;
};



export type UpdateBranchHolidayOpeningHoursPayload = HolidayOpeningHoursPayload;

export const getBranchHolidayOpeningHours = async (branchId: string) => {
  const { data } = await api.get(
    `/branches/${branchId}/holiday-opening-hours`
  );

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
    payload
  );

  return data;
};
