"use client";

import { ClipboardList, Eye, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import type { DataTableColumn } from "@/components/common/DataTable";
import DeleteDialog from "@/components/common/dialogs/delete-dialog";
import PaginationSection, { type PaginationMeta } from "@/components/common/PaginationSection";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";
import { RowActions } from "@/components/common/RowActions";
import { StatusBadge } from "@/components/common/status-badge";
import { Switch } from "@/components/ui/switch";
import { useDeleteDeliveryman, useUpdateDeliverymanStatus } from "@/hooks/useDeliverymen";
import AssignOrderModal from "./AssignOrderModal";
import DeliveryManDetails from "./DeliveryManDetails";

type DeliverymanStatus = "AVAILABLE" | "OFFLINE" | "BUSY" | "INACTIVE";

export type DeliverymanListItem = {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  status: DeliverymanStatus;
  _count?: { orders?: number };
};

interface Props {
  data?: DeliverymanListItem[];
  meta?: PaginationMeta | null;
  onPageChange?: (page: number) => void;
  refresh?: () => void;
  loading?: boolean;
  error?: string | null;
}

const getFullName = (deliveryman: DeliverymanListItem) =>
  `${deliveryman.firstName ?? ""} ${deliveryman.lastName ?? ""}`.trim() || "-";

export default function DeliveryManTable({ data = [], meta, onPageChange = () => undefined, refresh = () => undefined, loading = false, error }: Props) {
  const t = useTranslations("deliverymen");
  const commonT = useTranslations("common");
  const router = useRouter();
  const [detailDeliveryman, setDetailDeliveryman] = useState<DeliverymanListItem | null>(null);
  const [assignedDeliveryman, setAssignedDeliveryman] = useState<DeliverymanListItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const statusMutation = useUpdateDeliverymanStatus({ messages: { success: t("messages.statusUpdated"), error: t("messages.failedStatusUpdate") } });
  const deleteMutation = useDeleteDeliveryman({ messages: { success: t("messages.deleted"), error: t("messages.failedDelete") } });

  const toggleStatus = async (deliveryman: DeliverymanListItem) => {
    const status: DeliverymanStatus = deliveryman.status === "AVAILABLE" ? "OFFLINE" : "AVAILABLE";
    try {
      await statusMutation.mutateAsync({ id: deliveryman.id, status });
      refresh();
    } catch {
      // The mutation hook owns error feedback.
    }
  };

  const deleteDeliveryman = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
      refresh();
    } catch {
      // The mutation hook owns error feedback.
    }
  };

  const actionsFor = (deliveryman: DeliverymanListItem) => [
    { id: "view", label: commonT("viewDetails"), icon: <Eye className="size-4" />, onSelect: () => setDetailDeliveryman(deliveryman) },
    { id: "assign", label: t("actions.assignOrder"), icon: <ClipboardList className="size-4" />, onSelect: () => setAssignedDeliveryman(deliveryman) },
    { id: "edit", label: t("actions.edit"), icon: <Pencil className="size-4" />, onSelect: () => router.push(`/deliveryman/add?editId=${deliveryman.id}`) },
    { id: "delete", label: t("actions.delete"), icon: <Trash2 className="size-4" />, destructive: true, onSelect: () => setDeleteId(deliveryman.id) },
  ];

  const columns: readonly DataTableColumn<DeliverymanListItem>[] = [
    { id: "name", header: t("table.deliveryMan"), cell: (deliveryman) => <span className="font-semibold text-[var(--ui-text)]">{getFullName(deliveryman)}</span> },
    { id: "contact", header: t("table.deliveryManInfo"), cell: (deliveryman) => <div><p>{deliveryman.phone || "-"}</p><p className="text-xs text-[var(--ui-text-muted)]">{deliveryman.email || "-"}</p></div> },
    { id: "orders", header: t("orderInfo"), cell: (deliveryman) => t("table.totalOrders", { count: deliveryman._count?.orders ?? 0 }) },
    { id: "status", header: t("table.status"), cell: (deliveryman) => <div className="flex items-center gap-3"><StatusBadge tone={deliveryman.status === "AVAILABLE" ? "success" : deliveryman.status === "BUSY" ? "warning" : "neutral"}>{deliveryman.status}</StatusBadge><Switch checked={deliveryman.status === "AVAILABLE"} onCheckedChange={() => void toggleStatus(deliveryman)} disabled={statusMutation.isPending} /></div> },
    { id: "actions", header: t("table.actions"), align: "right", cell: (deliveryman) => <RowActions actions={actionsFor(deliveryman)} /> },
  ];

  return (
    <>
      <ResponsiveDataView
        data={data}
        columns={columns}
        rowKey={(deliveryman) => deliveryman.id}
        loading={loading}
        error={error}
        errorTitle={commonT("unableToLoad")}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
        renderMobileItem={(deliveryman) => (
          <article className="rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 shadow-[var(--ui-shadow-xs)]">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-[var(--ui-text)]">{getFullName(deliveryman)}</p><p className="mt-1 truncate text-sm text-[var(--ui-text-muted)]">{deliveryman.email || deliveryman.phone || "-"}</p></div><Switch checked={deliveryman.status === "AVAILABLE"} onCheckedChange={() => void toggleStatus(deliveryman)} disabled={statusMutation.isPending} /></div>
            <div className="mt-4 flex items-center justify-between gap-3"><StatusBadge tone={deliveryman.status === "AVAILABLE" ? "success" : deliveryman.status === "BUSY" ? "warning" : "neutral"}>{deliveryman.status}</StatusBadge><RowActions actions={actionsFor(deliveryman)} /></div>
          </article>
        )}
        footer={<PaginationSection meta={meta} onPageChange={onPageChange} />}
      />
      <DeliveryManDetails open={Boolean(detailDeliveryman)} onOpenChange={(open) => !open && setDetailDeliveryman(null)} data={detailDeliveryman} />
      <AssignOrderModal open={Boolean(assignedDeliveryman)} onOpenChange={(open) => !open && setAssignedDeliveryman(null)} deliveryman={assignedDeliveryman} onSuccess={() => { refresh(); setAssignedDeliveryman(null); }} />
      <DeleteDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)} onConfirm={() => void deleteDeliveryman()} isLoading={deleteMutation.isPending} />
    </>
  );
}
