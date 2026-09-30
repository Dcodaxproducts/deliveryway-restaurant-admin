"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/components/common/dialogs/delete-dialog";
import {
  buildTableReservationStatusPayload,
  type TableReservationQuickAction,
  type TableReservationScope,
} from "@/components/pages/TableReservations/utils/table-reservation-actions";
import { useUpdateTableReservationStatus } from "@/hooks/useTableReservations";
import type { TableReservation } from "@/types/table-reservations";

export type PendingTableReservationAction = {
  reservation: TableReservation;
  action: TableReservationQuickAction;
};

/**
 * Runs seat/complete/confirm immediately and routes destructive no-show/cancel actions
 * through a confirmation dialog. Render `confirmDialog` next to the caller's markup.
 */
export function useTableReservationQuickActions(scope: TableReservationScope) {
  const t = useTranslations("tableReservations");
  const common = useTranslations("common");
  const updateStatusMutation = useUpdateTableReservationStatus();
  const [pending, setPending] = useState<PendingTableReservationAction | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const perform = useCallback(
    async (reservation: TableReservation, action: TableReservationQuickAction) => {
      setRunningId(reservation.id);
      try {
        await updateStatusMutation.mutateAsync({
          reservationId: reservation.id,
          payload: buildTableReservationStatusPayload(reservation, action.status, scope),
        });
        setPending(null);
      } catch {
        // The mutation hook already surfaces the API error message.
      } finally {
        setRunningId(null);
      }
    },
    [scope, updateStatusMutation]
  );

  const run = useCallback(
    (reservation: TableReservation, action: TableReservationQuickAction) => {
      if (action.requiresConfirmation) {
        setPending({ reservation, action });
        return;
      }

      void perform(reservation, action);
    },
    [perform]
  );

  const confirmDialog = (
    <ConfirmDialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) setPending(null);
      }}
      onConfirm={() => {
        if (pending) void perform(pending.reservation, pending.action);
      }}
      isLoading={updateStatusMutation.isPending}
      tone="danger"
      title={pending?.action.id === "noShow" ? t("confirmNoShowTitle") : t("confirmCancelTitle")}
      description={
        pending?.action.id === "noShow"
          ? t("confirmNoShowDescription")
          : t("confirmCancelDescription")
      }
      confirmLabel={pending ? t(pending.action.labelKey) : common("confirm")}
      cancelLabel={common("back")}
      busyLabel={common("updating")}
    />
  );

  return {
    run,
    runningId,
    isPending: updateStatusMutation.isPending,
    confirmDialog,
  };
}
