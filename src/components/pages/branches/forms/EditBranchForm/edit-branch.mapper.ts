import {
  DEFAULT_ALLOWED_ORDER_TYPES,
  DEFAULT_ALLOWED_PAYMENT_METHODS,
} from "./edit-branch.defaults";
import type {
  BranchFormData,
  BranchAdmin,
  BranchServiceChargeSettings,
  BranchSettings,
  DeliveryConfig,
  DeliveryMode,
  DeliveryPolygonPoint,
  DeliveryZone,
  PostalCodeRule,
  ZoneBand,
} from "./types";

const DAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

const DELIVERY_MODES: DeliveryMode[] = ["RADIUS", "ZONE", "ZONE_BANDS", "POSTAL_CODE"];

const BRANCH_SETTINGS_PATCH_BLOCKLIST = [
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

export const DEFAULT_SERVICE_CHARGE: BranchServiceChargeSettings = {
  isEnabled: false,
  type: "PERCENTAGE",
  value: 0,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toRecord = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

const toStringValue = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const normalizeBranchAdminForEdit = (
  branchAdmin: unknown,
  manager: unknown
): BranchAdmin => {
  const adminRecord = toRecord(branchAdmin);
  const adminProfileRecord = toRecord(adminRecord.profile);
  const managerRecord = toRecord(manager);
  const profileRecord = toRecord(managerRecord.profile);

  return {
    email: toStringValue(adminRecord.email, toStringValue(managerRecord.email)),
    password: toStringValue(adminRecord.password),
    firstName: toStringValue(
      adminRecord.firstName,
      toStringValue(adminProfileRecord.firstName, toStringValue(profileRecord.firstName))
    ),
    lastName: toStringValue(
      adminRecord.lastName,
      toStringValue(adminProfileRecord.lastName, toStringValue(profileRecord.lastName))
    ),
    phone: toStringValue(
      adminRecord.phone,
      toStringValue(adminProfileRecord.phone, toStringValue(profileRecord.phone))
    ),
  };
};

export const normalizeBranchAdminForPatch = (
  branchAdmin: unknown
): BranchAdmin | undefined => {
  const adminRecord = toRecord(branchAdmin);
  const admin: BranchAdmin = {
    email: toStringValue(adminRecord.email).trim(),
    firstName: toStringValue(adminRecord.firstName).trim(),
    lastName: toStringValue(adminRecord.lastName).trim(),
    phone: toStringValue(adminRecord.phone).trim(),
  };
  const password = toStringValue(adminRecord.password).trim();

  if (password) {
    admin.password = password;
  }

  return Object.values(admin).some(Boolean) ? admin : undefined;
};

export const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeBreakTimesForApi = (breakTimes: unknown) => {
  if (!Array.isArray(breakTimes)) return [];

  return breakTimes
    .map((item) => {
      const record = toRecord(item);

      return {
        startTime: String(record.startTime || ""),
        endTime: String(record.endTime || ""),
        note: String(record.note || ""),
      };
    })
    .filter((item) => item.startTime && item.endTime);
};

export const normalizeOpeningHoursForApi = (openingHours: unknown) => {
  const rawHours = Array.isArray(openingHours) ? openingHours : [];

  return DAYS.map((dayOfWeek) => {
    const existing = toRecord(
      rawHours.find((item) => toRecord(item).dayOfWeek === dayOfWeek)
    );

    return {
      dayOfWeek,
      isClosed: Boolean(existing.isClosed ?? dayOfWeek === "SUNDAY"),
      openTime: toStringValue(existing.openTime, "09:00"),
      closeTime: toStringValue(existing.closeTime, "18:00"),
      breakTimes: normalizeBreakTimesForApi(existing.breakTimes),
      note: String(existing.note || ""),
    };
  });
};

export const normalizeHolidayRangesForApi = (holidayRanges: unknown) => {
  if (!Array.isArray(holidayRanges)) return [];

  return holidayRanges
    .map((item) => {
      const record = toRecord(item);
      const isClosed = Boolean(record.isClosed ?? true);

      return {
        fromDate: String(record.fromDate || record.startDate || record.date || ""),
        toDate: String(record.toDate || record.endDate || record.date || ""),
        isClosed,
        openTime: isClosed ? undefined : toStringValue(record.openTime, "09:00"),
        closeTime: isClosed ? undefined : toStringValue(record.closeTime, "18:00"),
        note: String(record.note || ""),
      };
    })
    .filter((item) => item.fromDate && item.toDate);
};

const normalizeDeliveryMode = (mode: unknown): DeliveryMode => {
  const normalized = String(mode || "").toUpperCase();

  return DELIVERY_MODES.includes(normalized as DeliveryMode)
    ? (normalized as DeliveryMode)
    : "RADIUS";
};

const normalizePolygonPoint = (point: unknown): DeliveryPolygonPoint | null => {
  const record = toRecord(point);
  const lat = toNumber(record.lat, Number.NaN);
  const lng = toNumber(record.lng, Number.NaN);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
};

const normalizeDeliveryZonesForApi = (zones: unknown): DeliveryZone[] => {
  if (!Array.isArray(zones)) return [];

  return zones.map((zone) => {
    const record = toRecord(zone);

    return {
      ...(record.id ? { id: String(record.id) } : {}),
      name: String(record.name || "").trim(),
      deliveryFee: toNumber(record.deliveryFee, 0),
      minOrderAmount: toNumber(record.minOrderAmount, 0),
      freeDeliveryThreshold: toNumber(record.freeDeliveryThreshold, 0),
      polygon: Array.isArray(record.polygon)
        ? record.polygon
          .map((point) => normalizePolygonPoint(point))
          .filter((point: DeliveryPolygonPoint | null): point is DeliveryPolygonPoint =>
            Boolean(point)
          )
        : [],
    };
  });
};

const normalizeZoneBandsForApi = (bands: unknown): ZoneBand[] => {
  if (!Array.isArray(bands)) return [];

  return bands.map((band) => {
    const record = toRecord(band);

    return {
      ...(record.id ? { id: String(record.id) } : {}),
      fromKm: toNumber(record.fromKm, 0),
      toKm: toNumber(record.toKm, 0),
      deliveryFee: toNumber(record.deliveryFee, 0),
      minOrderAmount: toNumber(record.minOrderAmount, 0),
      freeDeliveryThreshold: toNumber(record.freeDeliveryThreshold, 0),
    };
  });
};

const normalizePostalCodeRulesForApi = (rules: unknown): PostalCodeRule[] => {
  if (!Array.isArray(rules)) return [];

  return rules.map((rule) => {
    const record = toRecord(rule);

    return {
      ...(record.id ? { id: String(record.id) } : {}),
      postalCode: String(record.postalCode || "").trim(),
      deliveryFee: toNumber(record.deliveryFee, 0),
      minOrderAmount: toNumber(record.minOrderAmount, 0),
      freeDeliveryThreshold: toNumber(record.freeDeliveryThreshold, 0),
    };
  });
};

export const normalizeDeliveryConfigForApi = (deliveryConfig: unknown): DeliveryConfig => {
  const record = toRecord(deliveryConfig);

  return {
    mode: normalizeDeliveryMode(record.mode),
    radiusKm: toNumber(record.radiusKm, 0),
    minOrderAmount: toNumber(record.minOrderAmount, 0),
    deliveryFee: toNumber(record.deliveryFee, 0),
    isFreeDelivery: Boolean(record.isFreeDelivery ?? false),
    freeDeliveryThreshold: toNumber(record.freeDeliveryThreshold, 0),
    zones: normalizeDeliveryZonesForApi(record.zones),
    zoneBands: normalizeZoneBandsForApi(record.zoneBands),
    postalCodeRules: normalizePostalCodeRulesForApi(record.postalCodeRules),
  };
};

export const normalizeServiceChargeForApi = (
  serviceCharge: unknown
): BranchServiceChargeSettings => {
  const record = toRecord(serviceCharge);
  const type = record.type === "AMOUNT" ? "AMOUNT" : "PERCENTAGE";
  const isEnabled = Boolean(record.isEnabled ?? false);

  return {
    isEnabled,
    type: isEnabled ? type : "PERCENTAGE",
    value: isEnabled ? toNumber(record.value, 0) : 0,
  };
};

export const buildServiceChargeSettingsPayload = (
  existingSettings: unknown,
  serviceCharge: unknown
): BranchSettings => ({
  ...sanitizeBranchSettingsForPatch(existingSettings),
  allowedPaymentMethods: DEFAULT_ALLOWED_PAYMENT_METHODS,
  serviceCharge: normalizeServiceChargeForApi(serviceCharge),
});

export const sanitizeBranchSettingsForPatch = (settings: unknown): BranchSettings => {
  const safeSettings: BranchSettings = { ...toRecord(settings) };

  BRANCH_SETTINGS_PATCH_BLOCKLIST.forEach((key) => {
    delete safeSettings[key];
  });

  return safeSettings;
};

const isValidCoordinate = (point: DeliveryPolygonPoint) =>
  Number.isFinite(point.lat) &&
  Number.isFinite(point.lng) &&
  point.lat >= -90 &&
  point.lat <= 90 &&
  point.lng >= -180 &&
  point.lng <= 180;

export const getDeliveryConfigValidationError = (deliveryConfig: DeliveryConfig) => {
  if (deliveryConfig.radiusKm < 0) return "Radius cannot be negative";
  if (deliveryConfig.deliveryFee < 0) return "Delivery fee cannot be negative";
  if (deliveryConfig.minOrderAmount < 0) return "Minimum order amount cannot be negative";
  if (deliveryConfig.freeDeliveryThreshold < 0) return "Free delivery threshold cannot be negative";
  if (deliveryConfig.mode === "RADIUS" && deliveryConfig.radiusKm <= 0) {
    return "Radius must be greater than 0 for radius delivery mode";
  }

  if (deliveryConfig.mode === "ZONE") {
    if (!deliveryConfig.zones.length) return "Please add at least one delivery zone";

    for (const [index, zone] of deliveryConfig.zones.entries()) {
      const label = zone.name || `Zone ${index + 1}`;

      if (!zone.name) return `Zone ${index + 1} name is required`;
      if (zone.deliveryFee < 0) return `${label} delivery fee cannot be negative`;
      if (zone.minOrderAmount < 0) return `${label} minimum order cannot be negative`;
      if (zone.freeDeliveryThreshold < 0) return `${label} free delivery threshold cannot be negative`;
      if (!Array.isArray(zone.polygon) || zone.polygon.length < 3) {
        return `${label} must have at least 3 polygon points`;
      }

      if (zone.polygon.find((point) => !isValidCoordinate(point))) {
        return `${label} has an invalid latitude/longitude point`;
      }
    }
  }

  if (deliveryConfig.mode === "ZONE_BANDS" && !deliveryConfig.zoneBands.length) {
    return "Please add at least one distance zone band";
  }

  for (const [index, band] of deliveryConfig.zoneBands.entries()) {
    const label = `Zone band ${index + 1}`;

    if (band.fromKm < 0 || band.toKm < 0) return `${label} distance cannot be negative`;
    if (band.toKm <= band.fromKm) return `${label} To KM must be greater than From KM`;
    if (band.deliveryFee < 0) return `${label} delivery fee cannot be negative`;
    if (band.minOrderAmount < 0) return `${label} minimum order cannot be negative`;
    if (band.freeDeliveryThreshold < 0) return `${label} free delivery threshold cannot be negative`;
  }

  if (deliveryConfig.mode === "POSTAL_CODE") {
    if (!deliveryConfig.postalCodeRules.length) {
      return "Please add at least one postal code delivery rule";
    }

    const seenPostalCodes = new Set<string>();

    for (const [index, rule] of deliveryConfig.postalCodeRules.entries()) {
      if (!rule.postalCode) return `Postal code rule ${index + 1} requires a postal code`;
      const postalCode = rule.postalCode.trim().toLowerCase();

      if (seenPostalCodes.has(postalCode)) {
        return `Postal code rule ${index + 1} duplicates another postal code`;
      }

      seenPostalCodes.add(postalCode);

      if (rule.deliveryFee < 0) {
        return `Postal code rule ${index + 1} delivery fee cannot be negative`;
      }
      if (rule.minOrderAmount < 0) {
        return `Postal code rule ${index + 1} minimum order cannot be negative`;
      }
      if (rule.freeDeliveryThreshold < 0) {
        return `Postal code rule ${index + 1} free delivery threshold cannot be negative`;
      }
    }
  }

  return null;
};

export const getBranchSettingsValidationError = (settings: unknown) => {
  const branchSettings = toRecord(settings);
  const tableReservationsEnabled = Boolean(
    branchSettings.tableReservationsEnabled ?? false
  );
  const tableCount = toNumber(branchSettings.tableCount, 0);
  const serviceChargeError = getServiceChargeValidationError(
    normalizeServiceChargeForApi(branchSettings.serviceCharge)
  );

  if (tableCount < 0) return "Table count cannot be negative";
  if (!Number.isInteger(tableCount)) return "Table count must be a whole number";
  if (tableReservationsEnabled && tableCount < 1) {
    return "Table count must be at least 1 when table reservations are enabled";
  }
  if (serviceChargeError) return serviceChargeError;

  return null;
};

export const getServiceChargeValidationError = (
  serviceCharge: BranchServiceChargeSettings
) => {
  if (!serviceCharge.isEnabled) return null;

  if (serviceCharge.value <= 0) {
    return "Service charge value must be greater than 0 when enabled";
  }

  if (serviceCharge.type === "PERCENTAGE" && serviceCharge.value > 100) {
    return "Percentage service charge cannot exceed 100";
  }

  return null;
};

export const buildBranchPatchPayload = (
  branchData: BranchFormData,
  settings: BranchSettings
): BranchFormData => {
  const branchAdmin = normalizeBranchAdminForPatch(branchData.branchAdmin);

  return {
    restaurantId: branchData.restaurantId,
    name: branchData.name,
    isMain: branchData.isMain,
    ...(branchAdmin ? { branchAdmin } : {}),
    street: branchData.address?.street ?? branchData.street,
    area: branchData.address?.area ?? branchData.area,
    postalCode: branchData.address?.postalCode ?? branchData.postalCode,
    city: branchData.address?.city ?? branchData.city,
    state: branchData.address?.state ?? branchData.state,
    country: branchData.address?.country ?? branchData.country,
    lat: branchData.address?.lat ?? branchData.lat,
    lng: branchData.address?.lng ?? branchData.lng,
    logoUrl: branchData.logoUrl,
    coverImage: branchData.coverImage,
    description: branchData.description,
    settings,
  };
};

export const buildSafeBranchSettings = (
  settings: unknown,
  deliveryConfig: DeliveryConfig
): BranchSettings => {
  const settingsRecord = toRecord(settings);
  const automation = toRecord(settingsRecord.automation);
  const taxation = toRecord(settingsRecord.taxation);
  const contact = toRecord(settingsRecord.contact);
  const safeSettings = sanitizeBranchSettingsForPatch(settingsRecord);

  return {
    ...safeSettings,
    allowedOrderTypes: Array.isArray(settingsRecord.allowedOrderTypes)
      ? settingsRecord.allowedOrderTypes.map(String)
      : DEFAULT_ALLOWED_ORDER_TYPES,
    allowedPaymentMethods: DEFAULT_ALLOWED_PAYMENT_METHODS,
    tableReservationsEnabled: Boolean(settingsRecord.tableReservationsEnabled ?? false),
    tableReservationAutoAccept: Boolean(settingsRecord.tableReservationAutoAccept ?? false),
    tableCount: Math.max(0, Math.trunc(toNumber(settingsRecord.tableCount, 0))),
    deliveryTime:
      settingsRecord.deliveryTime === "" ||
      settingsRecord.deliveryTime === undefined ||
      settingsRecord.deliveryTime === null
        ? null
        : toNumber(settingsRecord.deliveryTime, 0),
    automation: {
      ...automation,
      autoAcceptOrders: Boolean(automation.autoAcceptOrders ?? false),
      estimatedPrepTime: toNumber(automation.estimatedPrepTime, 30),
    },
    taxation: {
      ...taxation,
      taxPercentage: toNumber(taxation.taxPercentage, 0),
    },
    serviceCharge: normalizeServiceChargeForApi(settingsRecord.serviceCharge),
    contact: {
      ...contact,
      phone: toStringValue(contact.phone),
      whatsapp: toStringValue(contact.whatsapp),
    },
    deliveryConfig,
  };
};

export const hydrateBranchForEdit = (branchData: BranchFormData): BranchFormData => {
  const settings = branchData.settings || {};
  const deliveryConfig = normalizeDeliveryConfigForApi(settings.deliveryConfig);
  const users = Array.isArray(branchData.users) ? branchData.users : [];
  const branchAdminUser =
    users.find((user) => toRecord(user).role === "BRANCH_ADMIN") ?? users[0];
  const manager =
    branchData.manager ?? branchData.assignedManager ?? branchAdminUser;

  return {
    ...branchData,
    branchAdmin: normalizeBranchAdminForEdit(
      branchData.branchAdmin,
      manager
    ),
    settings: {
      ...settings,
      tableReservationsEnabled: Boolean(settings?.tableReservationsEnabled ?? false),
      tableReservationAutoAccept: Boolean(settings?.tableReservationAutoAccept ?? false),
      tableCount: Math.max(0, Math.trunc(toNumber(settings?.tableCount, 0))),
      serviceCharge: normalizeServiceChargeForApi(settings.serviceCharge),
      deliveryConfig,
    },
  };
};
