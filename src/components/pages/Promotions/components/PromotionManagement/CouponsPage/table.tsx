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
import { Eye, MoreHorizontal, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetCoupons, useToggleCouponStatus } from "@/hooks/usePromotions";
import { useRouter } from "next/navigation";
import {
  getString,
  isRecord,
  normalizeApiRecords,
} from "@/components/pages/Promotions/utils/option-normalizers";

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
  const router = useRouter();

  const [page, setPage] = useState(1);

  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [openView, setOpenView] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const { data: couponsResponse, refetch } = useGetCoupons({
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
                      </div>
                    )}

                  </div>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6">
        <PaginationSection meta={meta} onPageChange={setPage} />
      </div>

      {openView && selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

          <div className="bg-white w-[520px] rounded-2xl shadow-2xl overflow-hidden">

            <div className="flex justify-between items-center px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">{t("couponDetails")}</h2>
                <p className="text-sm text-gray-500">{selectedCoupon.code}</p>
              </div>
              <button
                onClick={() => setOpenView(false)}
                className="text-gray-400 hover:text-black text-xl"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 grid grid-cols-2 gap-5 text-sm">

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
                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">{label}</p>
                  <p className="font-semibold mt-1">{value}</p>
                </div>
              ))}

            </div>

            <div className="px-6 py-4 border-t flex justify-end">
              <button
                onClick={() => setOpenView(false)}
                className="px-5 py-2 bg-primary text-white rounded-md"
              >
                {t("actions.close")}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default CouponsTable;
