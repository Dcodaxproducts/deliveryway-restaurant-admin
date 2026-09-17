"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import SortableHeader from "@/components/common/sortable-head";
import EmptyState from "@/components/common/EmptyState";
import PromotionCreateLink from "../PromotionOverview/PromotionCreateLink";
import PaginationSection from "@/components/common/PaginationSection";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useDeleteCoupon,
  useGetCoupons,
  useToggleCouponStatus,
} from "@/hooks/usePromotions";
import { useRouter } from "next/navigation";
import DeleteDialog from "@/components/common/dialogs/delete-dialog";
import {
  getString,
  isRecord,
  normalizeApiRecords,
} from "@/components/pages/Promotions/utils/option-normalizers";
import { ResponsiveDialog } from "@/components/common/ResponsiveDialog";
import { Button } from "@/components/ui/button";

type Coupon = {
  id: string;
  code: string;
  title?: string;
  branchId?: string;
  discountType?: string;
  discountValue?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  maxUsesPerCustomer?: number;
  usedCount?: number;
  isActive?: boolean;
};

type CouponsPaginationMeta = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
};

const toNumber = (value: unknown, fallback: number) => {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

const toPaginationMeta = (value: unknown): CouponsPaginationMeta | null => {
  if (!isRecord(value)) return null;
  return {
    page: toNumber(value.page, 1),
    totalPages: toNumber(value.totalPages, 1),
    total: toNumber(value.total, 0),
    limit: toNumber(value.limit, 10),
  };
};

const toCoupon = (record: Record<string, unknown>): Coupon | null => {
  const id = getString(record, "id");
  const code = getString(record, "code");
  if (!id || !code) return null;

  return {
    id,
    code,
    title: getString(record, "title"),
    branchId: getString(record, "branchId"),
    discountType: getString(record, "discountType"),
    discountValue: typeof record.discountValue === "number" ? record.discountValue : undefined,
    maxDiscountAmount: typeof record.maxDiscountAmount === "number" ? record.maxDiscountAmount : undefined,
    minOrderAmount: typeof record.minOrderAmount === "number" ? record.minOrderAmount : undefined,
    maxUsesPerCustomer: typeof record.maxUsesPerCustomer === "number" ? record.maxUsesPerCustomer : undefined,
    usedCount: typeof record.usedCount === "number" ? record.usedCount : undefined,
    isActive: Boolean(record.isActive),
  };
};

const CouponsTable = () => {
  const t = useTranslations("promotions");
  const commonT = useTranslations("common");
  const { restaurantId } = useAuth();
  const toggleCouponStatusMutation = useToggleCouponStatus();
  const deleteCouponMutation = useDeleteCoupon();
  const router = useRouter();

  const [page, setPage] = useState(1);

  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [openView, setOpenView] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  const {
    data: couponsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetCoupons({
    restaurantId: restaurantId || undefined,
    page,
    limit: 10,
  });

  const coupons = normalizeApiRecords(couponsResponse).map(toCoupon).filter((coupon): coupon is Coupon => Boolean(coupon));
  const meta = isRecord(couponsResponse) ? toPaginationMeta(couponsResponse.meta) : null;



  const toggleStatus = async (coupon: Coupon) => {
    if (!restaurantId) return;

    await toggleCouponStatusMutation.mutateAsync({
      code: coupon.code,
      isActive: coupon.isActive,
      restaurantId,
    });
    refetch();
  };

  const getSerial = (index: number) => {
    const currentPage = meta?.page || page || 1;
    const limit = meta?.limit || 10;
    return (currentPage - 1) * limit + index + 1;
  };

  if (isLoading || (isFetching && !coupons.length)) {
    return <EmptyState state="loading" title={commonT("loading")} description="" />;
  }

  if (error) {
    return <EmptyState state="error" title={commonT("unableToLoad")} description="" />;
  }

  if (!coupons.length) {
    return (
      <>
        <EmptyState
          title={t("emptyCouponsTitle")}
          description={t("emptyCouponsDescription")}
        />
        <PromotionCreateLink
          label={t("createNewCoupon")}
          href="/promotion-management/coupons/add"
        />
      </>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-none">
              <TableHead className="w-[40px]"><Checkbox /></TableHead>
              <SortableHeader label={t("columns.sl")} />
              <SortableHeader label={t("columns.couponCode")} />
              <SortableHeader label={t("columns.couponInfo")} />
              <SortableHeader label={t("columns.branch")} />
              <SortableHeader label={t("columns.totalUsage")} />
              <SortableHeader label={t("columns.status")} />
              <TableHead className="text-center">{t("columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {coupons.map((c, i) => (
              <TableRow key={c.id} className="border-none h-[72px]">

                <TableCell><Checkbox /></TableCell>

                <TableCell>{getSerial(i)}</TableCell>

                <TableCell>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-gray-500 text-sm">{t("labels.code")}: {c.code}</p>
                </TableCell>

                <TableCell>
                  <div className="text-sm text-gray-600">
                    <p>{t("labels.perUser")}: {c.maxUsesPerCustomer}</p>
                    <p>{t("labels.amount")}: {c.discountValue}</p>
                    <p>{t("labels.type")}: {c.discountType}</p>
                  </div>
                </TableCell>

                <TableCell className="text-sm">{c.branchId}</TableCell>

                <TableCell>{c.usedCount}</TableCell>

                <TableCell>
                  <Switch
                    checked={c.isActive}
                    disabled={!restaurantId || toggleCouponStatusMutation.isPending}
                    onCheckedChange={() => toggleStatus(c)}
                  />
                </TableCell>

                <TableCell>
                  <div className="flex justify-center gap-2 relative">

                    <button
                      onClick={() => {
                        setSelectedCoupon(c);
                        setOpenView(true);
                      }}
                    >
                      <Eye size={18} />
                    </button>

                    <button
                      onClick={() =>
                        setDropdownOpen(dropdownOpen === c.id ? null : c.id)
                      }
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {dropdownOpen === c.id && (
                      <div className="absolute right-0 top-8 bg-white border rounded-md shadow-md w-32 z-50">
                        <button
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 w-full"
                          onClick={() =>
                            router.push(`/promotion-management/coupons/add?coupon=${c.code}`)
                          }
                        >
                          <Pencil size={14} /> {t("actions.edit")}
                        </button>
                        <button
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setDeleteTarget(c);
                            setDropdownOpen(null);
                          }}
                        >
                          <Trash2 size={14} /> {commonT("delete")}
                        </button>
                      </div>
                    )}

                  </div>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {coupons.map((coupon, index) => (
          <section
            key={coupon.id}
            className="rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{coupon.title || coupon.code}</p>
                <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                  {t("labels.code")}: {coupon.code}
                </p>
              </div>
              <Switch
                checked={coupon.isActive}
                disabled={!restaurantId || toggleCouponStatusMutation.isPending}
                aria-label={t("columns.status")}
                onCheckedChange={() => toggleStatus(coupon)}
              />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-[var(--ui-text-muted)]">{t("columns.sl")}</dt>
                <dd className="mt-1 font-medium">{getSerial(index)}</dd>
              </div>
              <div>
                <dt className="text-[var(--ui-text-muted)]">{t("labels.amount")}</dt>
                <dd className="mt-1 font-medium">{coupon.discountValue ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--ui-text-muted)]">{t("labels.type")}</dt>
                <dd className="mt-1 font-medium">{coupon.discountType || "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--ui-text-muted)]">{t("columns.totalUsage")}</dt>
                <dd className="mt-1 font-medium">{coupon.usedCount ?? 0}</dd>
              </div>
            </dl>
            <div className="mt-4 flex justify-end gap-2 border-t border-[var(--ui-border)] pt-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedCoupon(coupon);
                  setOpenView(true);
                }}
              >
                <Eye />
                {t("actions.view")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => router.push(`/promotion-management/coupons/add?coupon=${coupon.code}`)}
              >
                <Pencil />
                {t("actions.edit")}
              </Button>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6">
        <PaginationSection meta={meta} onPageChange={setPage} />
      </div>

      <ResponsiveDialog
        open={openView && Boolean(selectedCoupon)}
        onOpenChange={setOpenView}
        title={t("couponDetails")}
        description={selectedCoupon?.code}
        actions={
          <Button type="button" onClick={() => setOpenView(false)}>
            {t("actions.close")}
          </Button>
        }
      >
        {selectedCoupon ? (
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              {[
                [t("labels.title"), selectedCoupon.title],
                [t("labels.discount"), selectedCoupon.discountValue],
                [t("labels.type"), selectedCoupon.discountType],
                [t("labels.minOrder"), selectedCoupon.minOrderAmount || 0],
                [t("labels.maxDiscount"), selectedCoupon.maxDiscountAmount || 0],
                [t("labels.usage"), selectedCoupon.usedCount],
                [t("labels.perUserLimit"), selectedCoupon.maxUsesPerCustomer],
                [t("labels.status"), selectedCoupon.isActive ? commonT("active") : commonT("inactive")],
              ].map(([label, value], idx) => (
                <div key={idx} className="rounded-[var(--ui-radius-control)] bg-[var(--ui-surface-subtle)] p-3">
                  <p className="text-xs text-[var(--ui-text-muted)]">{label}</p>
                  <p className="mt-1 font-semibold">{value}</p>
                </div>
              ))}
          </div>
        ) : null}
      </ResponsiveDialog>
      <DeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(value) => {
          if (!value) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (!deleteTarget) return;

          deleteCouponMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
              setDeleteTarget(null);
              void refetch();
            },
          });
        }}
        isLoading={deleteCouponMutation.isPending}
        title={t("deleteCouponTitle")}
        description={t("deleteCouponDescription")}
      />
    </>
  );
};

export default CouponsTable;
