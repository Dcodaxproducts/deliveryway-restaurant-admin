"use client";

import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";

import { FormField } from "@/components/common/FormField";
import { FormSection } from "@/components/common/FormLayout";
import AsyncSelect from "@/components/ui/AsyncSelect";
import { Input } from "@/components/ui/input";
import type { DeliverymanFormValues } from "@/validations/deliverymen";
import { useTranslations } from "next-intl";

export type BranchOption = {
  id: string;
  name?: string;
};

type FetchBranchesResult = {
  data: BranchOption[];
  meta?: unknown;
};

type DeliveryManFormProps = {
  control: Control<DeliverymanFormValues>;
  errors: FieldErrors<DeliverymanFormValues>;
  selectedBranch: BranchOption | null;
  setSelectedBranch: (val: BranchOption | null) => void;
  fetchBranches: (params: {
    search: string;
    page: number;
  }) => Promise<FetchBranchesResult>;
  branchLocked?: boolean;
  assignedBranchLabel?: string;
};

const FIELD_IDS = {
  firstName: "deliveryman-first-name",
  lastName: "deliveryman-last-name",
  phone: "deliveryman-phone",
  email: "deliveryman-email",
  vehicleType: "deliveryman-vehicle-type",
  vehicleNumber: "deliveryman-vehicle-number",
  branchId: "deliveryman-branch-id",
} as const;

const DeliveryManForm = ({
  control,
  errors,
  selectedBranch,
  setSelectedBranch,
  fetchBranches,
  branchLocked = false,
  assignedBranchLabel,
}: DeliveryManFormProps) => {
  const t = useTranslations("deliverymen");

  const translateValidationError = (message?: string) => {
    if (!message) return undefined;

    const validationMessages: Record<string, string> = {
      "First name is required": t("validation.firstNameRequired"),
      "Last name is required": t("validation.lastNameRequired"),
      "Invalid email": t("validation.invalidEmail"),
      "Invalid phone number": t("validation.invalidPhone"),
      "Restaurant is required": t("validation.restaurantRequired"),
      "Branch is required": t("validation.branchRequired"),
    };

    return validationMessages[message] || message;
  };

  return (
    <FormSection
      title={t("form.setupBasicInfo")}
      columns={2}
    >
      <ControlledField
        control={control}
        name="firstName"
        id={FIELD_IDS.firstName}
        label={t("form.firstName")}
        required
        error={translateValidationError(errors.firstName?.message)}
      />

      <ControlledField
        control={control}
        name="lastName"
        id={FIELD_IDS.lastName}
        label={t("form.lastName")}
        required
        error={translateValidationError(errors.lastName?.message)}
      />

      <ControlledField
        control={control}
        name="phone"
        id={FIELD_IDS.phone}
        label={t("form.phone")}
        required
        error={translateValidationError(errors.phone?.message)}
      />

      <ControlledField
        control={control}
        name="email"
        id={FIELD_IDS.email}
        label={t("form.email")}
        error={translateValidationError(errors.email?.message)}
      />

      <ControlledField
        control={control}
        name="vehicleType"
        id={FIELD_IDS.vehicleType}
        label={t("form.vehicleType")}
        error={translateValidationError(errors.vehicleType?.message)}
      />

      <ControlledField
        control={control}
        name="vehicleNumber"
        id={FIELD_IDS.vehicleNumber}
        label={t("form.vehicleNumber")}
        error={translateValidationError(errors.vehicleNumber?.message)}
      />

      <FormField
        id={FIELD_IDS.branchId}
        label={t("form.branch").replace(/\s*\*$/, "")}
        required
        error={translateValidationError(errors.branchId?.message)}
        className="md:col-span-2"
      >
        <Controller
          control={control}
          name="branchId"
          render={({ field }) =>
            branchLocked ? (
              <Input
                id={FIELD_IDS.branchId}
                value={
                  selectedBranch?.name ||
                  selectedBranch?.id ||
                  assignedBranchLabel ||
                  t("assignedBranch")
                }
                placeholder={t("form.selectBranch")}
                readOnly
                className="bg-[var(--ui-surface-subtle)] text-[var(--ui-text-muted)]"
              />
            ) : (
              <AsyncSelect
                value={selectedBranch}
                onChange={(branch: BranchOption | null) => {
                  setSelectedBranch(branch);
                  field.onChange(branch?.id ?? "");
                }}
                placeholder={t("form.selectBranch")}
                fetchOptions={fetchBranches}
              />
            )
          }
        />
      </FormField>
    </FormSection>
  );
};

export default DeliveryManForm;

type ControlledFieldProps = {
  control: Control<DeliverymanFormValues>;
  name: keyof Pick<
    DeliverymanFormValues,
    | "firstName"
    | "lastName"
    | "phone"
    | "email"
    | "vehicleType"
    | "vehicleNumber"
  >;
  id: string;
  label: string;
  required?: boolean;
  error?: string;
};

function ControlledField({
  control,
  name,
  id,
  label,
  required = false,
  error,
}: ControlledFieldProps) {
  return (
    <FormField
      id={id}
      label={label.replace(/\s*\*$/, "")}
      required={required}
      error={error}
    >
      {(controlProps) => (
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Input
            {...controlProps}
            placeholder={label}
            value={field.value ?? ""}
            onChange={({ target: { value } }) => field.onChange(value)}
            onBlur={field.onBlur}
          />
        )}
      />
      )}
    </FormField>
  );
}
