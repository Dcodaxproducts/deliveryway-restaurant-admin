import api from "@/lib/axios";
import { parseSchema } from "@/lib/zod-errors";
import {
  BranchValues,
  BulkBranchSchema,
  BulkBranchValues,
  OpeningHoursValues,
} from "@/validations/branches";
import type { BranchSettings } from "@/types/branch";

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

type BranchUpdatePayload = Omit<Partial<BranchValues>, "settings"> & {
  settings?: BranchSettings;
};

const hasServiceChargeSetting = (settings: BranchSettings | undefined) =>
  Boolean(settings) &&
  Object.prototype.hasOwnProperty.call(settings, "serviceCharge");

const branchSettingsPatchBlocklist = [
  "openingHours",
  "openingsHours",
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
      serviceCharge: payload.settings?.serviceCharge,
    };
  } else if (payload.settings) {
    nextPayload.settings = sanitizeBranchSettingsForPatch(payload.settings);
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



export type BranchHolidayOpeningHour = {
  date: string;
  isClosed: boolean;
  openTime?: string | null;
  closeTime?: string | null;
  note?: string | null;
};

export type UpdateBranchHolidayOpeningHoursPayload = {
  holidayOpeningHours: BranchHolidayOpeningHour[];
};

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
