import { StatusBadge } from "@/components/common/status-badge";
import { formatStatusLabel } from "@/components/pages/TableReservations/utils/table-reservations-formatters";
import type { TableReservationStatus } from "@/types/table-reservations";

type TableReservationStatusBadgeProps = {
  status: TableReservationStatus;
};

const statusToneMap: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  REQUESTED: "warning",
  CONFIRMED: "success",
  CANCELLED: "danger",
  COMPLETED: "success",
  NO_SHOW: "danger",
  SEATED: "info",
};

export default function TableReservationStatusBadge({
  status,
}: TableReservationStatusBadgeProps) {
  return (
    <StatusBadge tone={statusToneMap[status] ?? "neutral"}>
      {formatStatusLabel(status)}
    </StatusBadge>
  );
}

