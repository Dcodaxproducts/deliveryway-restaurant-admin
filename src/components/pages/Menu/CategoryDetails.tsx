"use client";

import type { ReactNode } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Layers,
  ListTree,
  Package,
  SlidersHorizontal,
  Tags,
  Utensils,
} from "lucide-react";
import { MediaImage as Image } from "@/components/common/MediaImage";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import Container from "@/components/common/Container";
import {
  DetailLayout,
  DetailPanel,
  InfoList,
} from "@/components/common/DetailLayout";
import { StatePanel } from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/status-badge";
import PromotionStatCard from "@/components/cards/PromotionStatCard";
import { Button } from "@/components/ui/button";
import { useGetMenuCategoryById } from "@/hooks/useMenuCategories";
import { formatDateTime24 } from "@/lib/date-time-format";

type CategoryItem = {
  id: string;
  name?: string | null;
  slug?: string | null;
  imageUrl?: string | null;
  basePrice?: unknown;
  isActive?: boolean;
};

type CategoryVariation = {
  id: string;
  name?: string | null;
  description?: string | null;
  price?: unknown;
  sortOrder?: unknown;
  isActive?: boolean;
  isDefault?: boolean;
  sku?: string | null;
  itemPriceOverrides?: unknown[];
};

type CategoryModifier = {
  id: string;
  name?: string | null;
  priceDelta?: unknown;
};

type CategoryModifierGroup = {
  id: string;
  name?: string | null;
  description?: string | null;
  minSelect?: unknown;
  maxSelect?: unknown;
  selectionType?: string | null;
  modifiers?: CategoryModifier[];
};

type CategoryDetails = {
  id: string;
  name?: string | null;
  description?: string | null;
  slug?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  sortOrder?: unknown;
  createdAt?: string | null;
  updatedAt?: string | null;
  parent?: { name?: string | null } | null;
  items?: CategoryItem[];
  variations?: CategoryVariation[];
  modifierGroups?: CategoryModifierGroup[];
  children?: { id?: string }[];
  _count?: { items?: number; children?: number };
};

