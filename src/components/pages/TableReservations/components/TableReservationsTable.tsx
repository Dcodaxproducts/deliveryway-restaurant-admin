"use client";

import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import {
  formatDateTime,
  formatReservationDate,
  formatShortId,
  getBranchName,
} from "@/components/pages/TableReservations/utils/table-reservations-formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TableReservation } from "@/types/table-reservations";
import TableReservationCustomerCell from "./TableReservationCustomerCell";
import TableReservationStatusBadge from "./TableReservationStatusBadge";
import TableReservationsEmptyState from "./TableReservationsEmptyState";

type TableReservationsTableProps = {
  reservations: TableReservation[];
  loading: boolean;
  error?: Error | null;
};

const tableHeaders = [
  "Reservation ID",
  "Customer",
  "Reservation Date/Time",
  "Guests",
  "Branch",
  "Status",
  "Note",
  "Created At",
  "Cancelled At",
];

export default function TableReservationsTable({
  reservations,
  loading,
  error,
}: TableReservationsTableProps) {
  if (loading) {
    return (
      <>
        <div className="lg:hidden py-10 text-center text-sm text-gray-400">
          Loading table reservations...
        </div>
        <TableSkeleton headers={tableHeaders} rows={6} />
      </>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load table reservations."
        description={error.message || "Please refresh and try again."}
      />
    );
  }

  if (reservations.length === 0) {
    return <TableReservationsEmptyState />;
  }

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[1200px]">
        <TableHeader>
          <TableRow className="border-none bg-gray-50">
            {tableHeaders.map((header) => (
              <TableHead key={header} className="px-4 font-semibold text-gray-600">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {reservations.map((reservation) => (
            <TableRow key={reservation.id} className="h-[78px] border-none">
              <TableCell className="px-4 font-medium text-gray-500">
                {formatShortId(reservation.id)}
              </TableCell>
              <TableCell className="px-4">
                <TableReservationCustomerCell customer={reservation.customer} />
              </TableCell>
              <TableCell className="px-4 text-gray-600">
                {formatReservationDate(reservation.reservationDate)}
              </TableCell>
              <TableCell className="px-4 font-medium text-dark">
                {reservation.guestCount}
              </TableCell>
              <TableCell className="px-4 text-gray-600">
                <div className="max-w-[180px]">
                  <p className="truncate">{getBranchName(reservation)}</p>
                  {reservation.branch?.address ? (
                    <p className="truncate text-xs text-gray-400">
                      {reservation.branch.address}
                    </p>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="px-4">
                <TableReservationStatusBadge status={reservation.status} />
              </TableCell>
              <TableCell className="px-4 text-gray-500">
                <p className="max-w-[220px] truncate">{reservation.note || "No note"}</p>
              </TableCell>
              <TableCell className="px-4 text-gray-500">
                {formatDateTime(reservation.createdAt)}
              </TableCell>
              <TableCell className="px-4 text-gray-500">
                {reservation.cancelledAt
                  ? formatDateTime(reservation.cancelledAt)
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
