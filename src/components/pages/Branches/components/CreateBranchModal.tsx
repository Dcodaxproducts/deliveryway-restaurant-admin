"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import {
  Controller,
  useForm,
  type FieldErrors,
  type Path,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import {
  FIELD_ERROR_CLASS,
  MUTED_TEXT_SM_CLASS,
} from "@/components/common/common-classes";
import {
  BranchLocationPicker,
  type BranchLocationAddressFields,
} from "@/components/pages/Branches/components/BranchLocationPicker";
import { useCreateBranch } from "@/hooks/useBranches";
import {
  createBranchSchema,
  type BranchValues,
  type CreateBranchFormValues,
} from "@/validations/branches";
import { DEFAULT_ALLOWED_PAYMENT_METHODS } from "@/components/pages/branches/forms/EditBranchForm/edit-branch.defaults";
import { useTranslations } from "next-intl";

interface CreateBranchModalProps {
  hasExistingBranches?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const INPUT_CLASS =
  "h-[44px] rounded-[10px] px-3 text-sm placeholder:text-gray-400 border-gray-300 focus-visible:ring-1 focus-visible:ring-primary";
const PRIMARY_INPUT_CLASS = `${INPUT_CLASS} border-primary bg-primary/5`;

const defaultCreateBranchSettings: NonNullable<BranchValues["settings"]> = {
  deliveryConfig: {
    mode: "RADIUS",
    radiusKm: 5,
    minOrderAmount: 0,
    deliveryFee: 0,
    isFreeDelivery: false,
    freeDeliveryThreshold: 0,
    zones: [],
    zoneBands: [],
    postalCodeRules: [],
  },
  allowedOrderTypes: ["DELIVERY"],
  allowedPaymentMethods: DEFAULT_ALLOWED_PAYMENT_METHODS,
  automation: {
    autoAcceptOrders: false,
    estimatedPrepTime: 30,
  },
  taxation: {
    taxPercentage: 0,
  },
  tableReservationsEnabled: false,
  tableReservationAutoAccept: false,
  tableCount: 0,
  contact: {
    phone: "",
    whatsapp: "",
  },
};

const defaultValues: CreateBranchFormValues = {
  restaurantId: "",
  name: "",
  street: "",
  shopNumber: "",
  postalCode: "",
  city: "",
  state: "",
  country: "",
  area: "",
  lat: "",
  lng: "",
  isMain: false,
  settings: defaultCreateBranchSettings,
  branchAdmin: {
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  },
};

const buildCreateBranchSettings = (
  settings: CreateBranchFormValues["settings"],
): NonNullable<BranchValues["settings"]> => ({
  ...defaultCreateBranchSettings,
  ...(settings ?? {}),
  deliveryConfig: {
    ...defaultCreateBranchSettings.deliveryConfig,
    ...(settings?.deliveryConfig ?? {}),
  },
  automation: {
    ...defaultCreateBranchSettings.automation,
    ...(settings?.automation ?? {}),
  },
  taxation: {
    ...defaultCreateBranchSettings.taxation,
    ...(settings?.taxation ?? {}),
  },
  contact: {
    ...defaultCreateBranchSettings.contact,
    ...(settings?.contact ?? {}),
  },
  tableReservationsEnabled: settings?.tableReservationsEnabled ?? false,
  tableReservationAutoAccept: settings?.tableReservationAutoAccept ?? false,
  tableCount: settings?.tableCount ?? 0,
  allowedPaymentMethods:
    settings?.allowedPaymentMethods ?? DEFAULT_ALLOWED_PAYMENT_METHODS,
});

type FieldConfig = {
  name: Path<CreateBranchFormValues>;
  labelKey?: string;
  placeholderKey: string;
  type?: string;
  required?: boolean;
  primary?: boolean;
};

const branchFieldConfigs: FieldConfig[] = [
  {
    name: "name",
    labelKey: "branchName",
    placeholderKey: "branchNamePlaceholder",
    required: true,
    primary: true,
  },
  { name: "street", labelKey: "street", placeholderKey: "streetPlaceholder" },
  { name: "shopNumber", labelKey: "shopNumber", placeholderKey: "shopNumber" },
  { name: "postalCode", labelKey: "postalCode", placeholderKey: "postalCode" },
  { name: "city", labelKey: "city", placeholderKey: "cityPlaceholder" },
  { name: "area", labelKey: "area", placeholderKey: "areaPlaceholder" },
  { name: "state", labelKey: "state", placeholderKey: "statePlaceholder" },
  {
    name: "country",
    labelKey: "country",
    placeholderKey: "countryPlaceholder",
  },
];

const adminFieldConfigs: FieldConfig[] = [
  {
    name: "branchAdmin.firstName",
    labelKey: "firstName",
    placeholderKey: "firstName",
  },
  {
    name: "branchAdmin.lastName",
    labelKey: "lastName",
    placeholderKey: "lastName",
  },
  {
    name: "branchAdmin.email",
    labelKey: "email",
    placeholderKey: "email",
    type: "email",
  },
  {
    name: "branchAdmin.password",
    labelKey: "password",
    placeholderKey: "password",
    type: "password",
  },
  {
    name: "branchAdmin.phone",
    labelKey: "phone",
    placeholderKey: "phone",
    type: "tel",
  },
];

const getErrorMessage = (
  errors: FieldErrors<CreateBranchFormValues>,
  name: Path<CreateBranchFormValues>,
) => {
  if (name.startsWith("branchAdmin.")) {
    const adminKey = name.split(
      ".",
    )[1] as keyof CreateBranchFormValues["branchAdmin"];
    return errors.branchAdmin?.[adminKey]?.message;
  }

  const fieldName = name as keyof Omit<CreateBranchFormValues, "branchAdmin">;
  return errors[fieldName]?.message;
};

export function CreateBranchModal({
  hasExistingBranches = false,
  open,
  onOpenChange,
  onSuccess,
}: CreateBranchModalProps) {
  const t = useTranslations("branches");
  const commonT = useTranslations("common");
  const { user } = useAuth();
  const createBranchMutation = useCreateBranch();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<CreateBranchFormValues>({
    resolver: zodResolver(createBranchSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
    }
  }, [open, reset]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(defaultValues);
    }

    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateBranchFormValues) => {
    const restaurantId = user?.restaurantId;

    if (!restaurantId) {
      return;
    }

    try {
      await createBranchMutation.mutateAsync({
        restaurantId,
        name: values.name,
        street: values.street ?? "",
        shopNumber: values.shopNumber ?? "",
        postalCode: values.postalCode ?? "",
        city: values.city ?? "",
        state: values.state ?? "",
        country: values.country ?? "",
        area: values.area ?? "",
        lat: values.lat ?? "",
        lng: values.lng ?? "",
        isMain: values.isMain,
        settings: buildCreateBranchSettings(values.settings),
        branchAdmin: {
          email: values.branchAdmin.email ?? "",
          password: values.branchAdmin.password ?? "",
          firstName: values.branchAdmin.firstName ?? "",
          lastName: values.branchAdmin.lastName ?? "",
          phone: values.branchAdmin.phone ?? "",
        },
      });

      reset(defaultValues);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      void error;
    }
  };
  const [branchNameFieldConfig, ...addressFieldConfigs] = branchFieldConfigs;

