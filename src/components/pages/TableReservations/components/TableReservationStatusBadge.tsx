"use client";

import { StatusBadge } from "@/components/common/status-badge";
import { TABLE_RESERVATION_STATUS_LABEL_KEYS } from "@/lib/status-labels";
import type { TableReservationStatus } from "@/types/table-reservations";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("tableReservations");
  const statusLabel = TABLE_RESERVATION_STATUS_LABEL_KEYS[status]
    ? t(TABLE_RESERVATION_STATUS_LABEL_KEYS[status])
    : status;

  return (
    <StatusBadge tone={statusToneMap[status] ?? "neutral"}>
      {statusLabel}
    </StatusBadge>
  );
}
