"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Controller,
  useForm,
  type FieldErrors,
  type Path,
} from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Store,
  UtensilsCrossed,
  UsersRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  FIELD_ERROR_CLASS,
  MUTED_TEXT_SM_CLASS,
} from "@/components/common/common-classes";
import {
  assignMenusBeforeOptionalSuspend,
  BranchSetupWorkflowError,
  extractCreatedBranch,
  extractRestaurantMenus,
  type CreatedBranch,
} from "@/components/pages/Branches/components/branch-workflow-utils";
import {
  BranchLocationPicker,
  type BranchLocationAddressFields,
} from "@/components/pages/Branches/components/BranchLocationPicker";
import { DEFAULT_ALLOWED_PAYMENT_METHODS } from "@/components/pages/branches/forms/EditBranchForm/edit-branch.defaults";
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
import { useCreateBranch } from "@/hooks/useBranches";
import { useGetRestaurantMenus } from "@/hooks/useMenus";
import { getApiErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import {
  getBranchMenuAssignment,
  replaceBranchMenuAssignment,
  suspendBranch,
} from "@/services/branches";
import {
  createBranchSchema,
  type BranchValues,
  type CreateBranchFormValues,
} from "@/validations/branches";

interface CreateBranchModalProps {
  hasExistingBranches?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type WorkflowStep = 1 | 2 | 3;

const INPUT_CLASS =
  "h-11 rounded-[10px] border-gray-300 px-3 text-sm placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-primary";
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
  automation: { autoAcceptOrders: false, estimatedPrepTime: 30 },
  taxation: { taxPercentage: 0 },
  tableReservationsEnabled: false,
  tableReservationAutoAccept: false,
  tableCount: 0,
  contact: { phone: "", whatsapp: "" },
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
  labelKey: string;
  placeholderKey: string;
  type?: string;
  required?: boolean;
  primary?: boolean;
};
const addressFields: FieldConfig[] = [
  {
    name: "street",
    labelKey: "street",
    placeholderKey: "streetPlaceholder",
    required: true,
  },
  { name: "shopNumber", labelKey: "shopNumber", placeholderKey: "shopNumber" },
  { name: "postalCode", labelKey: "postalCode", placeholderKey: "postalCode" },
  {
    name: "city",
    labelKey: "city",
    placeholderKey: "cityPlaceholder",
    required: true,
  },
  {
    name: "state",
    labelKey: "state",
    placeholderKey: "statePlaceholder",
    required: true,
  },
  {
    name: "country",
    labelKey: "country",
    placeholderKey: "countryPlaceholder",
    required: true,
  },
];
const adminFields: FieldConfig[] = [
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
    const key = name.split(
      ".",
    )[1] as keyof CreateBranchFormValues["branchAdmin"];
    return errors.branchAdmin?.[key]?.message;
  }
  return errors[name as keyof Omit<CreateBranchFormValues, "branchAdmin">]
    ?.message;
};

