"use client";

import { Armchair, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import Container from "@/components/common/Container";
import { DetailLayout, DetailPanel, InfoList } from "@/components/common/DetailLayout";
import { StatePanel } from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/status-badge";
import { TableAssignmentDialog } from "@/components/pages/TableReservations/components/TableAssignmentDialog";
import TableReservationStatusBadge from "@/components/pages/TableReservations/components/TableReservationStatusBadge";
import { TableReservationStatusUpdateDialog } from "@/components/pages/TableReservations/components/TableReservationStatusUpdateDialog";
import { useTableReservationQuickActions } from "@/components/pages/TableReservations/components/TableReservationQuickActions";
import { getTableReservationQuickActions } from "@/components/pages/TableReservations/utils/table-reservation-actions";
import {
  formatDateTime,
  formatReservationDate,
  formatShortId,
  getCustomerDisplayEmail,
  getCustomerFullName,
  isWalkInReservation,
} from "@/components/pages/TableReservations/utils/table-reservations-formatters";
import {
  preserveTableReservationsListQuery,
  TABLE_RESERVATIONS_ROUTE,
} from "@/components/pages/TableReservations/utils/table-reservations-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useTableReservation } from "@/hooks/useTableReservations";
import { getApiErrorMessage } from "@/lib/errors";
import { useTableAssignments } from "@/lib/table-reservation-assignments";
import { isActiveTableReservationStatus } from "@/lib/table-reservation-transitions";
import type { TableReservation } from "@/types/table-reservations";

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="ghost" size="icon" aria-label={label}>
      <Link href={href}>
        <ArrowLeft aria-hidden="true" className="size-4" />
      </Link>
    </Button>
  );
}

function DetailsSkeleton({ label }: { label: string }) {
  return (
    <Container>
      <div role="status" aria-label={label} className="space-y-5">
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
          <div className="space-y-5">
            <Skeleton className="h-56 w-full rounded-[var(--ui-radius-card)]" />
            <Skeleton className="h-40 w-full rounded-[var(--ui-radius-card)]" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-40 w-full rounded-[var(--ui-radius-card)]" />
            <Skeleton className="h-40 w-full rounded-[var(--ui-radius-card)]" />
          </div>
        </div>
      </div>
    </Container>
  );
}

