export interface BranchProps {
  id: string;
  name: string;
  isDefault?: boolean;
    isActive?: boolean;
  itemsCount?: number;
  openDialog?: (branchId: string) => void;
  openMenuDetails?: (branchId: string) => void;
   editMenu?: (id: string) => void;
    coverImage?: string
  logoUrl?: string
  allowDelete?: boolean;
  allowLifecycleActions?: boolean;
  branchAdminMode?: boolean;
  showMediaActions?: boolean;
  availability?: {
  isActive?: boolean;
  isTemporarilyClosed?: boolean;
  isAvailable?: boolean;
  temporaryClosure?: {
    reason?: string;
    message?: string;
    closedAt?: string;
    isClosed?: boolean;
    closedUntil?: string;
  } | null;
};
}

export type BranchDeliveryMode =
  | "RADIUS"
  | "ZONE"
  | "POSTAL_CODE"
  | string;

export type PostalCodeDeliveryRule = {
  postalCode: string;
  deliveryFee: number;
  minOrderAmount: number;
  freeDeliveryThreshold: number;
};

export type BranchDeliveryConfig = {
  mode: BranchDeliveryMode;
  radiusKm?: number;
  minOrderAmount?: number;
  deliveryFee?: number;
  isFreeDelivery?: boolean;
  freeDeliveryThreshold?: number;
  zones?: unknown[];
  zoneBands?: unknown[];
  postalCodeRules?: PostalCodeDeliveryRule[];
};

export type BranchSettings = {
  deliveryConfig?: BranchDeliveryConfig;
  tableReservationsEnabled?: boolean;
  tableReservationAutoAccept?: boolean;
  tableCount?: number;
};
