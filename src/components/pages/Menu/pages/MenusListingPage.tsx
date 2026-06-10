"use client";

import Container from "@/components/common/Container";
import Categories from "@/components/pages/Menu/legacy/root-menu-components/listing/categories";
import Header from "@/components/pages/Menu/legacy/root-menu-components/listing/header";
import ItemList from "@/components/pages/Menu/legacy/root-menu-components/listing/itemList";
import { cn } from "@/lib/utils";
import type { MenuTimingConfig, MenuTimingDay } from "@/services/menus";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Layers3,
  PackageCheck,
  ReceiptText,
  Sparkles,
  Tag,
  Utensils,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useGetMenuById, useGetMenuItems } from "@/hooks/useMenus";
import { useTranslations } from "next-intl";

type MenuCategorySummary = {
  id: string;
  name?: string | null;
  slug?: string | null;
  imageUrl?: string | null;
  isActive?: boolean | null;
};

type MenuCategoryLink = {
  id: string;
  sortOrder?: number | null;
  menuCategory?: MenuCategorySummary | null;
};

type MenuVariation = {
  id: string;
  name?: string | null;
  price?: number | string | null;
  pickupPrice?: number | string | null;
  displayText?: string | null;
  isDefault?: boolean | null;
  isActive?: boolean | null;
};

type MenuModifier = {
  id: string;
  name?: string | null;
  description?: string | null;
  priceDelta?: number | string | null;
  isRequired?: boolean | null;
};

type MenuItemSummary = {
  id: string;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  sku?: string | null;
  basePrice?: number | string | null;
  depositAmount?: number | string | null;
  prepTimeMinutes?: number | null;
  isActive?: boolean | null;
  dietaryFlags?: string[] | null;
  supportsSplitPizza?: boolean | null;
  category?: MenuCategorySummary | null;
  variations?: MenuVariation[] | null;
  modifiers?: MenuModifier[] | null;
};

type MenuItemLink = {
  id: string;
  sortOrder?: number | null;
  isActive?: boolean | null;
  menuItem?: MenuItemSummary | null;
};

type MenuDetail = {
  id: string;
  restaurantId?: string | null;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  isTimed?: boolean | null;
  timingConfig?: MenuTimingConfig | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
  deletedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  categories?: MenuCategoryLink[] | null;
  items?: MenuItemLink[] | null;
};

