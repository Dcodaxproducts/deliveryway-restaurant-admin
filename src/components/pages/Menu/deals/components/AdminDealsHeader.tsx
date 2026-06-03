"use client";

import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import Header from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

type AdminDealsHeaderProps = {
  total: number;
  isRefreshing: boolean;
  onRefresh: () => void;
};

export default function AdminDealsHeader({
  total,
  isRefreshing,
  onRefresh,
}: AdminDealsHeaderProps) {
  const router = useRouter();
  const common = useTranslations("common");
  const t = useTranslations("deals");

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <Header
        title={t("title")}
        description={t("description")}
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600">
          {t("total", { total: total.toLocaleString() })}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-[42px] rounded-[12px]"
        >
          <RefreshCw
            size={16}
            className={isRefreshing ? "mr-2 animate-spin" : "mr-2"}
          />
          {common("refresh")}
        </Button>
        <Button
          type="button"
          onClick={() => router.push("/menu/deals/add")}
          className="h-[42px] rounded-[12px] bg-primary text-white hover:bg-primary/90"
        >
          <Plus size={16} className="mr-2" />
          {t("addDeal")}
        </Button>
      </div>
    </div>
  );
}
