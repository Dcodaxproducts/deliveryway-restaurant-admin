"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm, type Control } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import AsyncMultiSelect from "@/components/ui/AsyncMultiSelect";
import ImageDropzoneUpload from "@/components/ui/ImageDropzoneUpload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import {
  useCreateStaff,
  useGetStaffRoles,
  useUpdateStaff,
} from "@/hooks/useEmployees";
import {
  FIELD_ERROR_CLASS,
  MUTED_TEXT_SM_CLASS,
} from "@/components/common/common-classes";
import { getApiErrorMessage } from "@/lib/errors";
import { getRestaurants } from "@/services/restaurants";
import {
  staffModalSchema,
  type StaffModalValues,
  type StaffValues,
} from "@/validations/employees";
import { useTranslations } from "next-intl";

type StaffRoleOption = {
  id: string;
  name: string;
  restaurantAccess?: RestaurantAccessScope | null;
  restaurantId?: string | null;
};

type RestaurantAccessScope = {
  restaurantIds?: string[];
  branchIds?: string[];
};

type RestaurantOption = {
  id: string;
  name: string;
};

type RestaurantListResponse = {
  data?: unknown;
  meta?: {
    totalPages?: number;
    page?: number;
    hasNextPage?: boolean;
    hasMore?: boolean;
  };
};

type EmployeeInitialData = Partial<StaffModalValues> & {
  id?: string;
  restaurantAccess?: RestaurantAccessScope | null;
};

type StaffMutationPayload = StaffValues & {
  avatarUrl?: string;
};

type EmployeeInvitationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: EmployeeInitialData | null;
  onSuccess?: () => void;
};

const defaultValues: StaffModalValues = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  staffRoleId: "",
  phone: "",
  avatarUrl: "",
  bio: "",
  isActive: true,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getRestaurantOptions = (response: RestaurantListResponse): RestaurantOption[] => {
  const source = Array.isArray(response.data)
    ? response.data
    : isRecord(response.data) && Array.isArray(response.data.data)
      ? response.data.data
      : [];

  return source
    .filter(isRecord)
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : "",
      name: typeof item.name === "string" ? item.name : String(item.id ?? ""),
    }))
    .filter((item) => item.id);
};

const fetchAllRestaurantOptions = async () => {
  const limit = 100;
  const maxPages = 100;
  const restaurants = new Map<string, RestaurantOption>();

  for (let page = 1; page <= maxPages; page += 1) {
    const response = (await getRestaurants({ page, limit })) as RestaurantListResponse;
    const options = getRestaurantOptions(response);

    options.forEach((restaurant) => restaurants.set(restaurant.id, restaurant));

    const meta = response.meta ?? (isRecord(response.data) && isRecord(response.data.meta)
      ? response.data.meta
      : undefined);
    const totalPages = typeof meta?.totalPages === "number" ? meta.totalPages : undefined;
    const hasNextPage =
      typeof meta?.hasNextPage === "boolean"
        ? meta.hasNextPage
        : typeof meta?.hasMore === "boolean"
          ? meta.hasMore
          : undefined;

    if (totalPages ? page >= totalPages : hasNextPage === false || options.length < limit) {
      break;
    }
  }

  return Array.from(restaurants.values());
};