export function TableReservationDetailsPage() {
  const t = useTranslations("tableReservations");
  const common = useTranslations("common");
  const params = useParams<{ reservationId: string }>();
  const reservationId = typeof params?.reservationId === "string" ? params.reservationId : "";
  const searchParams = useSearchParams();
  const backHref = `${TABLE_RESERVATIONS_ROUTE}${preserveTableReservationsListQuery(searchParams)}`;
  const { restaurantId, branchId, isBranchAdmin, isPosPrinter } = useAuth();
  const isBranchScoped = isBranchAdmin || isPosPrinter;
  const scope = {
    restaurantId: restaurantId || undefined,
    branchId: isBranchScoped ? branchId || undefined : undefined,
  };
  const reservationQuery = useTableReservation(reservationId, scope);
  const quickActions = useTableReservationQuickActions(scope);
  const { getLabel } = useTableAssignments();
  const [statusOpen, setStatusOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  if (reservationQuery.isLoading && !reservationQuery.data) {
    return <DetailsSkeleton label={t("loadingDetail")} />;
  }

  if (reservationQuery.isError && !reservationQuery.data) {
    return (
      <Container>
        <PageHeader
          title={t("title")}
          backAction={<BackLink href={backHref} label={t("backToReservations")} />}
        />
        <StatePanel
          state="error"
          title={t("errorTitle")}
          description={getApiErrorMessage(reservationQuery.error, t("loadErrorDescription"))}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" onClick={() => void reservationQuery.refetch()}>
                {t("retry")}
              </Button>
              <Button asChild variant="outline">
                <Link href={backHref}>{t("backToReservations")}</Link>
              </Button>
            </div>
          }
        />
      </Container>
    );
  }

  const reservation: TableReservation | null | undefined = reservationQuery.data;

  if (!reservation) {
    return (
      <Container>
        <PageHeader
          title={t("title")}
          backAction={<BackLink href={backHref} label={t("backToReservations")} />}
        />
        <StatePanel
          state="empty"
          title={t("notFoundTitle")}
          description={t("notFoundDescription")}
          action={
            <Button asChild variant="outline">
              <Link href={backHref}>{t("backToReservations")}</Link>
            </Button>
          }
        />
      </Container>
    );
  }

  const shortId = formatShortId(reservation.id);
  const walkIn = isWalkInReservation(reservation);
  const tableLabel = getLabel(reservation.id);
  const isActive = isActiveTableReservationStatus(reservation.status);
  const actions = getTableReservationQuickActions(reservation);
  const customerEmail = getCustomerDisplayEmail(reservation.customer);

  return (
    <Container>
      {reservationQuery.isError ? (
        <StatePanel
          state="error"
          compact
          title={t("refreshFailedTitle")}
          description={getApiErrorMessage(reservationQuery.error, t("loadErrorDescription"))}
          action={
            <Button type="button" variant="outline" onClick={() => void reservationQuery.refetch()}>
              {t("retry")}
            </Button>
          }
        />
      ) : null}
      <PageHeader
        eyebrow={t("title")}
        title={t("detailTitle", { id: shortId })}
        description={t("detailDescription")}
        backAction={<BackLink href={backHref} label={t("backToReservations")} />}
        actions={
          <>
            {actions.map((action) => (
              <Button
                key={action.id}
                type="button"
                variant={action.destructive ? "outline" : "default"}
                className={action.destructive ? "text-[var(--ui-danger)]" : undefined}
                disabled={quickActions.isPending}
                onClick={() => quickActions.run(reservation, action)}
              >
                {t(action.labelKey)}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setStatusOpen(true)}
              className="gap-2"
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              {common("updateStatus")}
            </Button>
          </>
        }
      />

      <DetailLayout
        summary={
          <div className="flex flex-wrap items-center gap-2">
            <TableReservationStatusBadge status={reservation.status} />
            {walkIn ? <StatusBadge tone="info">{t("walkIn")}</StatusBadge> : null}
            {tableLabel ? (
              <StatusBadge tone="neutral">{t("tableAssigned", { label: tableLabel })}</StatusBadge>
            ) : null}
            <span className="text-sm text-[var(--ui-text-muted)]">
              {formatReservationDate(reservation.reservationDate)}
            </span>
          </div>
        }
        aside={
          <>
            <DetailPanel title={t("branch")}>
              <InfoList
                columns={1}
                items={[
                  { id: "branch-name", label: common("name"), value: reservation.branch?.name },
                  { id: "branch-address", label: common("address"), value: reservation.branch?.address },
                  {
                    id: "branch-id",
                    label: t("branchIdLabel"),
                    value: reservation.branch?.id || reservation.branchId,
                  },
                ]}
              />
            </DetailPanel>

            <DetailPanel
              title={t("tableSection")}
              description={t("tableLabelHelp")}
              action={
                isActive ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setAssignOpen(true)}
                  >
                    <Armchair aria-hidden="true" className="size-4" />
                    {tableLabel ? t("changeTable") : t("assignTable")}
                  </Button>
                ) : undefined
              }
            >
              <p className="text-sm font-medium text-[var(--ui-text)]">
                {tableLabel ? t("tableAssigned", { label: tableLabel }) : t("noTable")}
              </p>
            </DetailPanel>
          </>
        }
      >
        <DetailPanel title={t("reservationSection")}>
          <InfoList
            items={[
              { id: "date", label: t("dateTime"), value: formatReservationDate(reservation.reservationDate) },
              { id: "guests", label: t("guests"), value: String(reservation.guestCount) },
              { id: "created", label: t("created"), value: formatDateTime(reservation.createdAt) },
              {
                id: "cancelled",
                label: t("cancelledLabel"),
                value: reservation.cancelledAt ? formatDateTime(reservation.cancelledAt) : undefined,
                hidden: !reservation.cancelledAt,
              },
              { id: "note", label: common("note"), value: reservation.note },
              { id: "id", label: t("reservationId"), value: reservation.id },
            ]}
          />
        </DetailPanel>

        <DetailPanel title={t("customer")}>
          <InfoList
            items={[
              { id: "name", label: common("name"), value: getCustomerFullName(reservation.customer) },
              {
                id: "email",
                label: common("email"),
                value: customerEmail || (walkIn ? t("walkInGuest") : undefined),
              },
              { id: "phone", label: common("phone"), value: reservation.customer?.phone },
            ]}
          />
        </DetailPanel>
      </DetailLayout>

      <TableReservationStatusUpdateDialog
        open={statusOpen}
        reservation={reservation}
        restaurantId={scope.restaurantId}
        branchId={scope.branchId}
        onOpenChange={setStatusOpen}
      />
      <TableAssignmentDialog open={assignOpen} reservation={reservation} onOpenChange={setAssignOpen} />
      {quickActions.confirmDialog}
    </Container>
  );
}

export default TableReservationDetailsPage;
