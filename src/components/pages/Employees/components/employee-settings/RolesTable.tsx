"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import { useDeleteStaffRole, useGetStaffRoles, useUpdateStaffRole } from "@/hooks/useEmployees";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Switch } from "@/components/ui/switch";
import { Eye, MoreHorizontal, Trash2, Pencil } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import Pagination from "@/components/common/PaginationSection";
import { toast } from "sonner";
import { AddRoleModal } from "./AddRoleModal";

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
  const { user } = useAuthContext();
  const isBranchAdmin = user?.role === "BRANCH_ADMIN";
  const updateRoleMutation = useUpdateStaffRole();
  const deleteRoleMutation = useDeleteStaffRole();

  const [editRole, setEditRole] = useState<StaffRoleRow | null>(null);
const [open, setOpen] = useState(false);

  /* ---------- Fetch Roles ---------- */
  const { data: rolesResponse, isLoading: loading, refetch } = useGetStaffRoles(
    isBranchAdmin
      ? undefined
      : {
          ...(restaurantId ? { restaurantId } : {}),
          ...(branchId ? { branchId } : {}),
        }
  );
  const roles = (rolesResponse?.data || []) as StaffRoleRow[];
  const fetchRoles = () => refetch();

useEffect(() => {
  fetchRoles();
}, [refreshFlag, restaurantId, branchId, isBranchAdmin]);

  /* ---------- Toggle Active ---------- */
  const toggleStatus = async (role: StaffRoleRow) => {
    try {
      await updateRoleMutation.mutateAsync({
        id: role.id,
        data: { isActive: !role.isActive },
      });

      toast.success("Status updated");
      fetchRoles();
    } catch {
      toast.error("Failed to update status");
    }
  };

  /* ---------- Delete ---------- */
  const handleDelete = async (id: string) => {
    try {
      await deleteRoleMutation.mutateAsync(id);
      toast.success("Role deleted");
      fetchRoles();
    } catch {
      toast.error("Delete failed");
    }
  };
if (loading) {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow className="border-none">
            <TableHead>SL</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i} className="border-none h-[70px]">
              {[...Array(7)].map((_, j) => (
                <TableCell key={j}>
                  <div className="h-7 w-full bg-gray-200 rounded animate-pulse" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
  if (!loading && (!roles || roles.length === 0)) {
  return (
    <EmptyState
      title="No roles found"
      description="Create roles to manage permissions"
    />
  );
}

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-none">
              <TableHead>SL</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              {/* <TableHead>Branch</TableHead> */}
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {roles.map((role, i) => (
              <TableRow key={role.id} className="border-none h-[70px]">
                <TableCell>{i + 1}</TableCell>

                <TableCell className="font-medium">
                  {role.name}
                </TableCell>

                <TableCell>{role.description}</TableCell>

                {/* Permissions */}
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions?.map((permission) => (
                      <span
                        key={permission.id ?? `${role.id}-${permission.access}-${permission.operations.join("-")}`}
                        className="text-xs bg-gray-100 px-2 py-1 rounded"
                      >
                        {permission.access} ({permission.operations.join(", ")})
                      </span>
                    ))}
                  </div>
                </TableCell>

                {/* <TableCell>{role.branch?.name}</TableCell> */}

                {/* Status */}
                <TableCell>
                  <Switch
                    checked={role.isActive}
                    onCheckedChange={() => toggleStatus(role)}
                  />
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex justify-center gap-2 text-gray">
                   

                    {/* EDIT */}
                    <button
                      className="p-2"
                     onClick={() => {
  setEditRole(role);
  setOpen(true);
}}
                    >
                      <Pencil size={18} />
                    </button>

                    {/* DELETE */}
                    <button
                      className="p-2 text-red-500"
                      onClick={() => handleDelete(role.id)}
                    >
                      <Trash2 size={18} />
                    </button>

                 
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
<AddRoleModal
  open={open}
  onOpenChange={setOpen}
  initialData={editRole}
  onSuccess={onSuccess}
  restaurantId={restaurantId}
  branchId={branchId}
/>
      </div>
    </>
  );
};

export default RolesTable;