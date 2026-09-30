"use client";

import { Eye, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import type { DataTableColumn } from "@/components/common/DataTable";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";
import { RowActions, type RowAction } from "@/components/common/RowActions";
import { StatusBadge } from "@/components/common/status-badge";
import { TableReservationStatusUpdateDialog } from "@/components/pages/TableReservations/components/TableReservationStatusUpdateDialog";
import { buildTableReservationDetailHref } from "@/components/pages/TableReservations/utils/table-reservations-query";
import {
  formatDateTime,
  formatReservationDate,
  formatShortId,
  getBranchName,
  isWalkInReservation,
} from "@/components/pages/TableReservations/utils/table-reservations-formatters";
import type { TableReservation } from "@/types/table-reservations";
import TableReservationCustomerCell from "./TableReservationCustomerCell";
import TableReservationStatusBadge from "./TableReservationStatusBadge";

type TableReservationsTableProps = {
  reservations: TableReservation[];
  loading: boolean;
  error?: Error | null;
  restaurantId?: string;
  branchId?: string;
  /** Current list query string so detail navigation can return to the same view. */
  listQuery?: string;
};

export function TableReservationsTable({
  reservations,
  loading,
  error,
  restaurantId,
  branchId,
  listQuery = "",
}: TableReservationsTableProps) {
  const common = useTranslations("common");
  const t = useTranslations("tableReservations");
  const router = useRouter();
  const [statusReservation, setStatusReservation] = useState<TableReservation | null>(null);

  const detailHref = (reservation: TableReservation) =>
    buildTableReservationDetailHref(reservation.id, listQuery);

  const rowActions = (reservation: TableReservation): RowAction[] => [
    {
      id: "view",
      label: common("viewDetails"),
      icon: <Eye className="size-4" />,
      onSelect: () => router.push(detailHref(reservation)),
    },
    {
      id: "status",
      label: common("updateStatus"),
      icon: <RefreshCw className="size-4" />,
      onSelect: () => setStatusReservation(reservation),
    },
  ];

  const renderBadges = (reservation: TableReservation) => {
    const tableLabel = reservation.tableLabel;
    if (!isWalkInReservation(reservation) && !tableLabel) return null;

    return (
      <div className="mt-1 flex flex-wrap gap-1">
        {isWalkInReservation(reservation) ? (
          <StatusBadge tone="info" size="sm">{t("walkIn")}</StatusBadge>
        ) : null}
        {tableLabel ? (
          <StatusBadge tone="neutral" size="sm">{t("tableAssigned", { label: tableLabel })}</StatusBadge>
        ) : null}
      </div>
    );
  };

  const columns: readonly DataTableColumn<TableReservation>[] = [
    {
      id: "reservation",
      header: t("reservation"),
      cell: (reservation) => (
        <div>
          <Link
            href={detailHref(reservation)}
            aria-label={t("openDetails", { id: formatShortId(reservation.id) })}
            className="font-semibold text-[var(--ui-text)] underline-offset-4 hover:text-primary hover:underline focus-visible:underline"
          >
            {formatShortId(reservation.id)}
          </Link>
          {renderBadges(reservation)}
          <p className="mt-1 text-xs text-[var(--ui-text-muted)]">{t("created")}: {formatDateTime(reservation.createdAt)}</p>
          {reservation.cancelledAt ? <p className="mt-1 text-xs text-[var(--ui-danger)]">{t("cancelledLabel")}: {formatDateTime(reservation.cancelledAt)}</p> : null}
        </div>
      ),
    },
    { id: "customer", header: t("customer"), cell: (reservation) => <TableReservationCustomerCell customer={reservation.customer} isWalkIn={reservation.isWalkIn} /> },
    { id: "date", header: t("dateTime"), cell: (reservation) => formatReservationDate(reservation.reservationDate) },
    { id: "guests", header: t("guests"), align: "center", cell: (reservation) => <span className="tabular-nums">{reservation.guestCount}</span> },
    { id: "branch", header: t("branchNote"), cell: (reservation) => <div className="max-w-52"><p className="truncate font-medium">{getBranchName(reservation)}</p><p className="mt-1 truncate text-xs text-[var(--ui-text-muted)]">{reservation.branch?.address || (reservation.branchId ? t("branchId", { id: reservation.branchId }) : t("noBranch"))}</p><p className="mt-1 line-clamp-1 text-xs text-[var(--ui-text-muted)]">{reservation.note || t("noNote")}</p></div> },
    { id: "status", header: common("status"), align: "center", cell: (reservation) => <TableReservationStatusBadge status={reservation.status} /> },
    { id: "actions", header: common("actions"), align: "right", cell: (reservation) => <RowActions label={t("openActions")} actions={rowActions(reservation)} /> },
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
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={detailHref(reservation)}
                  aria-label={t("openDetails", { id: formatShortId(reservation.id) })}
                  className="block truncate font-semibold text-[var(--ui-text)] underline-offset-4 hover:text-primary hover:underline focus-visible:underline"
                >
                  {formatShortId(reservation.id)}
                </Link>
                <p className="mt-1 truncate text-sm text-[var(--ui-text-muted)]">{formatReservationDate(reservation.reservationDate)}</p>
                {renderBadges(reservation)}
              </div>
              <TableReservationStatusBadge status={reservation.status} />
            </div>
            <div className="mt-4"><TableReservationCustomerCell customer={reservation.customer} isWalkIn={reservation.isWalkIn} /></div>
            <dl className="mt-4 grid grid-cols-2 gap-2">
              <Info label={t("guests")} value={String(reservation.guestCount)} />
              <Info label={t("branch")} value={getBranchName(reservation)} />
              <Info label={t("created")} value={formatDateTime(reservation.createdAt)} />
              <Info label={t("cancelledLabel")} value={reservation.cancelledAt ? formatDateTime(reservation.cancelledAt) : "—"} />
            </dl>
            <p className="mt-3 text-xs text-[var(--ui-text-muted)]">{reservation.branch?.address || (reservation.branchId ? t("branchId", { id: reservation.branchId }) : t("noBranch"))}</p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <p className="line-clamp-2 min-w-0 text-sm text-[var(--ui-text-muted)]">{reservation.note || t("noNote")}</p>
              <RowActions label={t("openActions")} actions={rowActions(reservation)} />
            </div>
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