const dayOrder: MenuTimingDay[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const FALLBACK_IMAGE = "/burgerTwo.jpg";

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMoney = (value?: number | string | null) => {
  const amount = toNumber(value, 0);

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getImageUrl = (value?: string | null) => {
  if (typeof value === "string" && value.trim().startsWith("http")) {
    return value.trim();
  }

  return FALLBACK_IMAGE;
};

const getMenuItemPrice = (item?: MenuItemSummary | null) => {
  const defaultVariation = item?.variations?.find((variation) => variation.isDefault) || item?.variations?.[0];
  return defaultVariation?.price ?? item?.basePrice ?? 0;
};

const normalizeItemLinks = (menu?: MenuDetail) => {
  return (menu?.items || [])
    .map((link) => link.menuItem)
    .filter((item): item is MenuItemSummary => Boolean(item?.id));
};

export default function MenusListingPage() {
  const t = useTranslations("menu.listing");
  const [editing, setEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user } = useAuth();

  const searchParams = useSearchParams();
  const menuId = searchParams.get("id");

  const handleManageClick = () => {
    setEditing((prev) => !prev);
  };

  const restaurantId = user?.restaurantId;
  const {
    data: menuResponse,
    isLoading: isMenuLoading,
    isError: isMenuError,
  } = useGetMenuById(menuId || undefined);
  const menu = menuResponse?.data as MenuDetail | undefined;
  const { data: itemsResponse, isLoading, isFetching, refetch } = useGetMenuItems({
    restaurantId: restaurantId || undefined,
    menuId: menuId || undefined,
    categoryId: selectedCategory || undefined,
  });

  const detailItems = normalizeItemLinks(menu).filter((item) => (
    selectedCategory ? item.category?.id === selectedCategory : true
  ));
  const items = detailItems.length ? detailItems : itemsResponse?.data || [];
  const loading = isLoading || isFetching;
  return (
    <Container className="space-y-6">
      <Header
        title={menu?.name || t("title")}
        description={menu?.description || t("description")}
        editing={editing}
        onManageClick={handleManageClick}
      />

      <MenuDetailOverview
        menu={menu}
        loading={isMenuLoading}
        isError={isMenuError || !menuId}
        t={t}
      />

      <AttachedCategories menu={menu} loading={isMenuLoading} t={t} />

      <AttachedMenuItems
        items={detailItems}
        loading={isMenuLoading}
        t={t}
      />

      <Categories
        editing={editing}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <ItemList
        editing={editing}
        items={items}
        loading={loading}
         refetch={refetch} 
      />
    </Container>
  );
}

function MenuDetailOverview({
  menu,
  loading,
  isError,
  t,
}: {
  menu?: MenuDetail;
  loading: boolean;
  isError: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const windows = menu?.timingConfig?.windows || [];

  if (loading) {
    return (
      <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
        <div className="h-8 w-56 animate-pulse rounded-full bg-gray-100" />
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-[18px] bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !menu) {
    return (
      <div className="rounded-[24px] border border-dashed border-gray-200 bg-white p-8 text-center">
        <ReceiptText className="mx-auto text-gray-400" size={28} />
        <p className="mt-3 text-base font-semibold text-gray-950">{t("detailUnavailableTitle")}</p>
        <p className="mt-1 text-sm text-gray-500">{t("detailUnavailableDescription")}</p>
      </div>
    );
  }

  const statusTone = menu.isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-gray-100 text-gray-600 ring-gray-200";
  const timedTone = menu.isTimed ? "bg-primary/10 text-primary ring-primary/10" : "bg-gray-100 text-gray-600 ring-gray-200";

  return (
    <section className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <div className="border-b border-gray-100 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 p-5 text-white md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full px-3 py-1 text-xs font-bold ring-1", statusTone)}>
                {menu.isActive ? t("active") : t("inactive")}
              </span>
              <span className={cn("rounded-full px-3 py-1 text-xs font-bold ring-1", timedTone)}>
                {menu.isTimed ? t("timed") : t("standard")}
              </span>
              {menu.deletedAt ? (
                <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-100 ring-1 ring-red-300/20">
                  {t("deleted")}
                </span>
              ) : null}
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] md:text-4xl">
              {menu.name || t("unnamedMenu")}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
              {menu.description || t("noDescription")}
            </p>
          </div>

          <div className="grid min-w-0 gap-2 text-sm lg:min-w-[260px]">
            <MetaPill label={t("menuId")} value={menu.id} invert />
            <MetaPill label={t("slug")} value={menu.slug || "—"} invert />
            <MetaPill label={t("sortOrder")} value={String(menu.sortOrder ?? 0)} invert />
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-5 md:grid-cols-4 md:p-6">
        <Metric icon={Layers3} label={t("linkedCategories")} value={String(menu.categories?.length || 0)} />
        <Metric icon={Utensils} label={t("attachedItems")} value={String(menu.items?.length || 0)} />
        <Metric icon={CalendarClock} label={t("scheduleWindows")} value={String(windows.length)} />
        <Metric icon={Clock3} label={t("timezone")} value={menu.timingConfig?.timezone || "Asia/Karachi"} />
      </div>

      <div className="grid gap-4 border-t border-gray-100 p-5 md:grid-cols-[1.2fr_0.8fr] md:p-6">
        <SchedulePanel menu={menu} t={t} />
        <div className="rounded-[20px] border border-gray-100 bg-gray-50 p-4">
          <p className="text-sm font-bold text-gray-950">{t("auditTrail")}</p>
          <div className="mt-3 grid gap-3">
            <MetaPill label={t("createdAt")} value={formatDateTime(menu.createdAt)} />
            <MetaPill label={t("updatedAt")} value={formatDateTime(menu.updatedAt)} />
            <MetaPill label={t("restaurantId")} value={menu.restaurantId || "—"} />
          </div>
        </div>
      </div>
    </section>
  );
}

function SchedulePanel({
  menu,
  t,
}: {
  menu: MenuDetail;
  t: ReturnType<typeof useTranslations>;
}) {
  const windows = menu.timingConfig?.windows || [];

  return (
    <div className="rounded-[20px] border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-950">{t("schedule")}</p>
          <p className="mt-1 text-xs text-gray-500">
            {menu.isTimed ? t("timedScheduleDescription") : t("standardScheduleDescription")}
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-700 ring-1 ring-gray-200">
          {menu.timingConfig?.timezone || "Asia/Karachi"}
        </span>
      </div>

      {menu.isTimed && windows.length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {dayOrder.map((day) => {
            const dayWindows = windows.filter((window) => window.day === day);
            if (!dayWindows.length) return null;

            return (
              <div key={day} className="rounded-[16px] border border-gray-100 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  {t(`days.${day}`)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {dayWindows.map((window, index) => (
                    <span key={`${day}-${window.start}-${window.end}-${index}`} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      {window.start} - {window.end}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-[16px] border border-dashed border-gray-200 bg-white px-4 py-5 text-center">
          <CalendarClock className="mx-auto text-gray-400" size={24} />
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {menu.isTimed ? t("noScheduleWindows") : t("alwaysAvailable")}
          </p>
        </div>
      )}
    </div>
  );
}

function AttachedCategories({
  menu,
  loading,
  t,
}: {
  menu?: MenuDetail;
  loading: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const categories = menu?.categories || [];

  return (
    <section className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.02em] text-gray-950">{t("attachedCategories")}</h2>
          <p className="mt-1 text-sm text-gray-500">{t("attachedCategoriesDescription")}</p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
          {categories.length}
        </span>
      </div>

      {loading ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-14 w-40 animate-pulse rounded-[16px] bg-gray-100" />
          ))}
        </div>
      ) : categories.length ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {categories.map((link) => (
            <div key={link.id} className="flex min-w-0 items-center gap-3 rounded-[16px] border border-gray-100 bg-gray-50 px-3 py-2">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-[12px] bg-white">
                <Image
                  src={getImageUrl(link.menuCategory?.imageUrl)}
                  alt={link.menuCategory?.name || t("categoryFallback")}
                  fill
                  sizes="40px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-950">
                  {link.menuCategory?.name || t("categoryFallback")}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {link.menuCategory?.slug || t("sortOrderValue", { value: link.sortOrder ?? 0 })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-[16px] border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-sm font-medium text-gray-500">
          {t("noAttachedCategories")}
        </p>
      )}
    </section>
  );
}

function AttachedMenuItems({
  items,
  loading,
  t,
}: {
  items: MenuItemSummary[];
  loading: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <section className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.02em] text-gray-950">{t("attachedMenuItems")}</h2>
          <p className="mt-1 text-sm text-gray-500">{t("attachedMenuItemsDescription")}</p>
        </div>
        <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          {t("itemsCount", { count: items.length })}
        </span>
      </div>

      {loading ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-[22px] bg-gray-100" />
          ))}
        </div>
      ) : items.length ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <EnrichedItemCard key={item.id} item={item} t={t} />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-[16px] border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-sm font-medium text-gray-500">
          {t("noAttachedItems")}
        </p>
      )}
    </section>
  );
}

