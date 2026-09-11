"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import {
  useDeleteStaffRole,
  useGetStaffRoles,
  useUpdateStaffRole,
} from "@/hooks/useEmployees";

import type { DataTableColumn } from "@/components/common/DataTable";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { AddRoleModal } from "./AddRoleModal";
import { useTranslations } from "next-intl";

type RolePermission = {
  id?: string;
  access: string;
  operations: string[];
};

type StaffRoleRow = {
  id: string;
  name: string;
  description?: string;
  permissions?: RolePermission[];
  isActive: boolean;
};

const ACCESS_OPTIONS = ["Zone", "Orders", "Employees", "Menu", "Reports"];
const OPERATIONS = ["Create", "Read", "Update", "Delete"];

const RolesTable = ({
  refreshFlag,
  onSuccess,
  restaurantId,
  branchId,
}: {
  refreshFlag?: boolean;
  onSuccess?: () => void;
  restaurantId?: string;
  branchId?: string;
}) => {
  const t = useTranslations("employees");
  const { user } = useAuthContext();
  const isBranchAdmin = user?.role === "BRANCH_ADMIN";
  const updateRoleMutation = useUpdateStaffRole({
    messages: {
      success: t("messages.roleUpdated"),
      error: t("messages.failedUpdateRole"),
    },
  });
  const deleteRoleMutation = useDeleteStaffRole({
    messages: {
      success: t("messages.roleDeleted"),
      error: t("messages.failedDeleteRole"),
    },
  });

  const [editRole, setEditRole] = useState<StaffRoleRow | null>(null);
  const [open, setOpen] = useState(false);

  /* ---------- Fetch Roles ---------- */
  const {
    data: rolesResponse,
    isLoading: loading,
    error,
    refetch,
  } = useGetStaffRoles(
    isBranchAdmin
      ? undefined
      : {
          ...(restaurantId ? { restaurantId } : {}),
          ...(branchId ? { branchId } : {}),
        },
  );
  const roles = (rolesResponse?.data || []) as StaffRoleRow[];
  const getAccessLabel = (access: string) =>
    ACCESS_OPTIONS.includes(access) ? t(`access.${access}`) : access;

  const getOperationLabel = (operation: string) =>
    OPERATIONS.includes(operation) ? t(`operations.${operation}`) : operation;

  useEffect(() => {
    refetch();
  }, [branchId, isBranchAdmin, refetch, refreshFlag, restaurantId]);

  /* ---------- Toggle Active ---------- */
  const toggleStatus = async (role: StaffRoleRow) => {
    try {
      await updateRoleMutation.mutateAsync({
        id: role.id,
        data: { isActive: !role.isActive },
      });

      toast.success(t("messages.statusUpdated"));
      refetch();
    } catch {
      toast.error(t("messages.failedUpdateStatus"));
    }
  };

  /* ---------- Delete ---------- */
  const handleDelete = async (id: string) => {
    try {
      await deleteRoleMutation.mutateAsync(id);
      toast.success(t("messages.roleDeletedShort"));
      refetch();
    } catch {
      toast.error(t("messages.deleteFailed"));
    }
  };

  const columns: readonly DataTableColumn<StaffRoleRow>[] = [
    {
      id: "serial",
      header: t("table.serial"),
      cell: (role) => roles.indexOf(role) + 1,
    },
    {
      id: "role",
      header: t("table.role"),
      className: "font-medium",
      cell: (role) => role.name,
    },
    {
      id: "description",
      header: t("table.description"),
      className: "max-w-64 whitespace-normal break-words",
      cell: (role) => role.description,
    },
    {
      id: "permissions",
      header: t("table.permissions"),
      className: "max-w-80 whitespace-normal",
      cell: (role) => (
        <div className="flex flex-wrap gap-1">
          {role.permissions?.map((permission) => (
            <span
              key={
                permission.id ??
                `${role.id}-${permission.access}-${permission.operations.join("-")}`
              }
              className="text-xs bg-gray-100 px-2 py-1 rounded"
            >
              {getAccessLabel(permission.access)} (
              {permission.operations.map(getOperationLabel).join(", ")})
            </span>
          ))}
        </div>
      ),
    },
    {
      id: "status",
      header: t("table.status"),
      cell: (role) => (
        <Switch
          aria-label={`${t("table.status")}: ${role.name}`}
          checked={role.isActive}
          onCheckedChange={() => toggleStatus(role)}
        />
      ),
    },
    {
      id: "actions",
      header: t("table.actions"),
      align: "center",
      cell: (role) => (
        <div className="flex justify-center gap-2 text-gray">
          {/* EDIT */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEditRole(role);
              setOpen(true);
            }}
          >
            <Pencil size={16} />
            {t("actions.edit")}
          </Button>

          {/* DELETE */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-red-500"
            onClick={() => handleDelete(role.id)}
          >
            <Trash2 size={16} />
            {t("actions.delete")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <ResponsiveDataView
        data={roles}
        columns={columns}
        rowKey={(role) => role.id}
        loading={loading}
        error={error ? error.message || "Unable to load data" : undefined}
        emptyTitle={t("noRolesTitle")}
        emptyDescription={t("noRolesDescription")}
        renderMobileItem={(role) => (
          <div key={role.id} className="rounded-xl border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-dark">{role.name}</p>
                {role.description ? (
                  <p className="mt-1 text-sm text-gray-500">
                    {role.description}
                  </p>
                ) : null}
              </div>
              <Switch
                aria-label={`${t("table.status")}: ${role.name}`}
                checked={role.isActive}
                onCheckedChange={() => toggleStatus(role)}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {role.permissions?.map((permission) => (
                <span
                  key={
                    permission.id ??
                    `${role.id}-${permission.access}-${permission.operations.join("-")}`
                  }
                  className="rounded bg-gray-100 px-2 py-1 text-xs"
                >
                  {getAccessLabel(permission.access)} (
                  {permission.operations.map(getOperationLabel).join(", ")})
                </span>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditRole(role);
                  setOpen(true);
                }}
              >
                <Pencil size={16} />
                {t("actions.edit")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-red-500"
                onClick={() => handleDelete(role.id)}
              >
                <Trash2 size={16} />
                {t("actions.delete")}
              </Button>
            </div>
          </div>
        )}
      />

      {!loading && roles.length > 0 ? (
        <AddRoleModal
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen) {
              setEditRole(null);
            }
          }}
          initialData={editRole}
          onSuccess={onSuccess}
          restaurantId={restaurantId}
          branchId={branchId}
        />
      ) : null}
    </>
  );
};

export default RolesTable;
