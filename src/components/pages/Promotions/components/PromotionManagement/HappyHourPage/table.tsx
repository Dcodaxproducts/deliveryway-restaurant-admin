"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import SortableHeader from "@/components/common/sortable-head";
import EmptyState from "@/components/common/EmptyState";
import PromotionCreateLink from "../PromotionOverview/PromotionCreateLink";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import PaginationSection from "@/components/common/pagination";
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

const dayMap: Record<number, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

const formatDiscount = (item: HappyHour) => {
  const value = Number(item.discountValue ?? 0);

  if (item.discountType === "PERCENTAGE") return `${value}%`;
  if (item.discountType === "FLAT") return `${value}`;

  return value;
};

const formatDate = (value?: string) => {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const formatActiveDays = (days?: number[]) => {
  if (!Array.isArray(days) || days.length === 0) return "N/A";

  if (days.length === 7) return "Every Day";

  return days.map((day) => dayMap[day] ?? day).join(", ");
};

const getScopeText = (item: HappyHour) => {
  if (item.scopeMenuItem?.name) return `Item: ${item.scopeMenuItem.name}`;
  if (item.scopeCategory?.name) return `Category: ${item.scopeCategory.name}`;

  return "All Items";
};

const getStatusClass = (status?: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-50 text-green-700";
    case "SCHEDULED":
      return "bg-yellow-50 text-yellow-700";
    case "EXPIRED":
      return "bg-red-50 text-red-700";
    default:
      return "bg-gray-50 text-gray-600";
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

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({
        id,
        restaurantId,
        branchId,
      });

      toast.success("Happy hour deleted successfully.");
      setOpenMenuId(null);
      setMenuPosition(null);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to delete happy hour."));
    }
  };

  if (!loading && !hasData) {
    return (
      <>
        <EmptyState
          title="Looks like there are no Happy Hours yet!"
          description="You haven’t added any Happy Hours yet. Start by creating a new"
        />

        <PromotionCreateLink
          label="Create Happy Hour"
          href="/promotion-management/happy-hour/add"
        />
      </>
    );
  }

  return (
    <>
      <div className="hidden md:block relative">
        <Table className="relative">
          <TableHeader>
            <TableRow className="border-none">
              <SortableHeader label="SL" />
              <SortableHeader label="Name & Code" />
              <SortableHeader label="Discount" />
              <SortableHeader label="Time" />
              <SortableHeader label="Days" />
              <SortableHeader label="Scope" />
              <SortableHeader label="Branch" />
              <SortableHeader label="Usage" />
              <SortableHeader label="Status" />
              <TableHead className="text-center font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableSkeleton />
            ) : (
              happyHours.map((item, index) => (
                <TableRow key={item.id} className="border-none h-[72px]">
                  <TableCell className="px-4">
                    {(meta.page - 1) * meta.limit + index + 1}
                  </TableCell>

                  <TableCell className="px-4">
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-gray-500 text-sm">Code: {item.code}</p>
                    <p className="text-gray-400 text-xs">
                      {formatDate(item.startsAt)} - {formatDate(item.expiresAt)}
                    </p>
                  </TableCell>

                  <TableCell className="px-4">
                    <p className="text-sm font-medium">
                      {formatDiscount(item)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Type: {item.discountType ?? "N/A"}
                    </p>
                  </TableCell>

                  <TableCell className="px-4 text-sm text-gray-500">
                    {item.dailyStartTime ?? "N/A"} -{" "}
                    {item.dailyEndTime ?? "N/A"}
                  </TableCell>

                  <TableCell className="px-4 text-sm text-gray-500">
                    {formatActiveDays(item.activeDays)}
                  </TableCell>

                  <TableCell className="px-4 text-sm text-gray-500">
                    {getScopeText(item)}
                  </TableCell>

                  <TableCell className="px-4 text-sm text-gray-500">
                    {item.branch?.name ?? "All Branches"}
                  </TableCell>

                  <TableCell className="px-4 text-sm text-gray-500">
                    {item.usedCount ?? 0} / {item.maxUses ?? "Unlimited"}
                  </TableCell>

                  <TableCell className="px-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                        item.status
                      )}`}
                    >
                      {item.status ?? "N/A"}
                    </span>
                  </TableCell>

               <TableCell>
  <div className="flex items-center justify-center">
    <button
      type="button"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();

        setOpenMenuId((prev) => {
          const next = prev === item.id ? null : item.id;

          if (next) {
            setMenuPosition({
              top: rect.bottom + 8,
              left: rect.right - 150,
            });
          } else {
            setMenuPosition(null);
          }

          return next;
        });
      }}
      className="p-2 text-gray-400 hover:text-black"
    >
      <MoreHorizontal size={18} />
    </button>
  </div>
</TableCell>
{openMenuId && menuPosition && (
  <div
    className="fixed z-[99999] w-[150px] rounded-xl border bg-white p-2 shadow-lg"
    style={{
      top: menuPosition.top,
      left: menuPosition.left,
    }}
  >
    <button
      type="button"
      onClick={() =>
        router.push(
          `/promotion-management/happy-hour/add?id=${openMenuId}`
        )
      }
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100"
    >
      <Edit size={15} />
      Edit
    </button>

    <button
      type="button"
      disabled={deleteMutation.isPending}
      onClick={() => handleDelete(openMenuId)}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
    >
      <Trash2 size={15} />
      Delete
    </button>
  </div>
)}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden flex flex-col gap-4">
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
                className="bg-white rounded-[14px] shadow-sm p-4 border border-[#EDEFF2] flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <Checkbox />
                </div>

                <p className="text-gray-500 text-sm">Code: {item.code}</p>

                <div className="text-gray-600 text-sm space-y-1">
                  <p>Discount: {formatDiscount(item)}</p>
                  <p>
                    Time: {item.dailyStartTime ?? "N/A"} -{" "}
                    {item.dailyEndTime ?? "N/A"}
                  </p>
                  <p>Days: {formatActiveDays(item.activeDays)}</p>
                  <p>Scope: {getScopeText(item)}</p>
                  <p>Branch: {item.branch?.name ?? "All Branches"}</p>
                  <p>
                    Usage: {item.usedCount ?? 0} /{" "}
                    {item.maxUses ?? "Unlimited"}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                      item.status
                    )}`}
                  >
                    {item.status ?? "N/A"}
                  </span>

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

      <div className="mt-6">
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
