export type EditTab = "basicInfo" | "delivery" | "workingHours";

export type DeliveryMode = "RADIUS" | "ZONE" | "ZONE_BANDS" | "POSTAL_CODE";

export type DeliveryPolygonPoint = {
  lat: number;
  lng: number;
};

export type DeliveryZone = {
  id?: string;
  name: string;
  deliveryFee: number;
  minOrderAmount: number;
  freeDeliveryThreshold: number;
  polygon: DeliveryPolygonPoint[];
};

export type ZoneBand = {
  id?: string;
  fromKm: number;
  toKm: number;
  deliveryFee: number;
  minOrderAmount: number;
  freeDeliveryThreshold: number;
};

export type PostalCodeRule = {
  id?: string;
  postalCode: string;
  deliveryFee: number;
  minOrderAmount: number;
  freeDeliveryThreshold: number;
};

export type DeliveryConfig = {
  mode: DeliveryMode;
  radiusKm: number;
  minOrderAmount: number;
  deliveryFee: number;
  isFreeDelivery: boolean;
  freeDeliveryThreshold: number;
  zones: DeliveryZone[];
  zoneBands: ZoneBand[];
  postalCodeRules: PostalCodeRule[];
};

export type BranchFormData = Record<string, any>;
