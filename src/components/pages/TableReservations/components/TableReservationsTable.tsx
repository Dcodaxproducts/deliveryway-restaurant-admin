"use client";

import { useState } from "react";
import { MoreHorizontal, RefreshCw } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { TableReservationStatusUpdateDialog } from "@/components/pages/TableReservations/components/TableReservationStatusUpdateDialog";
import {
  formatDateTime,
  formatReservationDate,
  formatShortId,
  getBranchName,
} from "@/components/pages/TableReservations/utils/table-reservations-formatters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TableReservation } from "@/types/table-reservations";
import TableReservationCustomerCell from "./TableReservationCustomerCell";
import TableReservationStatusBadge from "./TableReservationStatusBadge";
import TableReservationsEmptyState from "./TableReservationsEmptyState";
import { useTranslations } from "next-intl";

type TableReservationsTableProps = {
  reservations: TableReservation[];
  loading: boolean;
  error?: Error | null;
  restaurantId?: string;
  branchId?: string;
};

const desktopColumnCount = 7;

export function TableReservationsTable({
  reservations,
  loading,
  error,
  restaurantId,
  branchId,
}: TableReservationsTableProps) {
  const common = useTranslations("common");
  const t = useTranslations("tableReservations");
  const [statusReservation, setStatusReservation] =
    useState<TableReservation | null>(null);

  if (loading) {
    return (
      <>
        <div className="lg:hidden py-10 text-center text-sm text-gray-400">
          {t("loading")}
        </div>
        <div className="hidden w-full max-w-full overflow-hidden rounded-[18px] border border-gray-100 bg-white shadow-sm md:block">
          <table className="w-full table-fixed text-sm">
            <tbody>
              {Array.from({ length: 6 }).map((_, index) => (
                <tr key={index}>
                  <td colSpan={desktopColumnCount} className="px-5 py-5">
                    <div className="grid animate-pulse grid-cols-[16%_23%_16%_9%_17%_11%_8%] gap-3">
                      <div className="h-4 rounded bg-gray-200" />
                      <div className="h-4 rounded bg-gray-200" />
                      <div className="h-4 rounded bg-gray-200" />
                      <div className="h-4 rounded bg-gray-200" />
                      <div className="h-4 rounded bg-gray-200" />
                      <div className="h-4 rounded bg-gray-200" />
                      <div className="h-4 rounded bg-gray-200" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <EmptyState
        title={t("errorTitle")}
        description={error.message || common("refreshAndTry")}
      />
    );
  }

  if (reservations.length === 0) {
    return <TableReservationsEmptyState />;
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="hidden w-full max-w-full overflow-hidden rounded-[18px] border border-gray-100 bg-white shadow-sm md:block">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b bg-[#FAFAFA] text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="w-[16%] px-5 py-4">{t("reservation")}</th>
              <th className="w-[23%] px-3 py-4">{t("customer")}</th>
              <th className="w-[16%] px-3 py-4">{t("dateTime")}</th>
              <th className="w-[9%] px-3 py-4 text-center">{t("guests")}</th>
              <th className="w-[17%] px-3 py-4">{t("branchNote")}</th>
              <th className="w-[11%] px-3 py-4 text-center">{common("status")}</th>
              <th className="w-[8%] px-5 py-4 text-center">{common("actions")}</th>
            </tr>
          </thead>

          <tbody>
            {reservations.map((reservation) => (
              <tr
                key={reservation.id}
                className="border-b border-gray-100 transition hover:bg-[#FAFAFA]"
              >
                <td className="px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">
                      {formatShortId(reservation.id)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      {t("created")}: {formatDateTime(reservation.createdAt)}
                    </p>
                    {reservation.cancelledAt ? (
                      <p className="mt-0.5 truncate text-xs text-red-500">
                        {t("cancelledLabel")}: {formatDateTime(reservation.cancelledAt)}
                      </p>
                    ) : null}
                  </div>
                </td>

                <td className="px-3 py-4">
                  <TableReservationCustomerCell customer={reservation.customer} />
                </td>

                <td className="px-3 py-4 text-gray-700">
                  <span className="block truncate">
                    {formatReservationDate(reservation.reservationDate)}
                  </span>
                </td>

                <td className="px-3 py-4 text-center">
                  <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    {reservation.guestCount}
                  </span>
                </td>

                <td className="px-3 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-700">
                      {getBranchName(reservation)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      {reservation.branch?.address ||
                        (reservation.branchId ? t("branchId", { id: reservation.branchId }) : t("noBranch"))}
                    </p>
                    <p className="mt-1 line-clamp-1 break-words text-xs text-gray-500">
                      {reservation.note || t("noNote")}
                    </p>
                  </div>
                </td>

                <td className="px-3 py-4 text-center">
                  <TableReservationStatusBadge status={reservation.status} />
                </td>

                <td className="px-5 py-4 text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex size-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-50 hover:text-primary"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        onClick={() => setStatusReservation(reservation)}
                      >
                        <RefreshCw size={16} />
                        {common("updateStatus")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="w-full max-w-full space-y-4 md:hidden">
        {reservations.map((reservation) => (
          <div
            key={reservation.id}
            className="w-full max-w-full overflow-hidden rounded-[18px] border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {formatShortId(reservation.id)}
                </p>
                <p className="mt-1 truncate text-xs text-gray-500">
                  {formatReservationDate(reservation.reservationDate)}
                </p>
              </div>

              <TableReservationStatusBadge status={reservation.status} />
            </div>

            <div className="mt-4">
              <TableReservationCustomerCell customer={reservation.customer} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="min-w-0 rounded-[12px] bg-[#FAFAFA] p-3">
                <p className="text-xs text-gray-400">{t("guests")}</p>
                <p className="truncate text-sm font-semibold text-gray-900">
                  {reservation.guestCount}
                </p>
              </div>

              <div className="min-w-0 rounded-[12px] bg-[#FAFAFA] p-3">
                <p className="text-xs text-gray-400">{t("branch")}</p>
                <p className="truncate text-sm font-semibold text-gray-900">
                  {getBranchName(reservation)}
                </p>
              </div>

              <div className="min-w-0 rounded-[12px] bg-[#FAFAFA] p-3">
                <p className="text-xs text-gray-400">{t("created")}</p>
                <p className="truncate text-sm font-semibold text-gray-900">
                  {formatDateTime(reservation.createdAt)}
                </p>
              </div>

              <div className="min-w-0 rounded-[12px] bg-[#FAFAFA] p-3">
                <p className="text-xs text-gray-400">{t("cancelledLabel")}</p>
                <p className="truncate text-sm font-semibold text-gray-900">
                  {reservation.cancelledAt
                    ? formatDateTime(reservation.cancelledAt)
                    : "—"}
                </p>
              </div>
            </div>

            <p className="mt-3 line-clamp-2 break-words text-sm text-gray-500">
              {reservation.note || t("noNote")}
            </p>

            <button
              type="button"
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-[var(--brand-button-radius)] bg-primary px-4 text-sm font-medium text-white"
              onClick={() => setStatusReservation(reservation)}
            >
              <RefreshCw size={16} />
              {common("updateStatus")}
            </button>
          </div>
        ))}
      </div>

      <TableReservationStatusUpdateDialog
        open={Boolean(statusReservation)}
        reservation={statusReservation}
        restaurantId={restaurantId}
        branchId={branchId}
        onOpenChange={(open) => {
          if (!open) setStatusReservation(null);
        }}
      />
    </div>
  );
}
