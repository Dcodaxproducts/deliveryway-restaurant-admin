"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import SortableHeader from "@/components/common/sortable-head";
import EmptyState from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/status-badge";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import PaginationSection from "@/components/common/PaginationSection";
import { toast } from "sonner";
import { useDeleteAdminHappyHour } from "@/hooks/usePromotions";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/errors";

type HappyHour = {
  id: string;
  code?: string;
  title?: string;
  description?: string;
  kind?: string;
  status?: string;
  discountType?: string;
  discountValue?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  maxUses?: number;
  maxUsesPerCustomer?: number;
  usedCount?: number;
  startsAt?: string;
  expiresAt?: string;
  activeDays?: number[];
  dailyStartTime?: string;
  dailyEndTime?: string;
  isActive?: boolean;
  branch?: {
    id?: string;
    name?: string;
  } | null;
  restaurant?: {
    id?: string;
    name?: string;
  };
  scopeMenuItem?: {
    id?: string;
    name?: string;
  } | null;
  scopeCategory?: {
    id?: string;
    name?: string;
  } | null;
};

type Props = {
  happyHours: HappyHour[];
  loading?: boolean;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  onPageChange: (page: number) => void;
};

const formatDiscount = (item: HappyHour) => {
  const value = Number(item.discountValue ?? 0);

  if (item.discountType === "PERCENTAGE") return `${value}%`;
  if (item.discountType === "FLAT") return `${value}`;

  return value;
};