  const handleLocationFieldsChange = (fields: BranchLocationAddressFields) => {
    Object.entries(fields).forEach(([fieldName, value]) => {
      setValue(fieldName as Path<CreateBranchFormValues>, value, {
        shouldDirty: true,
        shouldValidate: true,
      });
    });
  };

  const renderBranchField = (config: FieldConfig) => {
    const { labelKey, name, placeholderKey, primary, required, type } = config;
    const errorMessage = getErrorMessage(errors, name);
    const fieldId = `create-branch-${name.replace(/\./g, "-")}`;

    return (
      <div key={name} className="space-y-1">
        {labelKey ? (
          <Label htmlFor={fieldId} className="text-sm">
            {t(labelKey)}{" "}
            {required ? <span className="text-primary">*</span> : null}
          </Label>
        ) : null}
        {type === "password" ? (
          <PasswordInput
            id={fieldId}
            placeholder={t(placeholderKey)}
            className={primary ? PRIMARY_INPUT_CLASS : INPUT_CLASS}
            aria-invalid={Boolean(errorMessage)}
            {...register(name)}
          />
        ) : (
          <Input
            id={fieldId}
            type={type}
            placeholder={t(placeholderKey)}
            className={primary ? PRIMARY_INPUT_CLASS : INPUT_CLASS}
            aria-invalid={Boolean(errorMessage)}
            {...register(name)}
          />
        )}
        {errorMessage ? (
          <p className={FIELD_ERROR_CLASS}>{errorMessage}</p>
        ) : null}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-[1120px] flex-col gap-0 overflow-hidden rounded-[24px] border-0 bg-white p-0 shadow-2xl shadow-slate-900/15">
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-gradient-to-br from-primary/[0.08] via-white to-orange-50/70 px-6 py-5 pr-16 sm:px-8 sm:py-6">
          <DialogTitle className="text-2xl font-semibold tracking-[-0.02em] text-slate-950">
            {t("createBranch")}
          </DialogTitle>
          <p className={MUTED_TEXT_SM_CLASS}>{t("createDescription")}</p>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-slate-50/80 px-4 py-5 sm:px-8 sm:py-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 sm:p-6">
              <div className="mb-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                {branchNameFieldConfig
                  ? renderBranchField(branchNameFieldConfig)
                  : null}

                {!hasExistingBranches ? (
                  <div className="flex h-[44px] min-w-[180px] items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4">
                    <Label
                      htmlFor="create-branch-is-main"
                      className="text-sm font-medium text-slate-700"
                    >
                      {t("mainBranch")}
                    </Label>
                    <Controller
                      control={control}
                      name="isMain"
                      render={({ field }) => (
                        <Switch
                          id="create-branch-is-main"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary"
                        />
                      )}
                    />
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {t("createBranchLocation")}
                  </h4>
                  <p className="mt-1 text-xs text-gray-500">
                    {t("createBranchLocationDescription")}
                  </p>
                </div>
                <BranchLocationPicker
                  inputId="create-branch-map-search"
                  markerTitle={t("createBranchLocation")}
                  onAddressFieldsChange={handleLocationFieldsChange}
                />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {addressFieldConfigs.map(renderBranchField)}
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 sm:p-6">
                <h4 className="text-base font-semibold text-slate-950">
                  {t("tableReservationSettings")}
                </h4>

                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <Label
                      htmlFor="create-branch-table-reservations"
                      className="text-sm"
                    >
                      {t("enableTableReservations")}
                    </Label>
                    <p className="text-xs text-gray-500">
                      {t("allowTableReservations")}
                    </p>
                  </div>
                  <Controller
                    control={control}
                    name="settings.tableReservationsEnabled"
                    render={({ field }) => (
                      <Switch
                        id="create-branch-table-reservations"
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-primary"
                      />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <Label
                      htmlFor="create-branch-auto-accept-reservations"
                      className="text-sm"
                    >
                      {t("autoAcceptReservations")}
                    </Label>
                    <p className="text-xs text-gray-500">
                      {t("autoAcceptReservationsHelper")}
                    </p>
                  </div>
                  <Controller
                    control={control}
                    name="settings.tableReservationAutoAccept"
                    render={({ field }) => (
                      <Switch
                        id="create-branch-auto-accept-reservations"
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-primary"
                      />
                    )}
                  />
                </div>

                <div className="space-y-1 rounded-xl bg-slate-50 px-4 py-3">
                  <Label
                    htmlFor="create-branch-table-count"
                    className="text-sm"
                  >
                    {t("tableCount")}
                  </Label>
                  <Input
                    id="create-branch-table-count"
                    type="number"
                    min={0}
                    className={`${INPUT_CLASS} bg-white`}
                    aria-invalid={Boolean(errors.settings?.tableCount?.message)}
                    {...register("settings.tableCount", {
                      valueAsNumber: true,
                    })}
                  />
                  <p className="text-xs text-gray-500">
                    {t("tableCountHelper")}
                  </p>
                  {errors.settings?.tableCount?.message ? (
                    <p className={FIELD_ERROR_CLASS}>
                      {errors.settings.tableCount.message}
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 sm:p-6">
                <h4 className="text-base font-semibold text-slate-950">
                  {t("branchAdminInfo")}
                </h4>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {adminFieldConfigs.map(renderBranchField)}
                </div>
              </section>
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-8">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-slate-300 px-6 text-slate-700"
              onClick={() => handleOpenChange(false)}
            >
              {commonT("cancel")}
            </Button>

            <Button
              type="submit"
              className="h-11 rounded-xl bg-primary px-8 text-base hover:bg-primary/90 active:scale-[0.98]"
              disabled={createBranchMutation.isPending}
            >
              {createBranchMutation.isPending
                ? t("creating")
                : commonT("create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
