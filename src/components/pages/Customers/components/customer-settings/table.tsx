"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import type { DataTableColumn } from "@/components/common/DataTable";
import PaginationSection, { type PaginationMeta } from "@/components/common/PaginationSection";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";
import { RowActions } from "@/components/common/RowActions";
import { StatusBadge } from "@/components/common/status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useDeleteCustomer, useUpdateCustomerStatus } from "@/hooks/useCustomers";
import AddCustomerModal from "./AddCustomerModal";
import CustomerDetailModal from "./CustomerDetailModal";

export interface CustomerListItem {
  id: string;
  email?: string;
  isGuest?: boolean;
  isActive?: boolean;
  createdAt?: string;
  profile?: { firstName?: string; lastName?: string; phone?: string };
  _count?: { customerOrders?: number };
}

interface Props {
  customers?: CustomerListItem[];
  loading?: boolean;
  error?: string | null;
  meta?: PaginationMeta | null;
  onPageChange?: (page: number) => void;
  onRefresh?: () => void;
}

const getFullName = (customer: CustomerListItem) =>
  `${customer.profile?.firstName || ""} ${customer.profile?.lastName || ""}`.trim() || "-";

export default function CustomerTable({
  customers = [],
  loading = false,
  error,
  meta,
  onPageChange = () => undefined,
  onRefresh = () => undefined,
}: Props) {
  const t = useTranslations("customers");
  const commonT = useTranslations("common");
  const [openDetails, setOpenDetails] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerListItem | null>(null);
  const [localCustomers, setLocalCustomers] = useState<CustomerListItem[]>(customers);

  useEffect(() => setLocalCustomers(customers), [customers]);

  const deleteCustomerMutation = useDeleteCustomer({
    messages: { success: t("messages.deleted"), error: t("messages.failedDelete") },
  });
  const updateCustomerStatusMutation = useUpdateCustomerStatus({
    messages: { success: t("messages.statusUpdated"), error: t("messages.failedStatusUpdate") },
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomerMutation.mutateAsync(id);
      setLocalCustomers((current) => current.filter((customer) => customer.id !== id));
      onRefresh();
    } catch {
      // The mutation hook owns error feedback.
    }
  };

  const handleToggleStatus = async (customer: CustomerListItem) => {
    const currentStatus = Boolean(customer.isActive);
    setLocalCustomers((current) =>
      current.map((item) => item.id === customer.id ? { ...item, isActive: !currentStatus } : item),
    );
    try {
      await updateCustomerStatusMutation.mutateAsync({ id: customer.id, isActive: !currentStatus });
      onRefresh();
    } catch {
      setLocalCustomers((current) =>
        current.map((item) => item.id === customer.id ? { ...item, isActive: currentStatus } : item),
      );
    }
  };

  const openCustomer = (customer: CustomerListItem) => {
    setSelectedCustomer(customer);
    setOpenDetails(true);
  };
  const editCustomer = (customer: CustomerListItem) => {
    setSelectedCustomer(customer);
    setOpenEdit(true);
  };

  const columns: readonly DataTableColumn<CustomerListItem>[] = [
    { id: "select", header: <Checkbox aria-label={t("table.selectAll")} />, cell: (customer) => <Checkbox aria-label={t("table.selectCustomer", { name: getFullName(customer) })} /> },
    { id: "name", header: t("table.customerName"), cell: (customer) => <span className="font-semibold text-[var(--ui-text)]">{getFullName(customer)}</span> },
    { id: "type", header: t("table.customerType"), cell: (customer) => <StatusBadge tone={customer.isGuest ? "warning" : "success"}>{t(customer.isGuest ? "table.guest" : "table.registered")}</StatusBadge> },
    { id: "info", header: t("table.customerInfo"), cell: (customer) => <div><p>{customer.profile?.phone || "-"}</p><p className="max-w-48 truncate text-xs">{customer.email || "-"}</p></div> },
    { id: "orders", header: t("table.totalOrder"), align: "center", cell: (customer) => <span className="tabular-nums">{customer._count?.customerOrders || 0}</span> },
    { id: "joined", header: t("table.joiningDate"), cell: (customer) => customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "-" },
    { id: "status", header: t("table.blockToggle"), align: "center", cell: (customer) => <Switch checked={Boolean(customer.isActive)} onCheckedChange={() => void handleToggleStatus(customer)} /> },
    { id: "actions", header: commonT("actions"), align: "right", cell: (customer) => <RowActions actions={[
      { id: "view", label: commonT("viewDetails"), icon: <Eye className="size-4" />, onSelect: () => openCustomer(customer) },
      { id: "edit", label: commonT("edit"), icon: <Pencil className="size-4" />, onSelect: () => editCustomer(customer) },
      { id: "delete", label: commonT("delete"), icon: <Trash2 className="size-4" />, destructive: true, onSelect: () => void handleDelete(customer.id) },
    ]} /> },
  ];

  return (
    <>
      <ResponsiveDataView
        data={localCustomers}
        columns={columns}
        rowKey={(customer) => customer.id}
        loading={loading}
        error={error}
        errorTitle={commonT("unableToLoad")}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
        renderMobileItem={(customer) => (
          <article className="rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 shadow-[var(--ui-shadow-xs)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="truncate font-semibold text-[var(--ui-text)]">{getFullName(customer)}</p><p className="mt-1 truncate text-sm text-[var(--ui-text-muted)]">{customer.email || "-"}</p></div>
              <Switch checked={Boolean(customer.isActive)} onCheckedChange={() => void handleToggleStatus(customer)} />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3"><StatusBadge tone={customer.isGuest ? "warning" : "success"}>{t(customer.isGuest ? "table.guest" : "table.registered")}</StatusBadge><RowActions actions={[
              { id: "view", label: commonT("viewDetails"), icon: <Eye className="size-4" />, onSelect: () => openCustomer(customer) },
              { id: "edit", label: commonT("edit"), icon: <Pencil className="size-4" />, onSelect: () => editCustomer(customer) },
              { id: "delete", label: commonT("delete"), icon: <Trash2 className="size-4" />, destructive: true, onSelect: () => void handleDelete(customer.id) },
            ]} /></div>
          </article>
        )}
        footer={<PaginationSection meta={meta} onPageChange={onPageChange} />}
      />
      <CustomerDetailModal open={openDetails} onOpenChange={setOpenDetails} customer={selectedCustomer} />
      <AddCustomerModal open={openEdit} onOpenChange={setOpenEdit} initialData={selectedCustomer} onSuccess={onRefresh} />
    </>
  );
}
