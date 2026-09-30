"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useDeferredValue, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { FormField } from "@/components/common/FormField";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import type { TableReservationBranchOption } from "@/components/pages/TableReservations/components/TableReservationsFilters";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateWalkInReservation, useWalkInCustomerSearch } from "@/hooks/useTableReservations";
import type { WalkInCustomerOption } from "@/services/walk-in-customers";
import {
  isTableReservationErrorCode,
  TABLE_LABEL_MAX_LENGTH,
  WALK_IN_DEFAULT_GUEST_COUNT,
  WALK_IN_GUEST_COUNT_MAX,
  WALK_IN_GUEST_COUNT_MIN,
  WALK_IN_NOTE_MAX_LENGTH,
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
  /** Sent as `restaurantId` for tokens without restaurant scope and used for customer lookup. */
  restaurantId?: string;
};

const FORM_ID = "walk-in-reservation-form";

export const getWalkInReservationDefaults = (
  scopedBranchId: string | undefined,
  branchOptions: TableReservationBranchOption[]
): WalkInReservationFormValues => ({
  customerId: "",
  branchId: scopedBranchId ?? (branchOptions.length === 1 ? branchOptions[0].id : ""),
  guestCount: WALK_IN_DEFAULT_GUEST_COUNT,
  tableLabel: "",
  note: "",
});

export const formatWalkInCustomerOption = (customer: WalkInCustomerOption) => {
  const contact = customer.phone || customer.email;
  return contact && contact !== customer.name ? `${customer.name} · ${contact}` : customer.name;
};

/** Keeps the chosen customer selectable even after the search results change. */
export const mergeWalkInCustomerOptions = (
  results: readonly WalkInCustomerOption[],
  selected: WalkInCustomerOption | null
): WalkInCustomerOption[] =>
  selected && !results.some((customer) => customer.id === selected.id)
    ? [selected, ...results]
    : [...results];

export function WalkInReservationDialog({
  open,
  onOpenChange,
  branchOptions,
  scopedBranchId,
  branchName,
  restaurantId,
}: WalkInReservationDialogProps) {
  const t = useTranslations("tableReservations");
  const common = useTranslations("common");
  const createWalkIn = useCreateWalkInReservation();
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<WalkInCustomerOption | null>(null);
  const deferredSearch = useDeferredValue(customerSearch);
  const customersQuery = useWalkInCustomerSearch(
    { restaurantId, search: deferredSearch },
    { enabled: open }
  );
  const customerOptions = useMemo(
    () => mergeWalkInCustomerOptions(customersQuery.data ?? [], selectedCustomer),
    [customersQuery.data, selectedCustomer]
  );
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
    if (!nextOpen) {
      reset(getWalkInReservationDefaults(scopedBranchId, branchOptions));
      setCustomerSearch("");
      setSelectedCustomer(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: WalkInReservationFormValues) => {
    await createWalkIn.mutateAsync({
      customerId: values.customerId,
      branchId: values.branchId,
      guestCount: values.guestCount,
      tableLabel: values.tableLabel || undefined,
      note: values.note || undefined,
      restaurantId,
    });
    handleOpenChange(false);
  };

  const customerStatus = customersQuery.isError
    ? t("customersLoadError")
    : customersQuery.isPending && open
      ? t("searchingCustomers")
      : customerOptions.length === 0
        ? t("noCustomersFound")
        : undefined;

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
        <FormField
          id="walk-in-customer-search"
          label={t("customerSearch")}
          help={t("customerSearchHelp")}
          className="sm:col-span-2"
        >
          {(controlProps) => (
            <Input
              {...controlProps}
              type="search"
              autoComplete="off"
              value={customerSearch}
              onChange={(event) => setCustomerSearch(event.target.value)}
              placeholder={t("customerSearchPlaceholder")}
              className="h-11"
            />
          )}
        </FormField>

        <FormField
          id="walk-in-customer"
          label={t("customer")}
          error={errorMessage(errors.customerId?.message)}
          help={customerStatus}
          required
          className="sm:col-span-2"
        >
          {(controlProps) => (
            <Controller
              control={control}
              name="customerId"
              render={({ field }) => (
                <FormSelect
                  {...controlProps}
                  name={field.name}
                  value={field.value}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    field.onChange(nextId);
                    setSelectedCustomer(
                      customerOptions.find((customer) => customer.id === nextId) ?? null
                    );
                  }}
                  onBlur={field.onBlur}
                  disabled={customerOptions.length === 0}
                  className="h-11 w-full"
                >
                  <option value="" disabled>
                    {t("selectCustomer")}
                  </option>
                  {customerOptions.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {formatWalkInCustomerOption(customer)}
                    </option>
                  ))}
                </FormSelect>
              )}
            />
          )}
        </FormField>

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
          id="walk-in-table-label"
          label={t("tableLabel")}
          help={t("walkInTableLabelHelp")}
          error={errorMessage(errors.tableLabel?.message)}
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

        <FormField
          id="walk-in-note"
          label={common("note")}
          error={errorMessage(errors.note?.message)}
          className="sm:col-span-2"
        >
          {(controlProps) => (
            <Textarea
              {...controlProps}
              {...register("note")}
              rows={2}
              maxLength={WALK_IN_NOTE_MAX_LENGTH}
              className="min-h-20"
            />
          )}
        </FormField>
      </form>
    </ResponsiveDialog>
  );
}
