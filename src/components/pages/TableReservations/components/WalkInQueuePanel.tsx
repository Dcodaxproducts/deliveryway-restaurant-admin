"use client";

import { Armchair, Eye, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import type { DataTableColumn } from "@/components/common/DataTable";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";
import { RowActions, type RowAction } from "@/components/common/RowActions";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/status-badge";
import { TableAssignmentDialog } from "@/components/pages/TableReservations/components/TableAssignmentDialog";
import TableReservationStatusBadge from "@/components/pages/TableReservations/components/TableReservationStatusBadge";
import { useTableReservationQuickActions } from "@/components/pages/TableReservations/components/TableReservationQuickActions";
import type { TableReservationBranchOption } from "@/components/pages/TableReservations/components/TableReservationsFilters";
import { WalkInReservationDialog } from "@/components/pages/TableReservations/components/WalkInReservationDialog";
import { getTableReservationQuickActions } from "@/components/pages/TableReservations/utils/table-reservation-actions";
import {
  formatDateTime,
  formatShortId,
  getCustomerFullName,
  isWalkInReservation,
  WALK_IN_SEARCH_TOKEN,
} from "@/components/pages/TableReservations/utils/table-reservations-formatters";
import { buildTableReservationDetailHref } from "@/components/pages/TableReservations/utils/table-reservations-query";
import { Button } from "@/components/ui/button";
import { useTableReservations } from "@/hooks/useTableReservations";
import { useTableAssignments } from "@/lib/table-reservation-assignments";
import { isActiveTableReservationStatus } from "@/lib/table-reservation-transitions";
import {
  TABLE_RESERVATIONS_MAX_LIMIT,
  type TableReservation,
  type TableReservationsParams,
} from "@/types/table-reservations";

export type WalkInQueuePanelProps = {
  restaurantId?: string;
  branchId?: string;
  isBranchScoped: boolean;
  branchName?: string;
  branchOptions: TableReservationBranchOption[];
  /** POS printer accounts cannot call the POS walk-in endpoint. */
  canCreate: boolean;
  listQuery?: string;
};

/**
 * Builds the queue query. Walk-in guests are the API-generated `pos-guest-…` customers,
 * so the list endpoint's email search returns exactly that population.
 */
export const buildWalkInQueueParams = (
  scope: Pick<WalkInQueuePanelProps, "restaurantId" | "branchId">
): TableReservationsParams => ({
  page: 1,
  limit: TABLE_RESERVATIONS_MAX_LIMIT,
  search: WALK_IN_SEARCH_TOKEN,
  sortBy: "createdAt",
  sortOrder: "DESC",
  restaurantId: scope.restaurantId,
  branchId: scope.branchId,
});

export const selectWalkInQueue = (reservations: readonly TableReservation[]): TableReservation[] =>
  reservations
    .filter(
      (reservation) =>
        isWalkInReservation(reservation) && isActiveTableReservationStatus(reservation.status)
    )
    .sort((left, right) => left.reservationDate.localeCompare(right.reservationDate));

export function WalkInQueuePanel({
  restaurantId,
  branchId,
  isBranchScoped,
  branchName,
  branchOptions,
  canCreate,
  listQuery = "",
}: WalkInQueuePanelProps) {
  const t = useTranslations("tableReservations");
  const common = useTranslations("common");
  const router = useRouter();
  const { getLabel } = useTableAssignments();
  const params = useMemo(() => buildWalkInQueueParams({ restaurantId, branchId }), [branchId, restaurantId]);
  const queueQuery = useTableReservations(params);
  const queue = useMemo(() => selectWalkInQueue(queueQuery.data?.reservations ?? []), [queueQuery.data]);
  const quickActions = useTableReservationQuickActions({ restaurantId, branchId });
  const [createOpen, setCreateOpen] = useState(false);
  const [assignReservation, setAssignReservation] = useState<TableReservation | null>(null);

  const detailHref = (reservation: TableReservation) =>
    buildTableReservationDetailHref(reservation.id, listQuery);

  const rowActions = (reservation: TableReservation): RowAction[] => {
    const tableLabel = getLabel(reservation.id);
    const busy = quickActions.runningId === reservation.id;

    return [
      {
        id: "assign-table",
        label: tableLabel ? t("changeTable") : t("assignTable"),
        icon: <Armchair className="size-4" />,
        onSelect: () => setAssignReservation(reservation),
      },
      ...getTableReservationQuickActions(reservation).map<RowAction>((action) => ({
        id: action.id,
        label: t(action.labelKey),
        destructive: action.destructive,
        disabled: busy,
        onSelect: () => quickActions.run(reservation, action),
      })),
      {
        id: "view",
        label: common("viewDetails"),
        icon: <Eye className="size-4" />,
        onSelect: () => router.push(detailHref(reservation)),
      },
    ];
  };

  const renderTable = (reservation: TableReservation) => {
    const tableLabel = getLabel(reservation.id);
    return tableLabel ? (
      <StatusBadge tone="neutral">{t("tableAssigned", { label: tableLabel })}</StatusBadge>
    ) : (
      <span className="text-sm text-[var(--ui-text-muted)]">{t("noTable")}</span>
    );
  };

  const columns: readonly DataTableColumn<TableReservation>[] = [
    {
      id: "guest",
      header: t("customer"),
      cell: (reservation) => (
        <div className="min-w-0">
          <Link
            href={detailHref(reservation)}
            aria-label={t("openDetails", { id: formatShortId(reservation.id) })}
            className="block truncate font-semibold text-[var(--ui-text)] underline-offset-4 hover:text-primary hover:underline focus-visible:underline"
          >
            {getCustomerFullName(reservation.customer)}
          </Link>
          <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
            {reservation.customer?.phone || t("noPhone")}
          </p>
        </div>
      ),
    },
    {
      id: "party",
      header: t("partySize"),
      align: "center",
      cell: (reservation) => <span className="tabular-nums">{reservation.guestCount}</span>,
    },
    {
      id: "timing",
      header: t("waitingSince"),
      cell: (reservation) => (
        <div className="min-w-0 text-sm">
          <p className="tabular-nums">{formatDateTime(reservation.createdAt)}</p>
          <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
            {t("expectedAt")}: {formatDateTime(reservation.reservationDate)}
          </p>
        </div>
      ),
    },
    { id: "table", header: t("table"), cell: renderTable },
    {
      id: "status",
      header: common("status"),
      align: "center",
      cell: (reservation) => <TableReservationStatusBadge status={reservation.status} />,
    },
    {
      id: "actions",
      header: common("actions"),
      align: "right",
      cell: (reservation) => <RowActions label={t("openActions")} actions={rowActions(reservation)} />,
    },
  ];

  return (
    <SectionCard
      variant="outlined"
      padding="md"
      title={
        <span className="inline-flex flex-wrap items-center gap-2">
          {t("walkInQueueTitle")}
          <StatusBadge tone={queue.length > 0 ? "info" : "neutral"} size="sm">
            {t("walkInQueueCount", { count: queue.length })}
          </StatusBadge>
        </span>
      }
      description={t("walkInQueueDescription")}
      action={
        canCreate ? (
          <Button type="button" onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus aria-hidden="true" className="size-4" />
            {t("addWalkIn")}
          </Button>
        ) : undefined
      }
      data-testid="walk-in-queue"
    >
      <ResponsiveDataView
        data={queue}
        columns={columns}
        rowKey={(reservation) => reservation.id}
        loading={queueQuery.isLoading}
        error={queueQuery.error?.message}
        errorTitle={t("walkInQueueErrorTitle")}
        emptyTitle={t("walkInQueueEmptyTitle")}
        emptyDescription={t("walkInQueueEmptyDescription")}
        density="compact"
        renderMobileItem={(reservation) => (
          <article className="rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 shadow-[var(--ui-shadow-xs)]">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={detailHref(reservation)}
                  aria-label={t("openDetails", { id: formatShortId(reservation.id) })}
                  className="block truncate font-semibold text-[var(--ui-text)] underline-offset-4 hover:text-primary hover:underline focus-visible:underline"
                >
                  {getCustomerFullName(reservation.customer)}
                </Link>
                <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                  {t("partySize")}: {reservation.guestCount} · {reservation.customer?.phone || t("noPhone")}
                </p>
              </div>
              <TableReservationStatusBadge status={reservation.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="min-w-0 rounded-[var(--ui-radius-compact)] bg-[var(--ui-surface-subtle)] p-3">
                <dt className="text-xs text-[var(--ui-text-subtle)]">{t("waitingSince")}</dt>
                <dd className="mt-1 truncate font-semibold tabular-nums text-[var(--ui-text)]">{formatDateTime(reservation.createdAt)}</dd>
              </div>
              <div className="min-w-0 rounded-[var(--ui-radius-compact)] bg-[var(--ui-surface-subtle)] p-3">
                <dt className="text-xs text-[var(--ui-text-subtle)]">{t("expectedAt")}</dt>
                <dd className="mt-1 truncate font-semibold tabular-nums text-[var(--ui-text)]">{formatDateTime(reservation.reservationDate)}</dd>
              </div>
            </dl>
            <div className="mt-3 flex items-center justify-between gap-3">
              {renderTable(reservation)}
              <RowActions label={t("openActions")} actions={rowActions(reservation)} />
            </div>
          </article>
        )}
      />

      {canCreate ? (
        <WalkInReservationDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          branchOptions={branchOptions}
          scopedBranchId={isBranchScoped ? branchId : undefined}
          branchName={branchName}
        />
      ) : null}
      <TableAssignmentDialog
        open={assignReservation !== null}
        reservation={assignReservation}
        onOpenChange={(open) => {
          if (!open) setAssignReservation(null);
        }}
      />
      {quickActions.confirmDialog}
    </SectionCard>
  );
}
