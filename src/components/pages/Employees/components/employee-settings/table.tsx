"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import type { DataTableColumn } from "@/components/common/DataTable";
import DeleteDialog from "@/components/common/dialogs/delete-dialog";
import Pagination from "@/components/common/PaginationSection";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";
import { RowActions } from "@/components/common/RowActions";
import { StatusBadge } from "@/components/common/status-badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteStaff, useGetStaffList, useUpdateStaffStatus } from "@/hooks/useEmployees";
import EmployeeInvitationModal from "./AddEmployeeModal";

type EmployeeListItem = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  staffRole?: { id?: string; name?: string } | null;
};

interface EmployeeTableProps {
  refreshFlag?: boolean | number | string;
  search?: string;
  onSuccess?: () => void;
  restaurantId?: string;
  branchId?: string;
}

const fullName = (employee: EmployeeListItem) =>
  `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || "-";

export default function EmployeeTable({ refreshFlag, search = "", onSuccess, restaurantId: scopedRestaurantId, branchId: scopedBranchId }: EmployeeTableProps) {
  const t = useTranslations("employees");
  const { restaurantId: authRestaurantId, branchId: authBranchId, isBranchAdmin } = useAuth();
  const restaurantId = scopedRestaurantId ?? authRestaurantId ?? undefined;
  const branchId = scopedBranchId ?? (isBranchAdmin ? authBranchId : undefined);
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EmployeeListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryParams = useMemo(() => isBranchAdmin
    ? { page, search: search || undefined }
    : { page, search: search || undefined, restaurantId, ...(branchId ? { branchId } : {}) },
  [branchId, isBranchAdmin, page, restaurantId, search]);
  const { data, isLoading, isFetching, refetch } = useGetStaffList(isBranchAdmin || restaurantId ? queryParams : undefined);
  const { mutate: deleteStaff } = useDeleteStaff({ messages: { success: t("messages.staffDeleted"), error: t("messages.failedDeleteStaff") } });
  const { mutate: updateStatus } = useUpdateStaffStatus({ messages: { success: t("messages.staffStatusUpdated"), error: t("messages.failedUpdateStatus") } });
  const employees = (data?.data || []) as EmployeeListItem[];
  const meta = data?.meta;

  useEffect(() => setPage(1), [search]);
  useEffect(() => {
    if (refreshFlag === undefined) return;
    if (page === 1) void refetch();
    else setPage(1);
  }, [page, refreshFlag, refetch]);

  const handleDelete = () => {
    if (!deleteId) return;
    setIsDeleting(true);
    deleteStaff(deleteId, { onSuccess: () => { setDeleteId(null); void refetch(); onSuccess?.(); }, onSettled: () => setIsDeleting(false) });
  };
  const handleStatusChange = (employee: EmployeeListItem, isActive: boolean) => {
    updateStatus({ id: employee.id, isActive }, { onSuccess: () => { void refetch(); onSuccess?.(); } });
  };
  const actionsFor = (employee: EmployeeListItem) => [
    { id: "edit", label: t("actions.edit"), icon: <Pencil className="size-4" />, onSelect: () => setEditData(employee) },
    { id: "delete", label: t("actions.delete"), icon: <Trash2 className="size-4" />, destructive: true, onSelect: () => setDeleteId(employee.id) },
  ];
  const columns: readonly DataTableColumn<EmployeeListItem>[] = [
    { id: "employee", header: t("table.employee"), cell: (employee) => <span className="font-semibold text-[var(--ui-text)]">{fullName(employee)}</span> },
    { id: "details", header: t("table.details"), cell: (employee) => <div><p>{employee.phone || "-"}</p><p className="text-xs text-[var(--ui-text-muted)]">{employee.email || "-"}</p></div> },
    { id: "role", header: t("table.role"), cell: (employee) => employee.staffRole?.name || "-" },
    { id: "status", header: t("table.status"), cell: (employee) => <div className="flex items-center gap-3"><StatusBadge tone={employee.isActive ? "success" : "neutral"}>{employee.isActive ? t("active") : t("inactive")}</StatusBadge><Switch checked={Boolean(employee.isActive)} onCheckedChange={(value) => handleStatusChange(employee, value)} /></div> },
    { id: "actions", header: t("table.actions"), align: "right", cell: (employee) => <RowActions actions={actionsFor(employee)} /> },
  ];

  return (
    <>
      <ResponsiveDataView data={employees} columns={columns} rowKey={(employee) => employee.id} loading={isLoading || isFetching} emptyTitle={t("noEmployeesFound")} renderMobileItem={(employee) => (
        <article className="rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 shadow-[var(--ui-shadow-xs)]">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-[var(--ui-text)]">{fullName(employee)}</p><p className="mt-1 truncate text-sm text-[var(--ui-text-muted)]">{employee.email || "-"}</p></div><Switch checked={Boolean(employee.isActive)} onCheckedChange={(value) => handleStatusChange(employee, value)} /></div>
          <div className="mt-4 flex items-center justify-between gap-3"><StatusBadge tone={employee.isActive ? "success" : "neutral"}>{employee.staffRole?.name || "-"}</StatusBadge><RowActions actions={actionsFor(employee)} /></div>
        </article>
      )} footer={meta ? <Pagination {...meta} onPageChange={setPage} /> : null} />
      <DeleteDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)} onConfirm={handleDelete} isLoading={isDeleting} />
      <EmployeeInvitationModal open={Boolean(editData)} onOpenChange={(open) => { if (!open) { setEditData(null); void refetch(); onSuccess?.(); } }} initialData={editData} />
    </>
  );
}
