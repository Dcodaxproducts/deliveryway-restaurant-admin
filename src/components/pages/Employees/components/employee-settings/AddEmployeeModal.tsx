"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm, type Control } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { useFileUpload } from "@/hooks/useFileUpload";
import { FIELD_ERROR_CLASS, MUTED_TEXT_SM_CLASS } from "@/components/common/common-classes";
import { getApiErrorMessage } from "@/lib/errors";
import {
  staffModalSchema,
  type StaffModalValues,
  type StaffValues,
} from "@/validations/employees";

type StaffRoleOption = {
  id: string;
  name: string;
};

type EmployeeInitialData = Partial<StaffModalValues> & {
  id?: string;
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

export default function EmployeeInvitationModal({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: EmployeeInvitationModalProps) {
  const { uploadFile, uploading } = useFileUpload();
  const { restaurantId, branchId, isBranchAdmin } = useAuth();
  const isEdit = Boolean(initialData?.id);

  const createStaffMutation = useCreateStaff();
  const updateStaffMutation = useUpdateStaff();

  const { data: rolesData } = useGetStaffRoles(
    isBranchAdmin
      ? { page: 1 }
      : {
          page: 1,
          restaurantId: restaurantId || undefined,
          ...(branchId ? { branchId } : {}),
        }
  );
  const roles = ((rolesData?.data ?? []) as StaffRoleOption[]).filter(
    (role): role is StaffRoleOption => Boolean(role?.id && role?.name)
  );

  const loading = createStaffMutation.isPending || updateStaffMutation.isPending;

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
      return;
    }

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
          }
        : defaultValues
    );
  }, [initialData, open, reset]);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const result = await uploadFile(event);
    if (result?.fileUrl) setValue("avatarUrl", result.fileUrl);
  };

  const onSubmit = async (values: StaffModalValues) => {
    try {
      const payload: StaffValues = {
        email: values.email,
        password: values.password ?? "",
        firstName: values.firstName,
        lastName: values.lastName,
        staffRoleId: values.staffRoleId,
        phone: values.phone,
        bio: values.bio,
        isActive: values.isActive,
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
      toast.error(getApiErrorMessage(error, "Unable to save employee"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[100vh] max-w-[460px] overflow-auto rounded-[20px] p-6">
        <DialogHeader className="space-y-1 text-center">
          <DialogTitle className="text-xl font-semibold">
            {isEdit ? "Edit Employee" : "Employee Invitation"}
          </DialogTitle>
          <DialogDescription className={`text-left ${MUTED_TEXT_SM_CLASS}`}>
            {isEdit ? "Update employee details" : "Send invitation to employee"}
          </DialogDescription>
        </DialogHeader>

        <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
          <EmployeeField
            control={control}
            name="email"
            id="employee-email"
            label="Email *"
            error={errors.email?.message}
          />

          <div className="grid grid-cols-2 gap-3">
            <EmployeeField
              control={control}
              name="firstName"
              id="employee-first-name"
              label="First Name *"
              error={errors.firstName?.message}
            />
            <EmployeeField
              control={control}
              name="lastName"
              id="employee-last-name"
              label="Last Name *"
              error={errors.lastName?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <EmployeeField
              control={control}
              name="phone"
              id="employee-phone"
              label="Phone"
              error={errors.phone?.message}
            />
            <EmployeeField
              control={control}
              name="password"
              id="employee-password"
              label="Password *"
              type="password"
              error={errors.password?.message}
            />
          </div>

          <div>
            <Label htmlFor="employee-role" className="text-sm font-medium">
              Role *
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
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.staffRoleId?.message ? (
              <p className={FIELD_ERROR_CLASS}>{errors.staffRoleId.message}</p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="employee-avatar" className="text-sm font-medium">
              Avatar
            </Label>
            <Input
              id="employee-avatar"
              type="file"
              onChange={handleFile}
              className="mt-1 h-[40px] rounded-lg border border-gray-300 pt-1"
            />
            {uploading ? <p className="mt-1 text-xs text-gray-400">Uploading...</p> : null}
          </div>

          <EmployeeField
            control={control}
            name="bio"
            id="employee-bio"
            label="Bio"
            error={errors.bio?.message}
          />

          <Button
            type="submit"
            disabled={loading}
            className="mt-6 h-[46px] w-full rounded-xl bg-primary text-white hover:bg-red-600"
          >
            {loading ? (isEdit ? "Updating..." : "Sending...") : isEdit ? "Update Employee" : "Send Invitation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type EmployeeFieldProps = {
  control: Control<StaffModalValues>;
  name: keyof Pick<StaffModalValues, "email" | "password" | "firstName" | "lastName" | "phone" | "bio">;
  id: string;
  label: string;
  type?: string;
  error?: string;
};

function EmployeeField({ control, name, id, label, type = "text", error }: EmployeeFieldProps) {
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
