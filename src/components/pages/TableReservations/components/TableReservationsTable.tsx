"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import type { DataTableColumn } from "@/components/common/DataTable";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";
import { RowActions } from "@/components/common/RowActions";
import { TableReservationStatusUpdateDialog } from "@/components/pages/TableReservations/components/TableReservationStatusUpdateDialog";
import { formatDateTime, formatReservationDate, formatShortId, getBranchName } from "@/components/pages/TableReservations/utils/table-reservations-formatters";
import type { TableReservation } from "@/types/table-reservations";
import TableReservationCustomerCell from "./TableReservationCustomerCell";
import TableReservationStatusBadge from "./TableReservationStatusBadge";

type TableReservationsTableProps = {
  reservations: TableReservation[];
  loading: boolean;
  error?: Error | null;
  restaurantId?: string;
  branchId?: string;
};

export function TableReservationsTable({ reservations, loading, error, restaurantId, branchId }: TableReservationsTableProps) {
  const common = useTranslations("common");
  const t = useTranslations("tableReservations");
  const [statusReservation, setStatusReservation] = useState<TableReservation | null>(null);
  const columns: readonly DataTableColumn<TableReservation>[] = [
    { id: "reservation", header: t("reservation"), cell: (reservation) => <div><p className="font-semibold text-[var(--ui-text)]">{formatShortId(reservation.id)}</p><p className="mt-1 text-xs text-[var(--ui-text-muted)]">{t("created")}: {formatDateTime(reservation.createdAt)}</p>{reservation.cancelledAt ? <p className="mt-1 text-xs text-[var(--ui-danger)]">{t("cancelledLabel")}: {formatDateTime(reservation.cancelledAt)}</p> : null}</div> },
    { id: "customer", header: t("customer"), cell: (reservation) => <TableReservationCustomerCell customer={reservation.customer} /> },
    { id: "date", header: t("dateTime"), cell: (reservation) => formatReservationDate(reservation.reservationDate) },
    { id: "guests", header: t("guests"), align: "center", cell: (reservation) => <span className="tabular-nums">{reservation.guestCount}</span> },
    { id: "branch", header: t("branchNote"), cell: (reservation) => <div className="max-w-52"><p className="truncate font-medium">{getBranchName(reservation)}</p><p className="mt-1 truncate text-xs text-[var(--ui-text-muted)]">{reservation.branch?.address || (reservation.branchId ? t("branchId", { id: reservation.branchId }) : t("noBranch"))}</p><p className="mt-1 line-clamp-1 text-xs text-[var(--ui-text-muted)]">{reservation.note || t("noNote")}</p></div> },
    { id: "status", header: common("status"), align: "center", cell: (reservation) => <TableReservationStatusBadge status={reservation.status} /> },
    { id: "actions", header: common("actions"), align: "right", cell: (reservation) => <RowActions actions={[{ id: "status", label: common("updateStatus"), icon: <RefreshCw className="size-4" />, onSelect: () => setStatusReservation(reservation) }]} /> },
  ];

  return (
    <>
      <ResponsiveDataView
        data={reservations}
        columns={columns}
        rowKey={(reservation) => reservation.id}
        loading={loading}
        error={error?.message}
        errorTitle={t("errorTitle")}
        emptyTitle={t("emptyTitle")}
        renderMobileItem={(reservation) => (
          <article className="rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 shadow-[var(--ui-shadow-xs)]">
            <div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-[var(--ui-text)]">{formatShortId(reservation.id)}</p><p className="mt-1 truncate text-sm text-[var(--ui-text-muted)]">{formatReservationDate(reservation.reservationDate)}</p></div><TableReservationStatusBadge status={reservation.status} /></div>
            <div className="mt-4"><TableReservationCustomerCell customer={reservation.customer} /></div>
            <dl className="mt-4 grid grid-cols-2 gap-2">
              <Info label={t("guests")} value={String(reservation.guestCount)} />
              <Info label={t("branch")} value={getBranchName(reservation)} />
              <Info label={t("created")} value={formatDateTime(reservation.createdAt)} />
              <Info label={t("cancelledLabel")} value={reservation.cancelledAt ? formatDateTime(reservation.cancelledAt) : "—"} />
            </dl>
            <p className="mt-3 text-xs text-[var(--ui-text-muted)]">{reservation.branch?.address || (reservation.branchId ? t("branchId", { id: reservation.branchId }) : t("noBranch"))}</p>
            <div className="mt-4 flex items-end justify-between gap-3"><p className="line-clamp-2 min-w-0 text-sm text-[var(--ui-text-muted)]">{reservation.note || t("noNote")}</p><RowActions actions={[{ id: "status", label: common("updateStatus"), icon: <RefreshCw className="size-4" />, onSelect: () => setStatusReservation(reservation) }]} /></div>
          </article>
        )}
      />
      <TableReservationStatusUpdateDialog open={Boolean(statusReservation)} reservation={statusReservation} restaurantId={restaurantId} branchId={branchId} onOpenChange={(open) => { if (!open) setStatusReservation(null); }} />
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-[var(--ui-radius-compact)] bg-[var(--ui-surface-subtle)] p-3"><dt className="text-xs text-[var(--ui-text-subtle)]">{label}</dt><dd className="mt-1 truncate text-sm font-semibold text-[var(--ui-text)]">{value}</dd></div>;
}
