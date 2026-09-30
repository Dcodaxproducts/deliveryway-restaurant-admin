import { getAllowedTableReservationTransitions } from "@/lib/table-reservation-transitions";
import type {
  TableReservation,
  TableReservationStatusUpdatePayload,
  TableReservationStatusUpdateValue,
} from "@/types/table-reservations";

export type TableReservationQuickActionId = "confirm" | "seat" | "complete" | "noShow" | "cancel";

export type TableReservationQuickAction = {
  id: TableReservationQuickActionId;
  status: TableReservationStatusUpdateValue;
  /** Message key inside the `tableReservations` namespace. */
  labelKey: string;
  destructive: boolean;
  /** Irreversible actions ask for confirmation first. */
  requiresConfirmation: boolean;
};

const QUICK_ACTIONS: readonly TableReservationQuickAction[] = [
  { id: "confirm", status: "CONFIRMED", labelKey: "confirmReservation", destructive: false, requiresConfirmation: false },
  { id: "seat", status: "SEATED", labelKey: "seat", destructive: false, requiresConfirmation: false },
  { id: "complete", status: "COMPLETED", labelKey: "complete", destructive: false, requiresConfirmation: false },
  { id: "noShow", status: "NO_SHOW", labelKey: "markNoShow", destructive: true, requiresConfirmation: true },
  { id: "cancel", status: "CANCELLED", labelKey: "cancelReservation", destructive: true, requiresConfirmation: true },
];

/**
 * Quick actions available for a reservation, limited to valid transitions from its status.
 */
export const getTableReservationQuickActions = (
  reservation: Pick<TableReservation, "status">
): TableReservationQuickAction[] => {
  const allowed = getAllowedTableReservationTransitions(reservation.status);
  return QUICK_ACTIONS.filter((action) => allowed.includes(action.status));
};

export type TableReservationScope = {
  restaurantId?: string;
  branchId?: string;
};

export const buildTableReservationStatusPayload = (
  reservation: Pick<TableReservation, "branchId" | "customer">,
  status: TableReservationStatusUpdateValue,
  scope: TableReservationScope = {}
): TableReservationStatusUpdatePayload => {
  const scopedBranchId = reservation.branchId || scope.branchId;

  return {
    status,
    ...(scope.restaurantId ? { restaurantId: scope.restaurantId } : {}),
    ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
    ...(reservation.customer?.id ? { customerId: reservation.customer.id } : {}),
  };
};