const formatDate = (value: string | undefined, notAvailable: string) => {
  if (!value) return notAvailable;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return notAvailable;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const formatActiveDays = (
  days: number[] | undefined,
  labels: { notAvailable: string; everyDay: string; dayMap: Record<number, string> }
) => {
  if (!Array.isArray(days) || days.length === 0) return labels.notAvailable;

  if (days.length === 7) return labels.everyDay;

  return days.map((day) => labels.dayMap[day] ?? day).join(", ");
};

const getScopeText = (
  item: HappyHour,
  labels: { item: string; category: string; allItems: string }
) => {
  if (item.scopeMenuItem?.name) return `${labels.item}: ${item.scopeMenuItem.name}`;
  if (item.scopeCategory?.name) return `${labels.category}: ${item.scopeCategory.name}`;

  return labels.allItems;
};

const getStatusTone = (status?: string) => {
  switch (status) {
    case "ACTIVE":
      return "success" as const;
    case "SCHEDULED":
      return "warning" as const;
    case "EXPIRED":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
};

const TableSkeleton = () => {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <TableRow key={index} className="border-none h-[72px]">
          {Array.from({ length: 9 }).map((__, cellIndex) => (
            <TableCell key={cellIndex} className="px-4">
              <div className="h-4 w-full max-w-[120px] rounded bg-gray-200 animate-pulse" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};

const HappyHoursTable = ({
  happyHours,
  loading = false,
  meta,
  onPageChange,
}: Props) => {
  const t = useTranslations("promotions");
  const router = useRouter();
  const { user, restaurantId } = useAuth();

  const branchId = user?.branchId ?? null;

  const deleteMutation = useDeleteAdminHappyHour();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const hasData = happyHours && happyHours.length > 0;
  const dayMap: Record<number, string> = {
    0: t("days.shortSunday"),
    1: t("days.shortMonday"),
    2: t("days.shortTuesday"),
    3: t("days.shortWednesday"),
    4: t("days.shortThursday"),
    5: t("days.shortFriday"),
    6: t("days.shortSaturday"),
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({
        id,
        restaurantId,
        branchId,
      });

      toast.success(t("toasts.happyHourDeleted"));
      setOpenMenuId(null);
      setMenuPosition(null);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, t("toasts.failedDeleteHappyHour")));
    }
  };

  if (!loading && !hasData) {
    return (
      <div className="p-5">
        <EmptyState
          title={t("emptyHappyHoursTitle")}
          description={t("emptyHappyHoursDescription")}
        />
      </div>
    );
  }

  return (
    <>
      <div className="relative hidden overflow-x-auto md:block">
        <Table className="relative">
          <TableHeader>
            <TableRow className="border-none">
              <SortableHeader label={t("columns.sl")} />
              <SortableHeader label={t("columns.nameAndCode")} />
              <SortableHeader label={t("columns.discount")} />
              <SortableHeader label={t("columns.time")} />
              <SortableHeader label={t("columns.days")} />
              <SortableHeader label={t("columns.scope")} />
              <SortableHeader label={t("columns.branch")} />
              <SortableHeader label={t("columns.usage")} />
              <SortableHeader label={t("columns.status")} />
              <TableHead className="text-center font-bold">{t("columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableSkeleton />
            ) : (
              happyHours.map((item, index) => (
                <TableRow key={item.id} className="h-[72px] border-b border-[var(--ui-border)] last:border-b-0">
                  <TableCell className="px-4">
                    {(meta.page - 1) * meta.limit + index + 1}
                  </TableCell>

                  <TableCell className="px-4">
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-gray-500 text-sm">{t("labels.code")}: {item.code}</p>
                    <p className="text-gray-400 text-xs">
                      {formatDate(item.startsAt, t("labels.notAvailable"))} - {formatDate(item.expiresAt, t("labels.notAvailable"))}
                    </p>
                  </TableCell>

                  <TableCell className="px-4">
                    <p className="text-sm font-medium">
                      {formatDiscount(item)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t("labels.type")}: {item.discountType ?? t("labels.notAvailable")}
                    </p>
                  </TableCell>

                  <TableCell className="px-4 text-sm text-gray-500">
                    {item.dailyStartTime ?? t("labels.notAvailable")} -{" "}
                    {item.dailyEndTime ?? t("labels.notAvailable")}
                  </TableCell>

                  <TableCell className="px-4 text-sm text-gray-500">
                    {formatActiveDays(item.activeDays, {
                      notAvailable: t("labels.notAvailable"),
                      everyDay: t("labels.everyDay"),
                      dayMap,
                    })}
                  </TableCell>

                  <TableCell className="px-4 text-sm text-gray-500">
                    {getScopeText(item, {
                      item: t("labels.item"),
                      category: t("labels.category"),
                      allItems: t("labels.allItems"),
                    })}
                  </TableCell>

                  <TableCell className="px-4 text-sm text-gray-500">
                    {item.branch?.name ?? t("labels.allBranches")}
                  </TableCell>

                  <TableCell className="px-4 text-sm text-gray-500">
                    {item.usedCount ?? 0} / {item.maxUses ?? t("labels.unlimited")}
                  </TableCell>

                  <TableCell className="px-4">
                    <StatusBadge tone={getStatusTone(item.status)}>
                      {item.status ?? t("labels.notAvailable")}
                    </StatusBadge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("columns.actions")}
                        onClick={(event) => {
                          const rect = event.currentTarget.getBoundingClientRect();

                          setOpenMenuId((previousId) => {
                            const nextId = previousId === item.id ? null : item.id;
                            setMenuPosition(
                              nextId
                                ? {
                                    top: rect.bottom + 8,
                                    left: Math.max(12, rect.right - 150),
                                  }
                                : null,
                            );
                            return nextId;
                          });
                        }}
                      >
                        <MoreHorizontal aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {openMenuId && menuPosition ? (
        <div
          className="fixed z-[var(--ui-layer-popover)] w-[150px] rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-2 shadow-[var(--ui-shadow-sm)]"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start"
            onClick={() =>
              router.push(`/promotion-management/happy-hour/add?id=${openMenuId}`)
            }
          >
            <Edit aria-hidden="true" />
            {t("actions.edit")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={deleteMutation.isPending}
            onClick={() => handleDelete(openMenuId)}
            className="w-full justify-start text-[var(--ui-danger)] hover:bg-[var(--ui-danger-soft)] hover:text-[var(--ui-danger)]"
          >
            <Trash2 aria-hidden="true" />
            {t("actions.delete")}
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 p-3 md:hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-[14px] p-4 border border-[#EDEFF2] space-y-3"
              >
                <div className="h-5 w-40 rounded bg-gray-200 animate-pulse" />
                <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
                <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
              </div>
            ))
          : happyHours.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{item.title}</p>
                </div>

                <p className="text-gray-500 text-sm">{t("labels.code")}: {item.code}</p>

                <div className="text-gray-600 text-sm space-y-1">
                  <p>{t("labels.discount")}: {formatDiscount(item)}</p>
                  <p>
                    {t("columns.time")}: {item.dailyStartTime ?? t("labels.notAvailable")} -{" "}
                    {item.dailyEndTime ?? t("labels.notAvailable")}
                  </p>
                  <p>{t("columns.days")}: {formatActiveDays(item.activeDays, {
                    notAvailable: t("labels.notAvailable"),
                    everyDay: t("labels.everyDay"),
                    dayMap,
                  })}</p>
                  <p>{t("columns.scope")}: {getScopeText(item, {
                    item: t("labels.item"),
                    category: t("labels.category"),
                    allItems: t("labels.allItems"),
                  })}</p>
                  <p>{t("columns.branch")}: {item.branch?.name ?? t("labels.allBranches")}</p>
                  <p>
                    {t("columns.usage")}: {item.usedCount ?? 0} /{" "}
                    {item.maxUses ?? t("labels.unlimited")}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <StatusBadge tone={getStatusTone(item.status)}>
                    {item.status ?? t("labels.notAvailable")}
                  </StatusBadge>

                  <div className="flex items-center gap-2">
                    <Switch checked={Boolean(item.isActive)} disabled />

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/promotion-management/happy-hour/add?id=${item.id}`
                        )
                      }
                      className="p-2 hover:text-black"
                    >
                      <Edit size={17} />
                    </button>

                    <button
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-500 hover:text-red-700 disabled:opacity-60"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
      </div>

      <div className="border-t border-[var(--ui-border)] p-4">
        <PaginationSection
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={meta.limit}
          hasNext={meta.hasNext}
          hasPrevious={meta.hasPrevious}
          onPageChange={onPageChange}
        />
      </div>
    </>
  );
};

export default HappyHoursTable;
