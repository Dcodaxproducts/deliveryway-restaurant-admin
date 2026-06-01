import {
  DEFAULT_ALLOWED_ORDER_TYPES,
  DEFAULT_ALLOWED_PAYMENT_METHODS,
} from "./edit-branch.defaults";
import type {
  BranchFormData,
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
];

const DELIVERY_MODES: DeliveryMode[] = ["RADIUS", "ZONE", "ZONE_BANDS", "POSTAL_CODE"];

export const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeBreakTimesForApi = (breakTimes: any) => {
  if (!Array.isArray(breakTimes)) return [];

  return breakTimes
    .map((item) => ({
      startTime: String(item?.startTime || ""),
      endTime: String(item?.endTime || ""),
      note: String(item?.note || ""),
    }))
    .filter((item) => item.startTime && item.endTime);
};

export const normalizeOpeningHoursForApi = (openingHours: any) => {
  const rawHours = Array.isArray(openingHours) ? openingHours : [];

  return DAYS.map((dayOfWeek) => {
    const existing = rawHours.find((item: any) => item?.dayOfWeek === dayOfWeek);

    return {
      dayOfWeek,
      isClosed: Boolean(existing?.isClosed ?? dayOfWeek === "SUNDAY"),
      openTime: existing?.openTime || "09:00",
      closeTime: existing?.closeTime || "18:00",
      breakTimes: normalizeBreakTimesForApi(existing?.breakTimes),
      note: String(existing?.note || ""),
    };
  });
};

export const normalizeHolidayRangesForApi = (holidayRanges: any) => {
  if (!Array.isArray(holidayRanges)) return [];

  return holidayRanges
    .map((item) => ({
      fromDate: String(item?.fromDate || item?.startDate || item?.date || ""),
      toDate: String(item?.toDate || item?.endDate || item?.date || ""),
      isClosed: Boolean(item?.isClosed ?? true),
      openTime: item?.isClosed ? undefined : item?.openTime || "09:00",
      closeTime: item?.isClosed ? undefined : item?.closeTime || "18:00",
      note: String(item?.note || ""),
    }))
    .filter((item) => item.fromDate && item.toDate);
};

const normalizeDeliveryMode = (mode: any): DeliveryMode => {
  const normalized = String(mode || "").toUpperCase();

  return DELIVERY_MODES.includes(normalized as DeliveryMode)
    ? (normalized as DeliveryMode)
    : "RADIUS";
};

const normalizePolygonPoint = (point: any): DeliveryPolygonPoint | null => {
  const lat = toNumber(point?.lat, Number.NaN);
  const lng = toNumber(point?.lng, Number.NaN);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
};

const normalizeDeliveryZonesForApi = (zones: any): DeliveryZone[] => {
  if (!Array.isArray(zones)) return [];

  return zones.map((zone) => ({
    ...(zone?.id ? { id: String(zone.id) } : {}),
    name: String(zone?.name || "").trim(),
    deliveryFee: toNumber(zone?.deliveryFee, 0),
    minOrderAmount: toNumber(zone?.minOrderAmount, 0),
    freeDeliveryThreshold: toNumber(zone?.freeDeliveryThreshold, 0),
    polygon: Array.isArray(zone?.polygon)
      ? zone.polygon
          .map((point: any) => normalizePolygonPoint(point))
          .filter((point: DeliveryPolygonPoint | null): point is DeliveryPolygonPoint =>
            Boolean(point)
          )
      : [],
  }));
};

const normalizeZoneBandsForApi = (bands: any): ZoneBand[] => {
  if (!Array.isArray(bands)) return [];

  return bands.map((band) => ({
    ...(band?.id ? { id: String(band.id) } : {}),
    fromKm: toNumber(band?.fromKm, 0),
    toKm: toNumber(band?.toKm, 0),
    deliveryFee: toNumber(band?.deliveryFee, 0),
    minOrderAmount: toNumber(band?.minOrderAmount, 0),
    freeDeliveryThreshold: toNumber(band?.freeDeliveryThreshold, 0),
  }));
};

