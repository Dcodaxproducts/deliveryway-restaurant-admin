"use client";

import { Info } from "lucide-react";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";

import AsyncSelect from "@/components/ui/AsyncSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="h-fit overflow-visible rounded-[14px] bg-white p-[30px]">
      <div className="grid grid-cols-12 gap-[48px] overflow-visible">
        <div className="col-span-4 space-y-[64px]">
          <SectionTitle title={t("form.setupBasicInfo")} />
        </div>

        <div className="col-span-8 space-y-[40px] overflow-visible">
          <section className="space-y-[24px] overflow-visible">
            <div className="grid grid-cols-2 gap-[24px]">
              <ControlledField
                control={control}
                name="firstName"
                id={FIELD_IDS.firstName}
                label={t("form.firstName")}
                error={translateValidationError(errors.firstName?.message)}
              />

              <ControlledField
                control={control}
                name="lastName"
                id={FIELD_IDS.lastName}
                label={t("form.lastName")}
                error={translateValidationError(errors.lastName?.message)}
              />
            </div>

            <div className="grid grid-cols-2 gap-[24px]">
              <ControlledField
                control={control}
                name="phone"
                id={FIELD_IDS.phone}
                label={t("form.phone")}
                error={translateValidationError(errors.phone?.message)}
              />

              <ControlledField
                control={control}
                name="email"
                id={FIELD_IDS.email}
                label={t("form.email")}
                error={translateValidationError(errors.email?.message)}
              />
            </div>

            <div className="grid grid-cols-2 gap-[24px]">
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
            </div>

            <div className="h-[55vh] space-y-[6px] overflow-visible">
              <Label htmlFor={FIELD_IDS.branchId}>{t("form.branch")}</Label>

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
                      readOnly
                      className="h-[44px] border-[#BBBBBB] bg-gray-50 text-gray-600"
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
              {errors.branchId?.message ? (
                <p className="text-xs text-primary">
                  {translateValidationError(errors.branchId.message)}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DeliveryManForm;

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-[12px]">
      <Info size={18} className="text-gray-400" />
      <span className="text-base font-semibold text-[#646982]">{title}</span>
    </div>
  );
}

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
  error?: string;
};

function ControlledField({
  control,
  name,
  id,
  label,
  error,
}: ControlledFieldProps) {
  return (
    <div className="space-y-[6px]">
      <Label htmlFor={id}>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Input
            id={id}
            value={field.value ?? ""}
            onChange={({ target: { value } }) => field.onChange(value)}
            onBlur={field.onBlur}
            className="h-[44px] border-[#BBBBBB]"
          />
        )}
      />
      {error ? <p className="text-xs text-primary">{error}</p> : null}
    </div>
  );
}