export default function EmployeeInvitationModal({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: EmployeeInvitationModalProps) {
  const t = useTranslations("employees");
  const { restaurantId, branchId, isBranchAdmin, role } = useAuth();
  const canSelectRestaurants = role === "BUSINESS_ADMIN";
  const isEdit = Boolean(initialData?.id);
  const [selectedRestaurants, setSelectedRestaurants] = useState<RestaurantOption[]>([]);
  const [loadingAllRestaurants, setLoadingAllRestaurants] = useState(false);

  const createStaffMutation = useCreateStaff({
    messages: {
      success: t("messages.staffCreated"),
      error: t("messages.failedCreateStaff"),
    },
  });
  const updateStaffMutation = useUpdateStaff({
    messages: {
      success: t("messages.staffUpdated"),
      error: t("messages.failedUpdateStaff"),
    },
  });

  const { data: rolesData } = useGetStaffRoles(
    isBranchAdmin
      ? { page: 1 }
      : {
          page: 1,
          restaurantId: restaurantId || undefined,
          ...(branchId ? { branchId } : {}),
        },
  );
  const roles = ((rolesData?.data ?? []) as StaffRoleOption[]).filter(
    (role): role is StaffRoleOption => Boolean(role?.id && role?.name),
  );

  const loading =
    createStaffMutation.isPending || updateStaffMutation.isPending;

  const translateValidationError = (message?: string) => {
    if (!message) return undefined;

    const validationMessages: Record<string, string> = {
      "Invalid email": t("validation.invalidEmail"),
      "Password must be at least 8 characters": t("validation.passwordMin"),
      "First name is required": t("validation.firstNameRequired"),
      "Last name is required": t("validation.lastNameRequired"),
      "Staff role is required": t("validation.staffRoleRequired"),
      "Invalid phone number": t("validation.invalidPhone"),
      "Bio must be under 500 characters": t("validation.bioMax"),
    };

    return validationMessages[message] || message;
  };

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
  } = useForm<StaffModalValues>({
    resolver: zodResolver(staffModalSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
      setSelectedRestaurants([]);
      setLoadingAllRestaurants(false);
      return;
    }

    const restaurantIds =
      initialData?.restaurantIds ?? initialData?.restaurantAccess?.restaurantIds ?? [];

    setSelectedRestaurants(
      restaurantIds.map((id) => ({
        id,
        name: id,
      })),
    );

    reset(
      initialData
        ? {
            email: initialData.email ?? "",
            password: "",
            firstName: initialData.firstName ?? "",
            lastName: initialData.lastName ?? "",
            staffRoleId: initialData.staffRoleId ?? "",
            phone: initialData.phone ?? "",
            avatarUrl: initialData.avatarUrl ?? "",
            bio: initialData.bio ?? "",
            isActive: initialData.isActive ?? true,
            restaurantIds,
            branchIds: initialData.branchIds ?? initialData.restaurantAccess?.branchIds,
          }
        : defaultValues,
    );
  }, [initialData, open, reset]);

  const handleAssignAllRestaurants = async () => {
    try {
      setLoadingAllRestaurants(true);
      setSelectedRestaurants(await fetchAllRestaurantOptions());
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("messages.unableLoadRestaurants")));
    } finally {
      setLoadingAllRestaurants(false);
    }
  };

  const onSubmit = async (values: StaffModalValues) => {
    try {
      const selectedRole = roles.find((item) => item.id === values.staffRoleId);
      const roleRestaurantIds = [
        ...(selectedRole?.restaurantAccess?.restaurantIds ?? []),
        ...(selectedRole?.restaurantId ? [selectedRole.restaurantId] : []),
      ];
      const restaurantIds = selectedRestaurants.map((restaurant) => restaurant.id);
      const payload: StaffMutationPayload = {
        email: values.email,
        password: values.password ?? "",
        firstName: values.firstName,
        lastName: values.lastName,
        staffRoleId: values.staffRoleId,
        phone: values.phone,
        avatarUrl: values.avatarUrl,
        bio: values.bio,
        isActive: values.isActive,
        ...(canSelectRestaurants
          ? {
              restaurantIds: restaurantIds.length
                ? restaurantIds
                : roleRestaurantIds.length
                  ? [...new Set(roleRestaurantIds)]
                  : undefined,
            }
          : {}),
        ...(isBranchAdmin
          ? {}
          : {
              restaurantId: restaurantId || undefined,
              ...(branchId ? { branchId } : {}),
            }),
      };

      if (isEdit && initialData?.id) {
        await updateStaffMutation.mutateAsync({
          id: initialData.id,
          data: payload,
        });
      } else {
        await createStaffMutation.mutateAsync(payload);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("messages.unableSaveEmployee")));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[100vh] max-w-[460px] overflow-auto rounded-[20px] p-6">
        <DialogHeader className="space-y-1 text-center">
          <DialogTitle className="text-xl font-semibold">
            {isEdit
              ? t("employeeModal.editTitle")
              : t("employeeModal.inviteTitle")}
          </DialogTitle>
          <DialogDescription className={`text-left ${MUTED_TEXT_SM_CLASS}`}>
            {isEdit
              ? t("employeeModal.editDescription")
              : t("employeeModal.inviteDescription")}
          </DialogDescription>
        </DialogHeader>

        <form
          className="mt-6 space-y-4"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <EmployeeField
            control={control}
            name="email"
            id="employee-email"
            label={t("employeeModal.email")}
            error={translateValidationError(errors.email?.message)}
          />

          <div className="grid grid-cols-2 gap-3">
            <EmployeeField
              control={control}
              name="firstName"
              id="employee-first-name"
              label={t("employeeModal.firstName")}
              error={translateValidationError(errors.firstName?.message)}
            />
            <EmployeeField
              control={control}
              name="lastName"
              id="employee-last-name"
              label={t("employeeModal.lastName")}
              error={translateValidationError(errors.lastName?.message)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <EmployeeField
              control={control}
              name="phone"
              id="employee-phone"
              label={t("employeeModal.phone")}
              error={translateValidationError(errors.phone?.message)}
            />
            <EmployeeField
              control={control}
              name="password"
              id="employee-password"
              label={t("employeeModal.password")}
              type="password"
              error={translateValidationError(errors.password?.message)}
            />
          </div>

          <div>
            <Label htmlFor="employee-role" className="text-sm font-medium">
              {t("employeeModal.role")}
            </Label>
            <Controller
              control={control}
              name="staffRoleId"
              render={({ field }) => (
                <select
                  id="employee-role"
                  value={field.value}
                  onChange={({ target: { value } }) => field.onChange(value)}
                  onBlur={field.onBlur}
                  className="mt-1 h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
                >
                  <option value="">{t("employeeModal.selectRole")}</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.staffRoleId?.message ? (
              <p className={FIELD_ERROR_CLASS}>
                {translateValidationError(errors.staffRoleId.message)}
              </p>
            ) : null}
          </div>

          {canSelectRestaurants ? (
            <div>
              <Label className="text-sm font-medium">
                {t("employeeModal.restaurants")}
              </Label>
              <div className="mt-1">
                <AsyncMultiSelect
                  value={selectedRestaurants}
                  onChange={(restaurants) =>
                    setSelectedRestaurants(restaurants as RestaurantOption[])
                  }
                  placeholder={t("employeeModal.selectRestaurants")}
                  fetchOptions={({ search, page }) =>
                    getRestaurants({ search, page, limit: 20 })
                  }
                  labelKey="name"
                  valueKey="id"
                />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs text-gray-500">
                  {t("employeeModal.restaurantsHelp")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loadingAllRestaurants}
                  onClick={handleAssignAllRestaurants}
                  className="shrink-0"
                >
                  {loadingAllRestaurants
                    ? t("employeeModal.assigningAllRestaurants")
                    : t("employeeModal.assignAllRestaurants")}
                </Button>
              </div>
            </div>
          ) : null}

          <Controller
            control={control}
            name="avatarUrl"
            render={({ field }) => (
              <ImageDropzoneUpload
                label={t("employeeModal.avatar")}
                value={field.value}
                previewAlt={t("employeeModal.avatar")}
                emptyTitle={t("employeeModal.avatar")}
                uploadingText={t("employeeModal.uploading")}
                previewHeightClassName="h-36"
                onChange={(fileUrl) => {
                  field.onChange(fileUrl);
                  setValue("avatarUrl", fileUrl, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                }}
                onClear={() => {
                  field.onChange("");
                  setValue("avatarUrl", "", {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                }}
              />
            )}
          />

          <EmployeeField
            control={control}
            name="bio"
            id="employee-bio"
            label={t("employeeModal.bio")}
            error={translateValidationError(errors.bio?.message)}
          />

          <Button
            type="submit"
            disabled={loading}
            className="mt-6 h-[46px] w-full rounded-xl bg-primary text-white hover:bg-red-600"
          >
            {loading
              ? isEdit
                ? t("actions.updating")
                : t("actions.sending")
              : isEdit
                ? t("actions.updateEmployee")
                : t("actions.sendInvitation")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type EmployeeFieldProps = {
  control: Control<StaffModalValues>;
  name: keyof Pick<
    StaffModalValues,
    "email" | "password" | "firstName" | "lastName" | "phone" | "bio"
  >;
  id: string;
  label: string;
  type?: string;
  error?: string;
};

function EmployeeField({
  control,
  name,
  id,
  label,
  type = "text",
  error,
}: EmployeeFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Input
            id={id}
            type={type}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={({ target: { value } }) => field.onChange(value)}
            onBlur={field.onBlur}
            className="h-[44px] rounded-lg border border-gray-300"
          />
        )}
      />
      {error ? <p className={FIELD_ERROR_CLASS}>{error}</p> : null}
    </div>
  );
}
