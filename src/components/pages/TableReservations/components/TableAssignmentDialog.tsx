"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormField } from "@/components/common/FormField";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTableAssignments } from "@/lib/table-reservation-assignments";
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
  onOpenChange: (open: boolean) => void;
};

const FORM_ID = "table-reservation-assignment-form";

export function TableAssignmentDialog({ open, reservation, onOpenChange }: TableAssignmentDialogProps) {
  const t = useTranslations("tableReservations");
  const common = useTranslations("common");
  const { getLabel, assign, clear } = useTableAssignments();
  const currentLabel = reservation ? getLabel(reservation.id) ?? "" : "";
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

  const onSubmit = (values: TableLabelFormValues) => {
    if (!reservation) return;

    if (values.tableLabel) {
      assign(reservation.id, values.tableLabel);
    } else {
      clear(reservation.id);
    }

    toast.success(t("tableSaved"));
    handleOpenChange(false);
  };

  const handleClear = () => {
    if (!reservation) return;
    clear(reservation.id);
    toast.success(t("tableSaved"));
    handleOpenChange(false);
  };

  const error = errors.tableLabel?.message;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      size="sm"
      title={currentLabel ? t("changeTable") : t("assignTable")}
      description={t("assignTableDescription")}
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            {common("cancel")}
          </Button>
          {currentLabel ? (
            <Button type="button" variant="outline" onClick={handleClear}>
              {t("clearTable")}
            </Button>
          ) : null}
          <Button type="submit" form={FORM_ID}>
            {common("save")}
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
