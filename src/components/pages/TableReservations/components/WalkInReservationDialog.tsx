"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";

import { FormField } from "@/components/common/FormField";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import type { TableReservationBranchOption } from "@/components/pages/TableReservations/components/TableReservationsFilters";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateWalkInReservation } from "@/hooks/useTableReservations";
import {
  buildWalkInReservationDate,
  isTableReservationErrorCode,
  WALK_IN_DEFAULT_GUEST_COUNT,
  WALK_IN_DEFAULT_WAIT_MINUTES,
  WALK_IN_GUEST_COUNT_MAX,
  WALK_IN_GUEST_COUNT_MIN,
  WALK_IN_WAIT_MINUTES_MAX,
  WALK_IN_WAIT_MINUTES_MIN,
  walkInReservationSchema,
  type WalkInReservationFormValues,
} from "@/validations/table-reservations";

type WalkInReservationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchOptions: TableReservationBranchOption[];
  /** Branch-scoped accounts cannot choose a branch; the token scope is used. */
  scopedBranchId?: string;
  branchName?: string;
};

const FORM_ID = "walk-in-reservation-form";

export const getWalkInReservationDefaults = (
  scopedBranchId: string | undefined,
  branchOptions: TableReservationBranchOption[]
): WalkInReservationFormValues => ({
  branchId: scopedBranchId ?? (branchOptions.length === 1 ? branchOptions[0].id : ""),
  guestName: "",
  guestPhone: "",
  guestCount: WALK_IN_DEFAULT_GUEST_COUNT,
  waitMinutes: WALK_IN_DEFAULT_WAIT_MINUTES,
  note: "",
});

export function WalkInReservationDialog({
  open,
  onOpenChange,
  branchOptions,
  scopedBranchId,
  branchName,
}: WalkInReservationDialogProps) {
  const t = useTranslations("tableReservations");
  const common = useTranslations("common");
  const createWalkIn = useCreateWalkInReservation();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WalkInReservationFormValues>({
    resolver: zodResolver(walkInReservationSchema),
    defaultValues: getWalkInReservationDefaults(scopedBranchId, branchOptions),
  });

  const errorMessage = (message: string | undefined) => {
    if (!message) return undefined;
    return isTableReservationErrorCode(message) ? t(`errors.${message}`) : message;
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset(getWalkInReservationDefaults(scopedBranchId, branchOptions));
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: WalkInReservationFormValues) => {
    await createWalkIn.mutateAsync({
      branchId: values.branchId,
      guestName: values.guestName || undefined,
      guestPhone: values.guestPhone || undefined,
      reservationDate: buildWalkInReservationDate(values.waitMinutes),
      guestCount: values.guestCount,
      note: values.note || undefined,
    });
    handleOpenChange(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      size="md"
      busy={createWalkIn.isPending}
      title={t("addWalkIn")}
      description={t("addWalkInDescription")}
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={createWalkIn.isPending}
          >
            {common("cancel")}
          </Button>
          <Button type="submit" form={FORM_ID} disabled={createWalkIn.isPending}>
            {createWalkIn.isPending ? t("creating") : t("addWalkIn")}
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        noValidate
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      >
        {scopedBranchId ? (
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-[var(--ui-text-subtle)]">{common("branch")}</p>
            <p className="mt-1 text-sm font-medium text-[var(--ui-text)]">
              {branchName || common("currentBranch")}
            </p>
          </div>
        ) : (
          <FormField
            id="walk-in-branch"
            label={common("branch")}
            error={errorMessage(errors.branchId?.message)}
            required
            className="sm:col-span-2"
          >
            {(controlProps) => (
              <Controller
                control={control}
                name="branchId"
                render={({ field }) => (
                  <FormSelect
                    {...controlProps}
                    name={field.name}
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                    onBlur={field.onBlur}
                    className="h-11 w-full"
                  >
                    <option value="" disabled>
                      {t("selectBranch")}
                    </option>
                    {branchOptions.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </FormSelect>
                )}
              />
            )}
          </FormField>
        )}

        <FormField id="walk-in-guest-name" label={t("guestName")} error={errorMessage(errors.guestName?.message)}>
          {(controlProps) => (
            <Input
              {...controlProps}
              {...register("guestName")}
              autoComplete="off"
              placeholder={t("guestNamePlaceholder")}
              className="h-11"
            />
          )}
        </FormField>

        <FormField id="walk-in-guest-phone" label={common("phone")} error={errorMessage(errors.guestPhone?.message)}>
          {(controlProps) => (
            <Input
              {...controlProps}
              {...register("guestPhone")}
              type="tel"
              autoComplete="off"
              inputMode="tel"
              className="h-11"
            />
          )}
        </FormField>

        <FormField
          id="walk-in-guest-count"
          label={t("partySize")}
          error={errorMessage(errors.guestCount?.message)}
          required
        >
          {(controlProps) => (
            <Input
              {...controlProps}
              {...register("guestCount", { valueAsNumber: true })}
              type="number"
              inputMode="numeric"
              min={WALK_IN_GUEST_COUNT_MIN}
              max={WALK_IN_GUEST_COUNT_MAX}
              step={1}
              className="h-11"
            />
          )}
        </FormField>

        <FormField
          id="walk-in-wait-minutes"
          label={t("expectedWait")}
          help={t("expectedWaitHelp")}
          error={errorMessage(errors.waitMinutes?.message)}
          required
        >
          {(controlProps) => (
            <Input
              {...controlProps}
              {...register("waitMinutes", { valueAsNumber: true })}
              type="number"
              inputMode="numeric"
              min={WALK_IN_WAIT_MINUTES_MIN}
              max={WALK_IN_WAIT_MINUTES_MAX}
              step={1}
              className="h-11"
            />
          )}
        </FormField>

        <FormField
          id="walk-in-note"
          label={common("note")}
          error={errorMessage(errors.note?.message)}
          className="sm:col-span-2"
        >
          {(controlProps) => (
            <Textarea {...controlProps} {...register("note")} rows={2} className="min-h-20" />
          )}
        </FormField>
      </form>
    </ResponsiveDialog>
  );
}
