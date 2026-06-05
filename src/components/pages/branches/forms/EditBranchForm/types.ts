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

export type BranchServiceChargeType = "PERCENTAGE" | "AMOUNT";

export type BranchServiceChargeSettings = {
  isEnabled: boolean;
  type: BranchServiceChargeType;
  value: number;
};

export type BranchSettings = {
  allowedOrderTypes?: string[];
  allowedPaymentMethods?: string[];
  deliveryConfig?: DeliveryConfig;
  automation?: {
    autoAcceptOrders?: boolean;
    estimatedPrepTime?: number;
  };
  taxation?: {
    taxPercentage?: number;
  };
  serviceCharge?: BranchServiceChargeSettings;
  tableReservationsEnabled?: boolean;
  tableReservationAutoAccept?: boolean;
  tableCount?: number;
  contact?: {
    phone?: string;
    whatsapp?: string;
  };
  [key: string]: unknown;
};

export type BranchAddress = {
  street?: string;
  area?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  lat?: string | number;
  lng?: string | number;
};

export type BranchFormData = {
  id?: string;
  restaurantId?: string;
  name?: string;
  description?: string;
  isMain?: boolean;
  branchAdmin?: unknown;
  address?: BranchAddress;
  street?: string;
  area?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  lat?: string | number;
  lng?: string | number;
  logoUrl?: string;
  coverImage?: string;
  settings?: BranchSettings;
  [key: string]: unknown;
};