function EnrichedItemCard({
  item,
  t,
}: {
  item: MenuItemSummary;
  t: ReturnType<typeof useTranslations>;
}) {
  const variations = item.variations || [];
  const modifiers = item.modifiers || [];

  return (
    <article className="overflow-hidden rounded-[22px] border border-gray-100 bg-gray-50">
      <div className="relative h-40 bg-gray-100">
        <Image
          src={getImageUrl(item.imageUrl)}
          alt={item.name || t("itemFallback")}
          fill
          sizes="(max-width: 768px) 100vw, 360px"
          className="object-cover"
          unoptimized
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <StatusBadge active={item.isActive} t={t} />
          {item.supportsSplitPizza ? (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-gray-900 backdrop-blur">
              {t("splitPizza")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold uppercase tracking-wide text-primary">
              {item.category?.name || t("categoryFallback")}
            </p>
            <h3 className="mt-1 line-clamp-2 text-lg font-black tracking-[-0.03em] text-gray-950">
              {item.name || t("itemFallback")}
            </h3>
          </div>
          <p className="shrink-0 text-lg font-black tracking-[-0.04em] text-gray-950">
            {formatMoney(getMenuItemPrice(item))}
          </p>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-500">
          {item.description || t("noDescription")}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <MiniFact icon={Tag} label={t("sku")} value={item.sku || "—"} />
          <MiniFact icon={Clock3} label={t("prepTime")} value={item.prepTimeMinutes ? `${item.prepTimeMinutes} min` : "—"} />
          <MiniFact icon={PackageCheck} label={t("deposit")} value={formatMoney(item.depositAmount)} />
          <MiniFact icon={Sparkles} label={t("dietary")} value={item.dietaryFlags?.join(", ") || "—"} />
        </div>

        <div className="mt-4 space-y-3">
          <ChipGroup
            title={t("variations")}
            empty={t("noVariations")}
            values={variations.map((variation) => `${variation.name || t("variationFallback")} · ${formatMoney(variation.price)}`)}
          />
          <ChipGroup
            title={t("modifiers")}
            empty={t("noModifiers")}
            values={modifiers.map((modifier) => `${modifier.name || t("modifierFallback")} · ${formatMoney(modifier.priceDelta)}`)}
          />
        </div>
      </div>
    </article>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-gray-100 bg-gray-50 p-4">
      <Icon className="text-primary" size={20} />
      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 truncate text-lg font-black tracking-[-0.03em] text-gray-950">{value}</p>
    </div>
  );
}

function MetaPill({
  label,
  value,
  invert,
}: {
  label: string;
  value: string;
  invert?: boolean;
}) {
  return (
    <div className={cn(
      "min-w-0 rounded-[14px] px-3 py-2",
      invert ? "bg-white/10 text-white ring-1 ring-white/10" : "bg-white text-gray-950 ring-1 ring-gray-100"
    )}>
      <p className={cn("text-[10px] font-bold uppercase tracking-wide", invert ? "text-white/50" : "text-gray-400")}>
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({
  active,
  t,
}: {
  active?: boolean | null;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur",
      active ? "bg-emerald-50/95 text-emerald-700" : "bg-red-50/95 text-red-700"
    )}>
      {active ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {active ? t("active") : t("inactive")}
    </span>
  );
}

function MiniFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Tag;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[14px] bg-white p-3 ring-1 ring-gray-100">
      <Icon className="text-gray-400" size={15} />
      <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 truncate text-xs font-bold text-gray-950">{value}</p>
    </div>
  );
}

function ChipGroup({
  title,
  values,
  empty,
}: {
  title: string;
  values: string[];
  empty: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.length ? (
          values.slice(0, 4).map((value) => (
            <span key={value} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-gray-700 ring-1 ring-gray-100">
              {value}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-gray-400 ring-1 ring-gray-100">
            {empty}
          </span>
        )}
      </div>
    </div>
  );
}
