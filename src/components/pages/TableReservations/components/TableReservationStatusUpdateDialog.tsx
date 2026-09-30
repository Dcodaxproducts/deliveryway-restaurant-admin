"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";

import { FormField } from "@/components/common/FormField";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import TableReservationStatusBadge from "@/components/pages/TableReservations/components/TableReservationStatusBadge";
import { buildTableReservationStatusPayload } from "@/components/pages/TableReservations/utils/table-reservation-actions";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { useUpdateTableReservationStatus } from "@/hooks/useTableReservations";
import { TABLE_RESERVATION_STATUS_LABEL_KEYS } from "@/lib/status-labels";
import {
  canTransitionTableReservation,
  getAllowedTableReservationTransitions,
} from "@/lib/table-reservation-transitions";
import type { TableReservation } from "@/types/table-reservations";
import {
  isTableReservationErrorCode,
  tableReservationStatusUpdateSchema,
  type TableReservationStatusUpdateValues,
} from "@/validations/table-reservations";

type TableReservationStatusUpdateDialogProps = {
  open: boolean;
  reservation: TableReservation | null;
  restaurantId?: string;
  branchId?: string;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (reservation: TableReservation) => void;
};

const FORM_ID = "table-reservation-status-form";

export function TableReservationStatusUpdateDialog({
  open,
  reservation,
  restaurantId,
  branchId,
  onOpenChange,
  onUpdated,
}: TableReservationStatusUpdateDialogProps) {
  const updateStatusMutation = useUpdateTableReservationStatus();
  const common = useTranslations("common");
  const t = useTranslations("tableReservations");
  const allowedStatuses = getAllowedTableReservationTransitions(reservation?.status);
  const defaultStatus = allowedStatuses[0];
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setError,
  } = useForm<TableReservationStatusUpdateValues>({
    resolver: zodResolver(tableReservationStatusUpdateSchema),
    values: defaultStatus ? { status: defaultStatus } : undefined,
  });

  const statusLabel = (status: string) =>
    TABLE_RESERVATION_STATUS_LABEL_KEYS[status]
      ? t(TABLE_RESERVATION_STATUS_LABEL_KEYS[status])
      : status;

  const errorMessage = (message: string | undefined) => {
    if (!message) return undefined;
    return isTableReservationErrorCode(message) ? t(`errors.${message}`) : message;
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: TableReservationStatusUpdateValues) => {
    if (!reservation) return;

    if (!canTransitionTableReservation(reservation.status, values.status)) {
      setError("status", { type: "validate", message: t("invalidTransition") });
      return;
    }

    const updated = await updateStatusMutation.mutateAsync({
      reservationId: reservation.id,
      payload: buildTableReservationStatusPayload(reservation, values.status, {
        restaurantId,
        branchId,
      }),
    });
    onUpdated?.(updated);
    handleOpenChange(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      size="sm"
      busy={updateStatusMutation.isPending}
      title={t("updateStatusTitle")}
      description={t("updateStatusDescription")}
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={updateStatusMutation.isPending}
          >
            {common("cancel")}
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            disabled={updateStatusMutation.isPending || allowedStatuses.length === 0}
          >
            {updateStatusMutation.isPending ? common("updating") : common("updateStatus")}
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        className="space-y-4"
        noValidate
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      >
        <div className="flex items-center justify-between gap-3 rounded-[var(--ui-radius-control)] bg-[var(--ui-surface-subtle)] px-3 py-2">
          <span className="text-sm text-[var(--ui-text-muted)]">{t("currentStatus")}</span>
          {reservation ? <TableReservationStatusBadge status={reservation.status} /> : null}
        </div>

        {allowedStatuses.length === 0 ? (
          <p role="status" className="text-sm leading-5 text-[var(--ui-text-muted)]">
            {t("noTransitions", { status: statusLabel(reservation?.status ?? "") })}
          </p>
        ) : (
          <FormField
            id="reservation-status"
            label={t("nextStatus")}
            help={t("statusCapacityHelper")}
            error={errorMessage(errors.status?.message)}
            required
          >
            {(controlProps) => (
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <FormSelect
                    {...controlProps}
                    name={field.name}
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value)}
                    onBlur={field.onBlur}
                    className="h-11 w-full"
                  >
                    {allowedStatuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </FormSelect>
                )}
              />
            )}
          </FormField>
        )}
      </form>
    </ResponsiveDialog>
  );
}
