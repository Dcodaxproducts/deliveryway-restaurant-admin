"use client";

import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import Header from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

type AdminDealsHeaderProps = {
  isRefreshing: boolean;
  onRefresh: () => void;
};

export default function AdminDealsHeader({
  isRefreshing,
  onRefresh,
}: AdminDealsHeaderProps) {
  const router = useRouter();
  const common = useTranslations("common");
  const t = useTranslations("deals");

  return (
    <Header
      title={t("title")}
      description={t("description")}
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
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
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Plus size={16} className="mr-2" />
            {t("addDeal")}
          </Button>
        </>
      }
    />
  );
}
