"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useCreateStaffRole, useUpdateStaffRole } from "@/hooks/useEmployees";
import { FIELD_ERROR_CLASS } from "@/components/common/common-classes";
import { getApiErrorMessage } from "@/lib/errors";
import {
  staffRoleSchema,
  type StaffPermissionValues,
  type StaffRoleValues,
} from "@/validations/employees";
import { useTranslations } from "next-intl";

type RoleInitialData = Partial<StaffRoleValues> & {
  id?: string;
};

type RoleModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: RoleInitialData | null;
  onSuccess?: () => void;
  restaurantId?: string;
  branchId?: string;
};

const ACCESS_OPTIONS = ["Zone", "Orders", "Employees", "Menu", "Reports"];
const OPERATIONS = ["Create", "Read", "Update", "Delete"];

const defaultValues: StaffRoleValues = {
  name: "",
  description: "",
  permissions: [],
};

export function AddRoleModal({
  open,
  onOpenChange,
  initialData,
  onSuccess,
  restaurantId: scopedRestaurantId,
  branchId: scopedBranchId,
}: RoleModalProps) {
  const t = useTranslations("employees");
  const {
    restaurantId: authRestaurantId,
    branchId: authBranchId,
    isBranchAdmin,
  } = useAuth();
  const restaurantId = scopedRestaurantId ?? authRestaurantId ?? undefined;
  const branchId = scopedBranchId ?? (isBranchAdmin ? authBranchId : undefined);

  const [selectedAccess, setSelectedAccess] = useState("");
  const [selectedOps, setSelectedOps] = useState<string[]>([]);

  const isEditMode = Boolean(initialData?.id);
  const createRoleMutation = useCreateStaffRole({
    messages: {
      success: t("messages.roleCreated"),
      error: t("messages.failedCreateRole"),
    },
  });
  const updateRoleMutation = useUpdateStaffRole({
    messages: {
      success: t("messages.roleUpdated"),
      error: t("messages.failedUpdateRole"),
    },
  });
  const loading = createRoleMutation.isPending || updateRoleMutation.isPending;

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<StaffRoleValues>({
    resolver: zodResolver(staffRoleSchema),
    defaultValues,
  });

  const permissions = watch("permissions") ?? [];

  const getAccessLabel = (access: string) =>
    ACCESS_OPTIONS.includes(access) ? t(`access.${access}`) : access;

  const getOperationLabel = (operation: string) =>
    OPERATIONS.includes(operation) ? t(`operations.${operation}`) : operation;

  const translateValidationError = (message?: string) => {
    if (!message) return undefined;

    const validationMessages: Record<string, string> = {
      "Role name is required": t("validation.roleNameRequired"),
      "Access is required": t("validation.accessRequired"),
      "At least one operation is required": t("validation.operationRequired"),
      "At least one permission is required": t("validation.permissionRequired"),
    };

    return validationMessages[message] || message;
  };

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
      setSelectedAccess("");
      setSelectedOps([]);
      return;
    }

    reset(
      initialData
        ? {
            name: initialData.name ?? "",
            description: initialData.description ?? "",
            permissions: initialData.permissions ?? [],
            restaurantId: initialData.restaurantId,
            branchId: initialData.branchId,
          }
        : defaultValues,
    );
  }, [initialData, open, reset]);

  const toggleOperation = (op: string) => {
    setSelectedOps((prev) =>
      prev.includes(op) ? prev.filter((item) => item !== op) : [...prev, op],
    );
  };

  const handleAddPermission = () => {
    if (!selectedAccess || selectedOps.length === 0) return;

    const nextPermission: StaffPermissionValues = {
      access: selectedAccess,
      operations: selectedOps,
    };

    setValue("permissions", [...permissions, nextPermission], {
      shouldValidate: true,
    });
    setSelectedAccess("");
    setSelectedOps([]);
  };

  const removePermission = (permissionToRemove: StaffPermissionValues) => {
    setValue(
      "permissions",
      permissions.filter(
        (permission) =>
          permission.access !== permissionToRemove.access ||
          permission.operations.join("|") !==
            permissionToRemove.operations.join("|"),
      ),
      { shouldValidate: true },
    );
  };

  const onSubmit = async (values: StaffRoleValues) => {
    try {
      const payload: StaffRoleValues = {
        ...values,
        ...(isBranchAdmin
          ? {}
          : {
              restaurantId: restaurantId || undefined,
              ...(branchId ? { branchId } : {}),
            }),
      };

      if (isEditMode && initialData?.id) {
        await updateRoleMutation.mutateAsync({
          id: initialData.id,
          data: payload,
        });
      } else {
        await createRoleMutation.mutateAsync(payload);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("messages.unableSaveRole")));
    }
  };

  const isAddDisabled = !selectedAccess || selectedOps.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] rounded-[20px] p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {isEditMode ? t("roleModal.editTitle") : t("roleModal.addTitle")}
          </DialogTitle>
        </DialogHeader>

        <form
          className="mt-4 space-y-5"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            <Label htmlFor="role-name" className="text-sm font-medium">
              {t("roleModal.roleName")}
            </Label>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <Input
                  id="role-name"
                  placeholder={t("roleModal.roleNamePlaceholder")}
                  value={field.value}
                  onChange={({ target: { value } }) => field.onChange(value)}
                  onBlur={field.onBlur}
                  className="mt-1 h-[44px] rounded-lg border border-gray-300"
                />
              )}
            />
            {errors.name?.message ? (
              <p className={FIELD_ERROR_CLASS}>
                {translateValidationError(errors.name.message)}
              </p>
            ) : null}
          </div>

          <div className="space-y-4 rounded-xl border p-4">
            <p className="text-sm font-medium">
              {t("roleModal.addPermission")}
            </p>

            <div className="flex gap-2">
              <select
                aria-label={t("roleModal.selectAccess")}
                value={selectedAccess}
                onChange={({ target: { value } }) => {
                  setSelectedAccess(value);
                  setSelectedOps([]);
                }}
                className="h-[42px] flex-1 rounded-lg border border-gray-300 px-3 text-sm"
              >
                <option value="">{t("roleModal.selectAccess")}</option>
                {ACCESS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {getAccessLabel(option)}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                onClick={handleAddPermission}
                disabled={isAddDisabled}
                className="bg-red-500 px-5 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {t("actions.add")}
              </Button>
            </div>

            {selectedAccess ? (
              <div className="flex flex-wrap gap-4">
                {OPERATIONS.map((operation) => {
                  const checkboxId = `role-operation-${operation}`;

                  return (
                    <label
                      key={operation}
                      htmlFor={checkboxId}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        id={checkboxId}
                        type="checkbox"
                        checked={selectedOps.includes(operation)}
                        onChange={() => toggleOperation(operation)}
                        className="accent-red-500"
                      />
                      {getOperationLabel(operation)}
                    </label>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">
              {t("roleModal.permissions")}
            </p>

            <div className="space-y-2">
              {permissions.map((permission) => {
                const permissionKey = `${permission.access}-${permission.operations.join("-")}`;

                return (
                  <div
                    key={permissionKey}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-medium">
                        {getAccessLabel(permission.access)}
                      </span>

                      <div className="flex flex-wrap gap-1">
                        {permission.operations.map((operation) => (
                          <span
                            key={`${permissionKey}-${operation}`}
                            className="rounded bg-gray-100 px-2 py-0.5 text-xs"
                          >
                            {getOperationLabel(operation)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removePermission(permission)}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
            {errors.permissions?.message ? (
              <p className={FIELD_ERROR_CLASS}>
                {translateValidationError(errors.permissions.message)}
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="role-description" className="text-sm font-medium">
              {t("roleModal.description")}
            </Label>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <Input
                  id="role-description"
                  placeholder={t("roleModal.descriptionPlaceholder")}
                  value={field.value ?? ""}
                  onChange={({ target: { value } }) => field.onChange(value)}
                  onBlur={field.onBlur}
                  className="mt-1 h-[44px] rounded-lg border border-gray-300"
                />
              )}
            />
            {errors.description?.message ? (
              <p className={FIELD_ERROR_CLASS}>
                {translateValidationError(errors.description.message)}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-[46px] w-full rounded-xl bg-red-500 text-white hover:bg-red-600"
          >
            {loading
              ? isEditMode
                ? t("actions.updating")
                : t("actions.saving")
              : isEditMode
                ? t("actions.updateRole")
                : t("actions.saveRole")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
