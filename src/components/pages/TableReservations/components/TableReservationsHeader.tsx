"use client";

import { RefreshCw } from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";

type TableReservationsHeaderProps = {
  total: number;
  isRefreshing: boolean;
  onRefresh: () => void;
};

export default function TableReservationsHeader({
  total,
  isRefreshing,
  onRefresh,
}: TableReservationsHeaderProps) {
  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-2">
        <PageHeader
          title="Table Reservations"
          description="View and manage customer table reservation requests."
        />
        <p className="text-sm text-gray-500">{total} reservations found</p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="w-fit items-center gap-2"
      >
        <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
        Refresh
      </Button>
    </div>
  );
}

