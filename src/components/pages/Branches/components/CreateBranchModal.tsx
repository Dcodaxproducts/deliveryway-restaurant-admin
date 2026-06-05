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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { CARD_PANEL_CLASS, FIELD_ERROR_CLASS, MUTED_TEXT_SM_CLASS } from "@/components/common/common-classes";
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
    serviceCharge: {
      isEnabled: false,
      type: "PERCENTAGE",
      value: 0,
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
  settings: CreateBranchFormValues["settings"]
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
  serviceCharge: {
    isEnabled: settings?.serviceCharge?.isEnabled ?? false,
    type: settings?.serviceCharge?.type ?? "PERCENTAGE",
    value: settings?.serviceCharge?.isEnabled
      ? Number(settings?.serviceCharge?.value ?? 0)
      : 0,
  },
  contact: {
    ...defaultCreateBranchSettings.contact,
    ...(settings?.contact ?? {}),
  },
  tableReservationsEnabled: settings?.tableReservationsEnabled ?? false,
  tableReservationAutoAccept: settings?.tableReservationAutoAccept ?? false,
  tableCount: settings?.tableCount ?? 0,
  allowedPaymentMethods: DEFAULT_ALLOWED_PAYMENT_METHODS,
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
  { name: "city", labelKey: "city", placeholderKey: "cityPlaceholder" },
  { name: "state", labelKey: "state", placeholderKey: "statePlaceholder" },
  { name: "country", labelKey: "country", placeholderKey: "countryPlaceholder" },
  { name: "area", labelKey: "area", placeholderKey: "areaPlaceholder" },
];

const adminFieldConfigs: FieldConfig[] = [
  { name: "branchAdmin.firstName", placeholderKey: "firstName" },
  { name: "branchAdmin.lastName", placeholderKey: "lastName" },
  { name: "branchAdmin.email", placeholderKey: "email" },
  { name: "branchAdmin.password", placeholderKey: "password", type: "password" },
  { name: "branchAdmin.phone", placeholderKey: "phone" },
];