export default function CategoryDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations("menu.categoryDetails");
  const commonT = useTranslations("common");
  const id = String(params?.id || "");
  const { data: response, isLoading } = useGetMenuCategoryById(id);
  const category = (response?.data || response) as CategoryDetails | undefined;
  const items = Array.isArray(category?.items) ? category.items : [];
  const variations = Array.isArray(category?.variations)
    ? category.variations
    : [];
  const modifierGroups = Array.isArray(category?.modifierGroups)
    ? category.modifierGroups
    : [];
  const children = Array.isArray(category?.children) ? category.children : [];
  const itemCount = category?._count?.items ?? items.length;
  const childrenCount = category?._count?.children ?? children.length;

  if (isLoading) {
    return (
      <Container>
        <PageHeader title={t("title")} description={t("description")} />
        <StatePanel
          state="loading"
          title={commonT("feedback.loading", { subject: t("title") })}
          description={commonT("feedback.loadingDescription")}
        />
      </Container>
    );
  }

  if (!category?.id) {
    return (
      <Container>
        <PageHeader title={t("title")} description={t("description")} />
        <StatePanel
          state="empty"
          title={t("notFound")}
          description={t("description")}
          action={
            <Button type="button" variant="outline" onClick={() => router.back()}>
              <ArrowLeft aria-hidden="true" />
              {commonT("back")}
            </Button>
          }
        />
      </Container>
    );
  }

  const overviewItems = [
    {
      id: "slug",
      icon: <Tags aria-hidden="true" />,
      label: t("categorySlug"),
      value: category.slug || t("notConfigured"),
    },
    {
      id: "hierarchy",
      icon: <ListTree aria-hidden="true" />,
      label: t("hierarchy"),
      value: category.parent?.name
        ? t("childOf", { name: category.parent.name })
        : childrenCount > 0
          ? t("childCategories", { count: childrenCount })
          : t("topLevelCategory"),
    },
    {
      id: "priority",
      icon: <SlidersHorizontal aria-hidden="true" />,
      label: t("displayPriority"),
      value: getPriorityLabel(category.sortOrder, t),
    },
    {
      id: "availability",
      icon: <CheckCircle2 aria-hidden="true" />,
      label: t("availability"),
      value: category.isActive ? t("visibleToCustomers") : t("hidden"),
    },
    {
      id: "created",
      icon: <CalendarDays aria-hidden="true" />,
      label: commonT("createdAt"),
      value: formatDate(category.createdAt),
    },
    {
      id: "updated",
      icon: <Clock aria-hidden="true" />,
      label: commonT("updatedAt"),
      value: formatDate(category.updatedAt),
    },
  ];

  return (
    <Container>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button type="button" variant="outline" onClick={() => router.back()}>
            <ArrowLeft aria-hidden="true" />
            {commonT("back")}
          </Button>
        }
      />

      <DetailLayout
        summary={
          <DetailPanel padding="none" className="overflow-hidden">
            <div className="relative min-h-64 bg-[var(--ui-surface-subtle)]">
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt={category.name || t("imageAlt")}
                  fill
                  unoptimized
                  sizes="(max-width: 1280px) 100vw, 1200px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-64 items-center justify-center">
                  <Package aria-hidden="true" className="size-14 text-[var(--ui-text-subtle)]" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <StatusBadge tone={category.isActive ? "success" : "neutral"}>
                    {category.isActive ? commonT("active") : commonT("inactive")}
                  </StatusBadge>
                  <StatusBadge className="border-white/25 bg-white/15 text-white">
                    /{category.slug || t("noSlug")}
                  </StatusBadge>
                </div>
                <h2 className="text-2xl font-semibold sm:text-3xl">
                  {category.name || t("unnamedCategory")}
                </h2>
                <p className="mt-2 max-w-[760px] text-sm text-white/90">
                  {category.description || t("noDescriptionAvailable")}
                </p>
              </div>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4 sm:p-5">
              <PromotionStatCard
                icon={<Package aria-hidden="true" />}
                label={t("menuItems")}
                value={itemCount}
              />
              <PromotionStatCard
                icon={<SlidersHorizontal aria-hidden="true" />}
                label={t("variations")}
                value={variations.length}
              />
              <PromotionStatCard
                icon={<Layers aria-hidden="true" />}
                label={t("modifierGroups")}
                value={modifierGroups.length}
              />
              <PromotionStatCard
                icon={<ListTree aria-hidden="true" />}
                label={t("subCategories")}
                value={childrenCount}
              />
            </div>
          </DetailPanel>
        }
        aside={
          <>
            <DetailPanel title={t("overview")}>
              <InfoList items={overviewItems} columns={1} />
            </DetailPanel>

            <DetailPanel title={t("menuItems")}>
              {items.length === 0 ? (
                <StatePanel
                  compact
                  state="empty"
                  title={t("emptyMenuItems")}
                  description=""
                />
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex min-w-0 items-center gap-3 rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] p-3"
                    >
                      <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[var(--ui-radius-control)] bg-[var(--ui-surface-subtle)]">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name || t("unnamedItem")}
                            fill
                            unoptimized
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          <Utensils aria-hidden="true" className="size-4 text-[var(--ui-text-subtle)]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--ui-text)]">
                          {item.name || t("unnamedItem")}
                        </p>
                        <p className="truncate text-xs text-[var(--ui-text-muted)]">
                          /{item.slug || t("noSlug")}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-[var(--ui-text)]">
                          {formatPrice(item.basePrice)}
                        </p>
                        <StatusBadge
                          size="sm"
                          tone={item.isActive ? "success" : "neutral"}
                        >
                          {item.isActive ? commonT("active") : commonT("inactive")}
                        </StatusBadge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DetailPanel>
          </>
        }
      >
        <DetailPanel title={t("variations")}>
          {variations.length === 0 ? (
            <StatePanel compact state="empty" title={t("emptyVariations")} description="" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {variations.map((variation) => (
                <div
                  key={variation.id}
                  className="rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-[var(--ui-text)]">
                        {variation.name || t("unnamedVariation")}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--ui-text-muted)]">
                        {variation.description || commonT("noData")}
                      </p>
                    </div>
                    <StatusBadge
                      size="sm"
                      tone={variation.isActive ? "success" : "neutral"}
                    >
                      {variation.isActive ? commonT("active") : commonT("inactive")}
                    </StatusBadge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MiniMetric label={t("basePrice")} value={formatPrice(variation.price)} />
                    <MiniMetric
                      label={t("priority")}
                      value={getPriorityLabel(variation.sortOrder, t)}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {variation.isDefault ? (
                      <StatusBadge tone="info" size="sm">
                        {t("defaultVariation")}
                      </StatusBadge>
                    ) : null}
                    <StatusBadge size="sm">
                      {t("sku")}: {variation.sku || t("notAvailable")}
                    </StatusBadge>
                    <StatusBadge size="sm">
                      {t("itemOverrides")}: {variation.itemPriceOverrides?.length ?? 0}
                    </StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DetailPanel>

        <DetailPanel title={t("modifierGroups")}>
          {modifierGroups.length === 0 ? (
            <StatePanel compact state="empty" title={t("emptyModifierGroups")} description="" />
          ) : (
            <div className="space-y-4">
              {modifierGroups.map((group) => (
                <div
                  key={group.id}
                  className="rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-[var(--ui-text)]">
                        {group.name || t("unnamedGroup")}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
                        {group.description || commonT("noData")}
                      </p>
                    </div>
                    <StatusBadge
                      size="sm"
                      tone={Number(group.minSelect ?? 0) > 0 ? "info" : "neutral"}
                    >
                      {Number(group.minSelect ?? 0) > 0
                        ? t("required")
                        : commonT("optional")}
                    </StatusBadge>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MiniMetric label={t("minSelect")} value={Number(group.minSelect ?? 0)} />
                    <MiniMetric label={t("maxSelect")} value={Number(group.maxSelect ?? 0)} />
                    <MiniMetric label={t("selectionType")} value={group.selectionType || "MULTIPLE"} />
                    <MiniMetric label={t("modifiers")} value={group.modifiers?.length ?? 0} />
                  </div>
                  {group.modifiers?.length ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {group.modifiers.map((modifier) => (
                        <div
                          key={modifier.id}
                          className="rounded-[var(--ui-radius-control)] bg-[var(--ui-surface-subtle)] px-3 py-2"
                        >
                          <p className="text-sm font-medium text-[var(--ui-text)]">
                            {modifier.name || t("unnamedModifier")}
                          </p>
                          <p className="text-xs text-[var(--ui-text-muted)]">
                            {t("priceDelta")}: {formatPrice(modifier.priceDelta)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <StatePanel
                      compact
                      state="empty"
                      title={t("noModifiersInsideGroup")}
                      description=""
                      className="mt-4"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </DetailPanel>
      </DetailLayout>
    </Container>
  );
}

function MiniMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[var(--ui-radius-control)] bg-[var(--ui-surface-subtle)] p-3">
      <p className="text-xs text-[var(--ui-text-subtle)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--ui-text)]">{value}</p>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDateTime24({ value: date });
}

function formatPrice(value: unknown) {
  const amount = Number(value ?? 0);
  if (Number.isNaN(amount)) return "0";
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function getPriorityLabel(
  value: unknown,
  t: ReturnType<typeof useTranslations>,
) {
  const order = Number(value ?? 0);
  if (order === 0) return t("topPriority");
  if (order <= 10) return t("highPriority");
  if (order <= 50) return t("mediumPriority");
  return t("lowPriority");
}
