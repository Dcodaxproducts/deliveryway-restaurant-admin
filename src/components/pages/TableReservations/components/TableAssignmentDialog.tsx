"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/common/FormField";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import {
  buildTableReservationAssignmentPayload,
  type TableReservationScope,
} from "@/components/pages/TableReservations/utils/table-reservation-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAssignTableReservation } from "@/hooks/useTableReservations";
import type { TableReservation } from "@/types/table-reservations";
import {
  isTableReservationErrorCode,
  TABLE_LABEL_MAX_LENGTH,
  tableLabelSchema,
  type TableLabelFormValues,
} from "@/validations/table-reservations";

type TableAssignmentDialogProps = {
  open: boolean;
  reservation: TableReservation | null;
  scope?: TableReservationScope;
  onOpenChange: (open: boolean) => void;
  onAssigned?: (reservation: TableReservation) => void;
};

const FORM_ID = "table-reservation-assignment-form";

/**
 * Persists the table label through `PATCH …/:reservationId/assignment`. The dialog only
 * edits; the reservation returned by the API is what the pages render afterwards.
 */
export function TableAssignmentDialog({
  open,
  reservation,
  scope = {},
  onOpenChange,
  onAssigned,
}: TableAssignmentDialogProps) {
  const t = useTranslations("tableReservations");
  const common = useTranslations("common");
  const assignMutation = useAssignTableReservation();
  const currentLabel = reservation?.tableLabel ?? "";
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TableLabelFormValues>({
    resolver: zodResolver(tableLabelSchema),
    values: { tableLabel: currentLabel },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: TableLabelFormValues) => {
    if (!reservation) return;

    const updated = await assignMutation.mutateAsync({
      reservationId: reservation.id,
      payload: buildTableReservationAssignmentPayload(reservation, values.tableLabel, scope),
    });
    onAssigned?.(updated);
    handleOpenChange(false);
  };

  const error = errors.tableLabel?.message;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      size="sm"
      busy={assignMutation.isPending}
      title={currentLabel ? t("changeTable") : t("assignTable")}
      description={t("assignTableDescription")}
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={assignMutation.isPending}
          >
            {common("cancel")}
          </Button>
          <Button type="submit" form={FORM_ID} disabled={assignMutation.isPending}>
            {assignMutation.isPending ? common("saving") : common("save")}
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
        <FormField
          id="reservation-table-label"
          label={t("tableLabel")}
          help={t("tableLabelHelp")}
          required
          error={error ? (isTableReservationErrorCode(error) ? t(`errors.${error}`) : error) : undefined}
        >
          {(controlProps) => (
            <Input
              {...controlProps}
              {...register("tableLabel")}
              autoComplete="off"
              maxLength={TABLE_LABEL_MAX_LENGTH}
              placeholder={t("tableLabelPlaceholder")}
              className="h-11"
            />
          )}
        </FormField>
      </form>
    </ResponsiveDialog>
  );
}
