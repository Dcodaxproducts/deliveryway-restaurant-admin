"use client";

import StatsSection from "@/components/common/stats-section";
import type { TableReservation } from "@/types/table-reservations";
import type { StatItem } from "@/types/stats";
import { useTranslations } from "next-intl";

type TableReservationsStatsProps = {
  reservations: TableReservation[];
  total: number;
  loading: boolean;
};

const countByStatus = (reservations: TableReservation[], status: string) => {
  return reservations.filter(
    (reservation) => reservation.status.toUpperCase() === status
  ).length;
};

const getGuestCount = (reservations: TableReservation[]) => {
  return reservations.reduce((totalGuests, reservation) => {
    return totalGuests + reservation.guestCount;
  }, 0);
};

export default function TableReservationsStats({
  reservations,
  total,
  loading,
}: TableReservationsStatsProps) {
  const t = useTranslations("tableReservations");
  const requestedCount = countByStatus(reservations, "REQUESTED");
  const confirmedCount = countByStatus(reservations, "CONFIRMED");
  const guestsCount = getGuestCount(reservations);

  const stats: StatItem[] = [
    {
      _id: "total-table-reservations",
      title: t("totalReservations"),
      value: total.toLocaleString(),
      icon: "orders",
      iconStyle: "default",
      trend: {
        direction: "up",
        percentage: t("shown", { count: reservations.length }),
      },
    },
    {
      _id: "requested-table-reservations",
      title: t("requested"),
      value: requestedCount.toLocaleString(),
      icon: "ongoing",
      iconStyle: "default",
      trend: {
        direction: "up",
        percentage: t("currentPage"),
      },
    },
    {
      _id: "confirmed-table-reservations",
      title: t("confirmed"),
      value: confirmedCount.toLocaleString(),
      icon: "completed",
      iconStyle: "default",
      trend: {
        direction: "up",
        percentage: t("currentPage"),
      },
    },
    {
      _id: "visible-table-reservation-guests",
      title: t("guests"),
      value: guestsCount.toLocaleString(),
      icon: "users",
      iconStyle: "default",
      trend: {
        direction: "up",
        percentage: t("currentPage"),
      },
    },
  ];

  return (
    <StatsSection
      stats={stats}
      loading={loading}
      className="xl:grid-cols-4"
    />
  );
}