const normalizePostalCodeRulesForApi = (rules: any): PostalCodeRule[] => {
  if (!Array.isArray(rules)) return [];

  return rules.map((rule) => ({
    ...(rule?.id ? { id: String(rule.id) } : {}),
    postalCode: String(rule?.postalCode || "").trim(),
    deliveryFee: toNumber(rule?.deliveryFee, 0),
  }));
};

export const normalizeDeliveryConfigForApi = (deliveryConfig: any): DeliveryConfig => ({
  mode: normalizeDeliveryMode(deliveryConfig?.mode),
  radiusKm: toNumber(deliveryConfig?.radiusKm, 0),
  minOrderAmount: toNumber(deliveryConfig?.minOrderAmount, 0),
  deliveryFee: toNumber(deliveryConfig?.deliveryFee, 0),
  isFreeDelivery: Boolean(deliveryConfig?.isFreeDelivery ?? false),
  freeDeliveryThreshold: toNumber(deliveryConfig?.freeDeliveryThreshold, 0),
  zones: normalizeDeliveryZonesForApi(deliveryConfig?.zones),
  zoneBands: normalizeZoneBandsForApi(deliveryConfig?.zoneBands),
  postalCodeRules: normalizePostalCodeRulesForApi(deliveryConfig?.postalCodeRules),
});

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

    for (const [index, rule] of deliveryConfig.postalCodeRules.entries()) {
      if (!rule.postalCode) return `Postal code rule ${index + 1} requires a postal code`;
      if (rule.deliveryFee < 0) {
        return `Postal code rule ${index + 1} delivery fee cannot be negative`;
      }
    }
  }

  return null;
};

export const buildBranchPatchPayload = (branchData: BranchFormData, settings: any) => ({
  restaurantId: branchData.restaurantId,
  name: branchData.name,
  isMain: branchData.isMain,
  branchAdmin: branchData.branchAdmin,
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
});

export const buildSafeBranchSettings = (settings: any, deliveryConfig: DeliveryConfig) => {
  const safeSettings = { ...(settings || {}) };

  delete safeSettings.openingHours;
  delete safeSettings.holidayRanges;
  delete safeSettings.temporaryClosure;
  delete safeSettings.currentTemporaryClosure;
  delete safeSettings.temporaryClosures;
  delete safeSettings.closure;
  delete safeSettings.closures;
  delete safeSettings.holidayOpeningHours;
  delete safeSettings.reservationDateRanges;
  delete safeSettings.tableReservationDateRanges;
  delete safeSettings.reservationBlackoutRanges;

  return {
    ...safeSettings,
    allowedOrderTypes: Array.isArray(settings?.allowedOrderTypes)
      ? settings.allowedOrderTypes
      : DEFAULT_ALLOWED_ORDER_TYPES,
    allowedPaymentMethods: Array.isArray(settings?.allowedPaymentMethods)
      ? settings.allowedPaymentMethods
      : DEFAULT_ALLOWED_PAYMENT_METHODS,
    tableReservationsEnabled: settings?.tableReservationsEnabled ?? false,
    deliveryTime:
      settings?.deliveryTime === "" ||
      settings?.deliveryTime === undefined ||
      settings?.deliveryTime === null
        ? null
        : toNumber(settings?.deliveryTime, 0),
    automation: {
      ...(settings?.automation || {}),
      autoAcceptOrders: Boolean(settings?.automation?.autoAcceptOrders ?? false),
      estimatedPrepTime: toNumber(settings?.automation?.estimatedPrepTime, 30),
    },
    taxation: {
      ...(settings?.taxation || {}),
      taxPercentage: toNumber(settings?.taxation?.taxPercentage, 0),
    },
    contact: {
      ...(settings?.contact || {}),
      phone: settings?.contact?.phone || "",
      whatsapp: settings?.contact?.whatsapp || "",
    },
    deliveryConfig,
  };
};
