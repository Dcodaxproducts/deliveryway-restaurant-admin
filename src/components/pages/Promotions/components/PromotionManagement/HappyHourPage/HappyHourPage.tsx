"use client";

import { useMemo, useState } from "react";
import { Clock } from "lucide-react";

import PromotionSectionHeader from "../PromotionOverview/PromotionSectionHeader";
import PromotionStatCard from "@/components/cards/PromotionStatCard";
import HappyHoursTable from "./table";
import { useGetAdminHappyHours } from "@/hooks/usePromotions";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import { StatePanel } from "@/components/common/EmptyState";
import { SectionCard } from "@/components/common/SectionCard";

type HappyHourSummary = Record<string, unknown> & {
  id: string;
  status?: string;
  isActive?: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toHappyHours = (value: unknown): HappyHourSummary[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is HappyHourSummary => isRecord(item) && typeof item.id === "string",
      )
    : [];

const getListFromResponse = (response: unknown) => {
  if (!isRecord(response)) return [];
  if (Array.isArray(response.data)) return toHappyHours(response.data);
  if (isRecord(response.data) && Array.isArray(response.data.data)) {
    return toHappyHours(response.data.data);
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

export default function HappyHoursPage() {
  const t = useTranslations("promotions");
  const { user, restaurantId } = useAuth();

  const branchId = user?.branchId ?? null;
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isFetching, isError } = useGetAdminHappyHours({
    restaurantId,
    branchId,
    page,
    limit,
  });

  const happyHours = getListFromResponse(data);
  const meta = getMetaFromResponse(data);
  const loading = isLoading || isFetching;

  const stats = useMemo(() => {
    const total = metaNumber(meta, "total", happyHours.length);

    const active = happyHours.filter(
      (item) => item.status === "ACTIVE" || item.isActive
    ).length;

    const upcoming = happyHours.filter(
      (item) => item.status === "SCHEDULED"
    ).length;

    const expired = happyHours.filter(
      (item) => item.status === "EXPIRED"
    ).length;

    return {
      total,
      active,
      upcoming,
      expired,
    };
  }, [happyHours, meta]);

  return (
    <div className="mt-1 space-y-6">
      <PromotionSectionHeader
        title={t("happyHours")}
        description={t("happyHoursDescription")}
        showViewAll={false}
        actionLabel={t("addHappyHour")}
        actionHref="/promotion-management/happy-hour/add"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PromotionStatCard
          icon={<Clock size={18} />}
          value={stats.total}
          label={t("totalHappyHours")}
          loading={loading}
        />

        <PromotionStatCard
          icon={<Clock size={18} />}
          value={stats.active}
          label={t("activeHappyHours")}
          loading={loading}
        />

        <PromotionStatCard
          icon={<Clock size={18} />}
          value={stats.upcoming}
          label={t("upcomingHappyHours")}
          loading={loading}
        />

        <PromotionStatCard
          icon={<Clock size={18} />}
          value={stats.expired}
          label={t("expiredHappyHours")}
          loading={loading}
        />
      </div>

      {isError ? (
        <StatePanel state="error" />
      ) : (
        <SectionCard padding="none">
          <HappyHoursTable
            happyHours={happyHours}
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
        </SectionCard>
      )}
    </div>
  );
}
