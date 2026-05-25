export type EditTab = "basicInfo" | "delivery" | "workingHours";

export type DeliveryMode = "RADIUS" | "ZONE" | "POSTAL_CODE";

export type DeliveryPolygonPoint = {
  lat: number;
  lng: number;
};

export type DeliveryZone = {
  id?: string;
  name: string;
  deliveryFee: number;
  polygon: DeliveryPolygonPoint[];
};

export type PostalCodeRule = {
  id?: string;
  postalCode: string;
  deliveryFee: number;
};

export type DeliveryConfig = {
  mode: DeliveryMode;
  radiusKm: number;
  minOrderAmount: number;
  deliveryFee: number;
  isFreeDelivery: boolean;
  freeDeliveryThreshold: number;
  zones: DeliveryZone[];
  postalCodeRules: PostalCodeRule[];
};

export type BranchFormData = Record<string, any>;
