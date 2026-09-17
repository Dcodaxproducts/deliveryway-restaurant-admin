"use client";

import { useMemo, useState } from "react";
import { Tag } from "lucide-react";

import PromotionSectionHeader from "../PromotionOverview/PromotionSectionHeader";
import PromotionStatCard from "@/components/cards/PromotionStatCard";
import PromotionsTable from "./table";
import { useGetAdminPromotionCampaigns } from "@/hooks/usePromotions";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import { StatePanel } from "@/components/common/EmptyState";

type CampaignSummary = Record<string, unknown> & {
  id: string;
  status?: string;
  isActive?: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toCampaigns = (value: unknown): CampaignSummary[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is CampaignSummary => isRecord(item) && typeof item.id === "string",
      )
    : [];

const getListFromResponse = (response: unknown) => {
  if (!isRecord(response)) return [];
  if (Array.isArray(response.data)) return toCampaigns(response.data);
  if (isRecord(response.data) && Array.isArray(response.data.data)) {
    return toCampaigns(response.data.data);
  }
  return [];
};

const getMetaFromResponse = (response: unknown): Record<string, unknown> => {
  if (!isRecord(response)) return {};
  if (isRecord(response.meta)) return response.meta;
  if (isRecord(response.data) && isRecord(response.data.meta)) return response.data.meta;
  return {};
};

const metaNumber = (meta: Record<string, unknown>, key: string, fallback: number) =>
  typeof meta[key] === "number" ? meta[key] : fallback;

export default function PromotionsPage() {
  const t = useTranslations("promotions");
  const { user, restaurantId } = useAuth();

  const branchId = user?.branchId ?? null;
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isFetching, isError } = useGetAdminPromotionCampaigns({
    restaurantId,
    branchId,
    page,
    limit,
  });

  const promotions = getListFromResponse(data);
  const meta = getMetaFromResponse(data);
  const loading = isLoading || isFetching;

  const stats = useMemo(() => {
    const total = metaNumber(meta, "total", promotions.length);

    const active = promotions.filter(
      (item) => item.status === "ACTIVE" || item.isActive
    ).length;

    const upcoming = promotions.filter(
      (item) => item.status === "SCHEDULED"
    ).length;

    const expired = promotions.filter(
      (item) => item.status === "EXPIRED"
    ).length;

    return {
      total,
      active,
      upcoming,
      expired,
    };
  }, [promotions, meta]);

  return (
    <div className="mt-1 space-y-10">
      <PromotionSectionHeader
        title={t("title")}
        description={t("description")}
        showViewAll={false}
        actionLabel={t("addPromotion")}
        actionHref="/promotion-management/promotions/add"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <PromotionStatCard
          icon={<Tag size={18} />}
          value={stats.total}
          label={t("totalPromotions")}
          loading={loading}
        />

        <PromotionStatCard
          icon={<Tag size={18} />}
          value={stats.active}
          label={t("activePromotions")}
          loading={loading}
        />

        <PromotionStatCard
          icon={<Tag size={18} />}
          value={stats.upcoming}
          label={t("upcomingPromotions")}
          loading={loading}
        />

        <PromotionStatCard
          icon={<Tag size={18} />}
          value={stats.expired}
          label={t("expiredPromotions")}
          loading={loading}
        />
      </div>

      {isError ? (
        <StatePanel state="error" />
      ) : (
      <PromotionsTable
        promotions={promotions}
        loading={loading}
        meta={{
          page: metaNumber(meta, "page", page),
          limit: metaNumber(meta, "limit", limit),
          total: metaNumber(meta, "total", 0),
          totalPages: metaNumber(meta, "totalPages", 1),
          hasNext: Boolean(meta.hasNext),
          hasPrevious: Boolean(meta.hasPrevious),
        }}
        onPageChange={setPage}
      />
      )}
    </div>
  );
}
