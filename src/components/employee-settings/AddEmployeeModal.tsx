"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/hooks/useAuth";

import {
  useCreateStaff,
  useUpdateStaff,
  useGetStaffRoles,
} from "@/hooks/useEmployees";

import { staffSchema } from "@/validations/employees";
import { validateSchema } from "@/lib/zod-errors";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  onSuccess?: () => void;
};

export default function EmployeeInvitationModal({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: Props) {
  const { uploadFile, uploading } = useFileUpload();
  const { restaurantId, branchId, isBranchAdmin } = useAuth();

  const isEdit = !!initialData;

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
  const roles = rolesData?.data || [];

  const loading =
    createStaffMutation.isPending || updateStaffMutation.isPending;

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    staffRoleId: "",
    phone: "",
    avatarUrl: "",
    bio: "",
    isActive: true,
  });

  /* ---------- Prefill (EDIT) ---------- */
  useEffect(() => {
    if (initialData && open) {
      setForm({
        email: initialData.email || "",
        password: "",
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        staffRoleId: initialData.staffRoleId || "",
        phone: initialData.phone || "",
        avatarUrl: initialData.avatarUrl || "",
        bio: initialData.bio || "",
        isActive: initialData.isActive ?? true,
      });
    }
  }, [initialData, open]);

  /* ---------- Reset ---------- */
  useEffect(() => {
    if (!open) {
      setForm({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        staffRoleId: "",
        phone: "",
        avatarUrl: "",
        bio: "",
        isActive: true,
      });
    }
  }, [open]);

  /* ---------- Change ---------- */
  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /* ---------- Upload ---------- */
  const handleFile = async (e: any) => {
    const url = await uploadFile(e);
    if (url) handleChange("avatarUrl", url);
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async () => {
    try {
      //  Prepare payload
      const payload = {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        staffRoleId: form.staffRoleId,
        phone: form.phone,
        bio: form.bio,
        isActive: form.isActive,
        ...(isBranchAdmin
          ? {}
          : {
              restaurantId: restaurantId || undefined,
              ...(branchId ? { branchId } : {}),
            }),
      };

      const parsed = validateSchema(staffSchema, payload);

      if (!parsed.success) {
        const firstError = Object.values(parsed.errors)[0] || "Invalid input";
        return toast.error(firstError);
      }

      if (isEdit) {
        // const { password, ...updatePayload } = payload;

        await updateStaffMutation.mutateAsync({
          id: initialData.id,
          data: payload,
        });
      } else {
        await createStaffMutation.mutateAsync(payload);
      }

      // toast.success(isEdit ? "Employee updated" : "Invitation sent");

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save employee");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[460px] rounded-[20px] p-6 max-h-[100vh] overflow-auto">

        {/* Header */}
        <DialogHeader className="text-center space-y-1">
          <DialogTitle className="text-xl font-semibold">
            {isEdit ? "Edit Employee" : "Employee Invitation"}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 text-left">
            {isEdit
              ? "Update employee details"
              : "Send invitation to employee"}
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <div className="mt-6 space-y-4">

          <FormField
            label="Email *"
            value={form.email}
            onChange={(v) => handleChange("email", v)}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="First Name *"
              value={form.firstName}
              onChange={(v) => handleChange("firstName", v)}
            />
            <FormField
              label="Last Name *"
              value={form.lastName}
              onChange={(v) => handleChange("lastName", v)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Phone"
              value={form.phone}
              onChange={(v) => handleChange("phone", v)}
            />

            {/* {!isEdit && ( */}
              <FormField
                label="Password *"
                value={form.password}
                onChange={(v) => handleChange("password", v)}
              />
            {/* )} */}
          </div>

          {/* Role Dropdown */}
          <div>
            <label className="text-sm font-medium">Role *</label>
            <select
              value={form.staffRoleId}
              onChange={(e) =>
                handleChange("staffRoleId", e.target.value)
              }
              className="mt-1 h-[44px] w-full rounded-lg border border-gray-300 px-3 text-sm"
            >
              <option value="">Select Role</option>
              {roles.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Avatar Upload */}
          <div>
            <label className="text-sm font-medium">Avatar</label>
            <Input
              type="file"
              onChange={handleFile}
              className="mt-1 h-[40px] pt-1 rounded-lg border border-gray-300"
            />
            {uploading && (
              <p className="text-xs text-gray-400 mt-1">
                Uploading...
              </p>
            )}
          </div>

          <FormField
            label="Bio"
            value={form.bio}
            onChange={(v) => handleChange("bio", v)}
          />
        </div>

        {/* CTA */}
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full h-[46px] rounded-xl bg-primary text-white hover:bg-red-600"
        >
          {loading
            ? isEdit
              ? "Updating..."
              : "Sending..."
            : isEdit
            ? "Update Employee"
            : "Send Invitation"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Reusable Field ---------- */
function FormField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[44px] rounded-lg border border-gray-300"
      />
    </div>
  );
}