export function CreateBranchModal({
  hasExistingBranches = false,
  open,
  onOpenChange,
  onSuccess,
}: CreateBranchModalProps) {
  const t = useTranslations("branches");
  const commonT = useTranslations("common");
  const router = useRouter();
  const { user } = useAuth();
  const createBranchMutation = useCreateBranch();
  const [step, setStep] = useState<WorkflowStep>(1);
  const [isActive, setIsActive] = useState(true);
  const [createdBranch, setCreatedBranch] = useState<CreatedBranch | null>(
    null,
  );
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [defaultMenuId, setDefaultMenuId] = useState<string | null>(null);
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [assignmentSaved, setAssignmentSaved] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [statusFinalizing, setStatusFinalizing] = useState(false);
  const [statusFinalizationError, setStatusFinalizationError] = useState<
    string | null
  >(null);
  const {
    data: menuResponse,
    isLoading: menusLoading,
    isFetching: menusFetching,
    isError: menusError,
    refetch: refetchMenus,
  } = useGetRestaurantMenus(
    {
      restaurantId: user?.restaurantId ?? undefined,
      limit: 100,
      isActive: true,
    },
    open && step === 3 && Boolean(user?.restaurantId),
  );
  const menus = useMemo(
    () => extractRestaurantMenus(menuResponse),
    [menuResponse],
  );
  const {
    data: currentAssignment,
    isFetching: assignmentFetching,
    isError: assignmentLoadError,
    refetch: refetchAssignment,
  } = useQuery({
    queryKey: ["branch-menu-assignment", createdBranch?.id],
    queryFn: () => getBranchMenuAssignment(createdBranch?.id ?? ""),
    enabled: open && step === 3 && Boolean(createdBranch?.id),
    retry: false,
  });

  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
    trigger,
    watch,
  } = useForm<CreateBranchFormValues>({
    resolver: zodResolver(createBranchSchema),
    defaultValues,
  });
  const values = watch();

  const resetWorkflow = () => {
    reset(defaultValues);
    setStep(1);
    setIsActive(true);
    setCreatedBranch(null);
    setSelectedMenuIds([]);
    setDefaultMenuId(null);
    setAssignmentSaved(false);
    setAssignmentError(null);
    setStatusFinalizing(false);
    setStatusFinalizationError(null);
  };

  useEffect(() => {
    if (!open) resetWorkflow();
  }, [open]);

  useEffect(() => {
    if (!currentAssignment) return;
    setSelectedMenuIds(currentAssignment.menuIds);
    setDefaultMenuId(currentAssignment.defaultMenuId);
  }, [currentAssignment]);

  const closeWorkflow = () => {
    resetWorkflow();
    onOpenChange(false);
  };

  const handleLocationFieldsChange = (fields: BranchLocationAddressFields) => {
    Object.entries(fields).forEach(([fieldName, value]) => {
      setValue(fieldName as Path<CreateBranchFormValues>, value, {
        shouldDirty: true,
        shouldValidate: true,
      });
    });
  };

  const goToReview = async () => {
    const valid = await trigger();
    if (valid) setStep(2);
  };

  const onSubmit = async (formValues: CreateBranchFormValues) => {
    const restaurantId = user?.restaurantId;
    if (!restaurantId) return;
    const admin = formValues.branchAdmin;
    const hasAdmin = Boolean(
      admin.email ||
      admin.firstName ||
      admin.lastName ||
      admin.phone ||
      admin.password,
    );
    try {
      const response = await createBranchMutation.mutateAsync({
        restaurantId,
        name: formValues.name,
        street: formValues.street ?? "",
        shopNumber: formValues.shopNumber ?? "",
        postalCode: formValues.postalCode ?? "",
        city: formValues.city ?? "",
        state: formValues.state ?? "",
        country: formValues.country ?? "",
        area: formValues.area ?? "",
        lat: formValues.lat ?? "",
        lng: formValues.lng ?? "",
        settings: buildCreateBranchSettings(formValues.settings),
        ...(hasAdmin
          ? {
              branchAdmin: {
                email: admin.email ?? "",
                password: admin.password || undefined,
                firstName: admin.firstName ?? "",
                lastName: admin.lastName ?? "",
                phone: admin.phone ?? "",
              },
            }
          : {}),
      });
      const branch = extractCreatedBranch(response);
      if (!branch) throw new Error(t("createdBranchMissing"));
      setCreatedBranch({ ...branch, name: branch.name || formValues.name });
      setStep(3);
      onSuccess?.();
    } catch (error: unknown) {
      setAssignmentError(getApiErrorMessage(error, t("createFailed")));
    }
  };

  const toggleMenu = (menuId: string) => {
    setSelectedMenuIds((current) => {
      if (current.includes(menuId)) {
        const next = current.filter((id) => id !== menuId);
        if (defaultMenuId === menuId) setDefaultMenuId(next[0] ?? null);
        return next;
      }
      const next = [...current, menuId];
      if (!defaultMenuId) setDefaultMenuId(menuId);
      return next;
    });
  };

  const finalizeRequestedStatus = async () => {
    if (!createdBranch) return false;
    setStatusFinalizing(true);
    setStatusFinalizationError(null);

    if (isActive) {
      setStatusFinalizing(false);
      closeWorkflow();
      return true;
    }

    try {
      await suspendBranch(createdBranch.id);
      toast.success(t("inactiveStatusApplied"));
      onSuccess?.();
      setStatusFinalizing(false);
      closeWorkflow();
      return true;
    } catch (error) {
      setStatusFinalizationError(
        getApiErrorMessage(error, t("finalSuspendFailed")),
      );
      setStatusFinalizing(false);
      return false;
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    if (step === 3 && createdBranch) {
      void finalizeRequestedStatus();
      return;
    }
    closeWorkflow();
  };

  const finishWithoutAssignment = async () => {
    await finalizeRequestedStatus();
  };

  const saveMenuAssignment = async () => {
    if (!createdBranch || !selectedMenuIds.length || !defaultMenuId) return;
    const menuIds: [string, ...string[]] = [
      selectedMenuIds[0],
      ...selectedMenuIds.slice(1),
    ];
    setAssignmentSaving(true);
    setAssignmentError(null);
    try {
      await assignMenusBeforeOptionalSuspend({
        assignMenus: () =>
          replaceBranchMenuAssignment(createdBranch.id, {
            menuIds,
            defaultMenuId,
          }),
        suspendBranch: () => suspendBranch(createdBranch.id),
        shouldSuspend: !isActive,
        onAssignmentSaved: () => {
          setAssignmentSaved(true);
          toast.success(t("menuAssignmentSaved"));
        },
      });
      if (!isActive) {
        toast.success(t("inactiveStatusApplied"));
        onSuccess?.();
      }
      closeWorkflow();
    } catch (error) {
      if (
        error instanceof BranchSetupWorkflowError &&
        error.stage === "status"
      ) {
        setStatusFinalizationError(
          getApiErrorMessage(error.cause, t("finalSuspendFailed")),
        );
      } else {
        const cause =
          error instanceof BranchSetupWorkflowError ? error.cause : error;
        setAssignmentError(
          getApiErrorMessage(cause, t("menuAssignmentSaveFailed")),
        );
      }
    } finally {
      setAssignmentSaving(false);
    }
  };

  const renderField = (config: FieldConfig) => {
    const rawMessage = getErrorMessage(errors, config.name);
    const message = rawMessage?.startsWith("validation.")
      ? t(rawMessage)
      : rawMessage;
    const id = `create-branch-${config.name.replace(/\./g, "-")}`;
    const fieldProps = {
      id,
      placeholder: t(config.placeholderKey),
      className: config.primary ? PRIMARY_INPUT_CLASS : INPUT_CLASS,
      "aria-invalid": Boolean(message),
      ...register(config.name),
    };
    return (
      <div key={config.name} className="space-y-1.5">
        <Label htmlFor={id}>
          {t(config.labelKey)}
          {config.required ? <span className="text-primary"> *</span> : null}
        </Label>
        {config.type === "password" ? (
          <PasswordInput {...fieldProps} />
        ) : (
          <Input type={config.type} {...fieldProps} />
        )}
        {message ? <p className={FIELD_ERROR_CLASS}>{message}</p> : null}
      </div>
    );
  };

  const steps = [t("workflowDetails"), t("workflowReview"), t("workflowMenu")];
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[92dvh] max-w-[960px] flex-col gap-0 overflow-hidden rounded-[20px] border-0 bg-white p-0 shadow-2xl shadow-slate-900/15">
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-gradient-to-br from-primary/[0.08] via-white to-orange-50/70 px-5 py-5 pr-14 sm:px-8">
          <DialogTitle className="tracking-[-0.02em] text-slate-950">
            {t("createBranch")}
          </DialogTitle>
          <p className={MUTED_TEXT_SM_CLASS}>{t("workflowDescription")}</p>
          <ol
            className="mt-4 grid grid-cols-3 gap-2"
            aria-label={t("workflowProgress")}
          >
            {steps.map((label, index) => {
              const number = (index + 1) as WorkflowStep;
              const complete = step > number;
              const active = step === number;
              return (
                <li
                  key={label}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-medium sm:px-3",
                    active
                      ? "border-primary bg-primary/5 text-primary"
                      : complete
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-500",
                  )}
                >
                  {complete ? (
                    <Check className="size-4 shrink-0" />
                  ) : (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px]">
                      {number}
                    </span>
                  )}
                  <span className="truncate">{label}</span>
                </li>
              );
            })}
          </ol>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/80 px-4 py-5 sm:px-8 sm:py-6">
            {step === 1 ? (
              <div className="space-y-5">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Store className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-950">
                        {t("branchDetails")}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {t("branchDetailsDescription")}
                      </p>
                    </div>
                  </div>
                  {renderField({
                    name: "name",
                    labelKey: "branchName",
                    placeholderKey: "branchNamePlaceholder",
                    required: true,
                    primary: true,
                  })}
                  <div className="mt-5 space-y-2">
                    <h4 className="text-sm font-medium text-slate-900">
                      {t("createBranchLocation")}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {t("createBranchLocationDescription")}
                    </p>
                    <BranchLocationPicker
                      inputId="create-branch-map-search"
                      markerTitle={t("createBranchLocation")}
                      onAddressFieldsChange={handleLocationFieldsChange}
                    />
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {addressFields.map(renderField)}
                  </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <UsersRound className="size-5 text-primary" />
                      <div>
                        <h3 className="font-semibold text-slate-950">
                          {t("branchContact")}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {t("branchContactDescription")}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {renderField({
                        name: "settings.contact.phone",
                        labelKey: "phone",
                        placeholderKey: "phone",
                        type: "tel",
                      })}
                      {renderField({
                        name: "settings.contact.whatsapp",
                        labelKey: "whatsapp",
                        placeholderKey: "phone",
                        type: "tel",
                      })}
                    </div>
                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {t("branchAdminInfo")}
                      </h4>
                      <p className="mb-4 text-xs text-slate-500">
                        {t("branchAdminOptional")}
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {adminFields.map(renderField)}
                      </div>
                    </div>
                  </section>
                  <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <h3 className="font-semibold text-slate-950">
                      {t("availabilityStatus")}
                    </h3>
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
                      <div>
                        <Label htmlFor="create-branch-active">
                          {isActive
                            ? t("activeAfterCreation")
                            : t("inactiveAfterCreation")}
                        </Label>
                        <p className="mt-1 text-xs text-slate-500">
                          {t("availabilityStatusDescription")}
                        </p>
                      </div>
                      <Switch
                        id="create-branch-active"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                      />
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <Controller
                        control={control}
                        name="settings.tableReservationsEnabled"
                        render={({ field }) => (
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <Label htmlFor="create-branch-table-reservations">
                                {t("enableTableReservations")}
                              </Label>
                              <p className="mt-1 text-xs text-slate-500">
                                {t("allowTableReservations")}
                              </p>
                            </div>
                            <Switch
                              id="create-branch-table-reservations"
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                            />
                          </div>
                        )}
                      />
                    </div>
                  </section>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <section className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    {t("reviewBranch")}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {t("reviewBranchDescription")}
                  </p>
                </div>
                <dl className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {t("branchName")}
                    </dt>
                    <dd className="mt-1 font-medium text-slate-950">
                      {values.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {t("availabilityStatus")}
                    </dt>
                    <dd className="mt-1 font-medium text-slate-950">
                      {isActive ? t("active") : t("inactive")}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {t("address")}
                    </dt>
                    <dd className="mt-1 text-sm text-slate-700">
                      {[
                        values.street,
                        values.shopNumber,
                        values.postalCode,
                        values.city,
                        values.state,
                        values.country,
                      ]
                        .filter(Boolean)
                        .join(", ") || t("notProvided")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {t("phone")}
                    </dt>
                    <dd className="mt-1 text-sm text-slate-700">
                      {values.settings?.contact?.phone || t("notProvided")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {t("branchAdminInfo")}
                    </dt>
                    <dd className="mt-1 text-sm text-slate-700">
                      {values.branchAdmin.email || t("notProvided")}
                    </dd>
                  </div>
                </dl>
                {assignmentError ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    {assignmentError}
                  </p>
                ) : null}
              </section>
            ) : null}

            {step === 3 && createdBranch ? (
              <section className="mx-auto max-w-3xl space-y-5">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" />
                    <div>
                      <h3 className="font-semibold text-emerald-950">
                        {t("branchCreated", { name: createdBranch.name })}
                      </h3>
                      <p className="mt-1 text-sm text-emerald-800">
                        {hasExistingBranches
                          ? t("branchAddedToList")
                          : t("firstBranchAdded")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-5 flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <UtensilsCrossed className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-950">
                        {t("assignMenus")}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {t("assignMenusDescription")}
                      </p>
                    </div>
                  </div>

                  {assignmentFetching ? (
                    <p
                      role="status"
                      aria-live="polite"
                      className="mb-3 text-sm text-slate-500"
                    >
                      {t("loadingMenuAssignment")}
                    </p>
                  ) : null}
                  {assignmentLoadError ? (
                    <div
                      role="alert"
                      className="mb-3 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span>{t("menuAssignmentLoadUnavailable")}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label={t("retryMenuAssignmentLoad")}
                        disabled={assignmentFetching}
                        onClick={() => void refetchAssignment()}
                      >
                        {t("retry")}
                      </Button>
                    </div>
                  ) : null}
                  {menusLoading || menusFetching ? (
                    <p
                      role="status"
                      aria-live="polite"
                      className="text-sm text-slate-500"
                    >
                      {t("loadingMenus")}
                    </p>
                  ) : null}
                  {menusError ? (
                    <div
                      role="alert"
                      className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span>{t("menusLoadFailed")}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label={t("retryMenusLoad")}
                        disabled={menusFetching}
                        onClick={() => void refetchMenus()}
                      >
                        {t("retry")}
                      </Button>
                    </div>
                  ) : null}
                  {!menusLoading &&
                  !menusFetching &&
                  !menusError &&
                  menus.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center">
                      <p className="font-medium text-slate-800">
                        {t("noMenusAvailable")}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {t("noMenusAvailableDescription")}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          void finalizeRequestedStatus().then((finalized) => {
                            if (finalized) router.push("/menu");
                          });
                        }}
                      >
                        {t("openMenuManagement")}
                      </Button>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    {menus.map((menu) => {
                      const selected = selectedMenuIds.includes(menu.id);
                      return (
                        <div
                          key={menu.id}
                          className={cn(
                            "flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center",
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-slate-200",
                          )}
                        >
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            aria-pressed={selected}
                            onClick={() => toggleMenu(menu.id)}
                          >
                            <span
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded border",
                                selected
                                  ? "border-primary bg-primary text-white"
                                  : "border-slate-300",
                              )}
                            >
                              {selected ? <Check className="size-3.5" /> : null}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-slate-900">
                                {menu.name}
                              </span>
                              {menu.isDefault ? (
                                <span className="text-xs text-slate-500">
                                  {t("restaurantDefaultMenu")}
                                </span>
                              ) : null}
                            </span>
                          </button>
                          {selected ? (
                            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                              <input
                                type="radio"
                                name="default-menu"
                                checked={defaultMenuId === menu.id}
                                onChange={() => setDefaultMenuId(menu.id)}
                              />
                              {t("branchDefaultMenu")}
                            </label>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {assignmentError ? (
                    <p
                      role="alert"
                      className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
                    >
                      {assignmentError}
                    </p>
                  ) : null}
                  {statusFinalizationError ? (
                    <div
                      role="alert"
                      className="mt-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span>
                        {statusFinalizationError} {t("branchRemainsActive")}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label={t("retryInactiveStatus")}
                        disabled={statusFinalizing}
                        onClick={() => void finalizeRequestedStatus()}
                      >
                        {statusFinalizing ? t("applyingStatus") : t("retry")}
                      </Button>
                    </div>
                  ) : null}
                  {!selectedMenuIds.length && menus.length ? (
                    <p className="mt-4 text-xs text-slate-500">
                      {t("skipMenuAssignmentDescription")}
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl px-6"
              disabled={step === 3 && statusFinalizing}
              onClick={() => {
                if (step === 3) {
                  void finishWithoutAssignment();
                  return;
                }
                if (step === 1) {
                  handleOpenChange(false);
                  return;
                }
                setStep(1);
              }}
            >
              {step === 2 ? <ChevronLeft className="size-4" /> : null}
              {step === 3
                ? t("finishLater")
                : step === 2
                  ? t("back")
                  : commonT("cancel")}
            </Button>
            {step === 1 ? (
              <Button
                type="button"
                className="h-11 rounded-xl px-7"
                onClick={() => void goToReview()}
              >
                {t("reviewAndCreate")}
                <ChevronRight className="size-4" />
              </Button>
            ) : null}
            {step === 2 ? (
              <Button
                type="submit"
                className="h-11 rounded-xl px-8"
                disabled={createBranchMutation.isPending}
              >
                {createBranchMutation.isPending
                  ? t("creating")
                  : t("confirmCreate")}
              </Button>
            ) : null}
            {step === 3 ? (
              <Button
                type="button"
                className="h-11 rounded-xl px-8"
                disabled={
                  assignmentSaving ||
                  statusFinalizing ||
                  assignmentSaved ||
                  !selectedMenuIds.length ||
                  !defaultMenuId
                }
                onClick={() => void saveMenuAssignment()}
              >
                {assignmentSaving || statusFinalizing
                  ? assignmentSaving
                    ? t("savingMenuAssignment")
                    : t("applyingStatus")
                  : t("saveMenuAssignment")}
              </Button>
            ) : null}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
