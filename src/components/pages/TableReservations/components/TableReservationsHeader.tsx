"use client";

import { RefreshCw } from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

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
  const common = useTranslations("common");
  const t = useTranslations("tableReservations");

  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-2">
        <PageHeader
          title={t("title")}
          description={t("description")}
        />
        <p className="text-sm text-gray-500">{t("found", { total })}</p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="w-fit items-center gap-2"
      >
        <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
        {common("refresh")}
      </Button>
    </div>
  );
}
