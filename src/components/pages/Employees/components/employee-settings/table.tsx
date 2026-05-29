"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  useGetStaffList,
  useDeleteStaff,
  useUpdateStaffStatus,
} from "@/hooks/useEmployees";
import Pagination from "@/components/common/PaginationSection";
import DeleteDialog from "@/components/common/dialogs/delete-dialog";
import EmployeeInvitationModal from "./AddEmployeeModal";
import { useAuth } from "@/hooks/useAuth";

interface EmployeeTableProps {
  refreshFlag?: boolean | number | string;
  search?: string;
  onSuccess?: () => void;
  restaurantId?: string;
  branchId?: string;
}

export default function EmployeeTable({
  refreshFlag,
  search = "",
  onSuccess,
  restaurantId: scopedRestaurantId,
  branchId: scopedBranchId,
}: EmployeeTableProps) {
  const { restaurantId: authRestaurantId, branchId: authBranchId, isBranchAdmin } = useAuth();
  const restaurantId = scopedRestaurantId ?? authRestaurantId ?? undefined;
  const branchId = scopedBranchId ?? (isBranchAdmin ? authBranchId : undefined);

  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryParams = useMemo(() => {
    if (isBranchAdmin) {
      return {
        page,
        search: search || undefined,
      };
    }

    return {
      page,
      search: search || undefined,
      restaurantId: restaurantId || undefined,
      ...(branchId ? { branchId } : {}),
    };
  }, [page, search, restaurantId, branchId, isBranchAdmin]);

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useGetStaffList(isBranchAdmin || restaurantId ? queryParams : undefined);

  const { mutate: deleteStaff } = useDeleteStaff();
  const { mutate: updateStatus } = useUpdateStaffStatus();

  const employees = data?.data || [];
  const meta = data?.meta;

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (refreshFlag !== undefined) {
      refetch();
    }
  }, [refreshFlag, refetch]);

  const handleDelete = () => {
    if (!deleteId) return;

    setIsDeleting(true);

    deleteStaff(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        refetch();
        onSuccess?.();
      },
      onSettled: () => setIsDeleting(false),
    });
  };

  const handleStatusChange = (id: string, isActive: boolean) => {
    updateStatus(
      { id, isActive },
      {
        onSuccess: () => {
          refetch();
          onSuccess?.();
        },
      }
    );
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SL</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading || isFetching ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={6}>
                  <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
                </TableCell>
              </TableRow>
            ))
          ) : employees.length > 0 ? (
            employees.map((item: any, i: number) => (
              <TableRow key={item.id}>
                <TableCell>{(meta?.page - 1) * (meta?.limit || 10) + i + 1 || i + 1}</TableCell>

                <TableCell>
                  {`${item.firstName || ""} ${item.lastName || ""}`.trim() || "-"}
                </TableCell>

                <TableCell>
                  <p>{item.phone || "-"}</p>
                  <p className="text-gray-600">{item.email || "-"}</p>
                </TableCell>

                <TableCell>{item.staffRole?.name || "-"}</TableCell>

                <TableCell>
                  <Switch
                    checked={!!item.isActive}
                    onCheckedChange={(val) => handleStatusChange(item.id, val)}
                  />
                </TableCell>

                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setEditData(item)}
                      className="rounded-md p-1.5 transition hover:bg-gray-100"
                    >
                      <Pencil size={16} className="text-gray-600" />
                    </button>

                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="rounded-md p-1.5 transition hover:bg-red-50"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-gray-500">
                No employees found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {meta && <Pagination {...meta} onPageChange={setPage} />}

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      <EmployeeInvitationModal
        open={!!editData}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setEditData(null);
            refetch();
            onSuccess?.();
          }
        }}
        initialData={editData}
      />
    </>
  );
}