const getErrorMessage = (
  errors: FieldErrors<CreateBranchFormValues>,
  name: Path<CreateBranchFormValues>
) => {
  if (name.startsWith("branchAdmin.")) {
    const adminKey = name.split(".")[1] as keyof CreateBranchFormValues["branchAdmin"];
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
    watch,
  } = useForm<CreateBranchFormValues>({
    resolver: zodResolver(createBranchSchema),
    defaultValues,
  });
  const serviceCharge = watch("settings.serviceCharge");
  const serviceChargeEnabled = Boolean(serviceCharge?.isEnabled);
  const serviceChargeType = serviceCharge?.type ?? "PERCENTAGE";

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
            {t(labelKey)} {required ? <span className="text-primary">*</span> : null}
          </Label>
        ) : null}
        <Input
          id={fieldId}
          type={type}
          placeholder={t(placeholderKey)}
          className={primary ? PRIMARY_INPUT_CLASS : INPUT_CLASS}
          aria-invalid={Boolean(errorMessage)}
          {...register(name)}
        />
        {errorMessage ? (
          <p className={FIELD_ERROR_CLASS}>{errorMessage}</p>
        ) : null}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[760px] rounded-[20px] p-6 bg-[#F5F5F5] max-h-[95vh] overflow-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-semibold">{t("createBranch")}</DialogTitle>
          <p className={MUTED_TEXT_SM_CLASS}>{t("createDescription")}</p>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className={`mt-4 ${CARD_PANEL_CLASS} space-y-4`}>
            {branchNameFieldConfig ? renderBranchField(branchNameFieldConfig) : null}

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

            {addressFieldConfigs.map(renderBranchField)}

            {!hasExistingBranches ? (
              <div className="flex items-center justify-between">
                <Label htmlFor="create-branch-is-main" className="text-sm">
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

            <hr className="border-gray-200 my-2" />

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {t("serviceCharge")}
                </h4>
                <p className="text-xs text-gray-500">
                  {t("serviceChargeDescription")}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-[12px] border p-4">
                <div>
                  <Label htmlFor="create-branch-service-charge-enabled" className="text-sm">
                    {t("enableServiceCharge")}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {t("serviceChargeDescription")}
                  </p>
                </div>
                <Controller
                  control={control}
                  name="settings.serviceCharge.isEnabled"
                  render={({ field }) => (
                    <Switch
                      id="create-branch-service-charge-enabled"
                      checked={field.value ?? false}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);

                        if (!checked) {
                          setValue("settings.serviceCharge.type", "PERCENTAGE", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          setValue("settings.serviceCharge.value", 0, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      }}
                      className="data-[state=checked]:bg-primary"
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="create-branch-service-charge-type" className="text-sm">
                    {t("chargeType")}
                  </Label>
                  <Controller
                    control={control}
                    name="settings.serviceCharge.type"
                    render={({ field }) => (
                      <Select
                        disabled={!serviceChargeEnabled}
                        value={field.value ?? "PERCENTAGE"}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="create-branch-service-charge-type"
                          className="h-[44px] rounded-[10px] border-gray-300 text-sm"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">{t("percentage")}</SelectItem>
                          <SelectItem value="AMOUNT">{t("fixedAmount")}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="create-branch-service-charge-value" className="text-sm">
                    {serviceChargeType === "AMOUNT" ? t("amount") : t("percentage")}
                  </Label>
                  <Input
                    id="create-branch-service-charge-value"
                    type="number"
                    min={0}
                    max={serviceChargeType === "PERCENTAGE" ? 100 : undefined}
                    step="0.01"
                    disabled={!serviceChargeEnabled}
                    className={INPUT_CLASS}
                    aria-invalid={Boolean(errors.settings?.serviceCharge?.value?.message)}
                    {...register("settings.serviceCharge.value", { valueAsNumber: true })}
                  />
                  <p className="text-xs text-gray-500">
                    {serviceChargeType === "AMOUNT"
                      ? t("serviceChargeAmountHelper")
                      : t("serviceChargePercentageHelper")}
                  </p>
                  {errors.settings?.serviceCharge?.value?.message ? (
                    <p className={FIELD_ERROR_CLASS}>
                      {errors.settings.serviceCharge.value.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <hr className="border-gray-200 my-2" />

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">
                {t("tableReservationSettings")}
              </h4>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="create-branch-table-reservations" className="text-sm">
                    {t("enableTableReservations")}
                  </Label>
                  <p className="text-xs text-gray-500">{t("allowTableReservations")}</p>
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

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="create-branch-auto-accept-reservations" className="text-sm">
                    {t("autoAcceptReservations")}
                  </Label>
                  <p className="text-xs text-gray-500">{t("autoAcceptReservationsHelper")}</p>
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

              <div className="space-y-1">
                <Label htmlFor="create-branch-table-count" className="text-sm">
                  {t("tableCount")}
                </Label>
                <Input
                  id="create-branch-table-count"
                  type="number"
                  min={0}
                  className={INPUT_CLASS}
                  aria-invalid={Boolean(errors.settings?.tableCount?.message)}
                  {...register("settings.tableCount", { valueAsNumber: true })}
                />
                <p className="text-xs text-gray-500">{t("tableCountHelper")}</p>
                {errors.settings?.tableCount?.message ? (
                  <p className={FIELD_ERROR_CLASS}>
                    {errors.settings.tableCount.message}
                  </p>
                ) : null}
              </div>
            </div>

            <hr className="border-gray-200 my-2" />

            <h4 className="text-sm font-medium text-gray-900">{t("branchAdminInfo")}</h4>

            {adminFieldConfigs.map((config) => {
              const { name, placeholderKey, type } = config;
              const errorMessage = getErrorMessage(errors, name);
              const fieldId = `create-branch-${name.replace(/\./g, "-")}`;

              return (
                <div key={name} className="space-y-1">
                  <Label htmlFor={fieldId} className="sr-only">
                    {t(placeholderKey)}
                  </Label>
                  <Input
                    id={fieldId}
                    type={type}
                    placeholder={t(placeholderKey)}
                    className={INPUT_CLASS}
                    aria-invalid={Boolean(errorMessage)}
                    {...register(name)}
                  />
                  {errorMessage ? (
                    <p className={FIELD_ERROR_CLASS}>{errorMessage}</p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="ghost"
              className="text-gray-700 text-[17px]"
              onClick={() => handleOpenChange(false)}
            >
              {commonT("cancel")}
            </Button>

            <Button
              type="submit"
              className="px-8 py-2 rounded-[10px] bg-primary hover:bg-primary/90 text-[17px]"
              disabled={createBranchMutation.isPending}
            >
              {createBranchMutation.isPending ? t("creating") : commonT("create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
