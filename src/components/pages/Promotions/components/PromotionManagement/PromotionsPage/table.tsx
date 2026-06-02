"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
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
import { useDeleteAdminPromotionCampaign } from "@/hooks/usePromotions";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/errors";

type Promotion = {
  id: string;
  code?: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string | null;
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
  promotions: Promotion[];
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

type ActionMenuProps = {
  promoId: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
};

const ACTION_MENU_WIDTH = 160;
const ACTION_MENU_HEIGHT = 96;
const ACTION_MENU_GAP = 8;
const VIEWPORT_PADDING = 12;

const formatDiscount = (promo: Promotion) => {
  const value = Number(promo.discountValue ?? 0);

  if (promo.discountType === "PERCENTAGE") return `${value}%`;
  if (promo.discountType === "FLAT") return `${value}`;

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

const getScopeText = (promo: Promotion) => {
  if (promo.scopeMenuItem?.name) return `Item: ${promo.scopeMenuItem.name}`;
  if (promo.scopeCategory?.name) return `Category: ${promo.scopeCategory.name}`;

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

const getTitleInitial = (title?: string) => {
  return (title || "P").slice(0, 1).toUpperCase();
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const ActionMenu = ({
  promoId,
  isOpen,
  onToggle,
  onClose,
  onEdit,
  onDelete,
  deleting,
}: ActionMenuProps) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
  });

  const updatePosition = () => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();

    const menuWidth = ACTION_MENU_WIDTH;
    const menuHeight =
      menuRef.current?.getBoundingClientRect().height || ACTION_MENU_HEIGHT;

    const maxLeft = window.innerWidth - menuWidth - VIEWPORT_PADDING;

    const left = clamp(
      rect.right - menuWidth,
      VIEWPORT_PADDING,
      Math.max(VIEWPORT_PADDING, maxLeft)
    );

    const shouldOpenUp =
      rect.bottom + ACTION_MENU_GAP + menuHeight >
      window.innerHeight - VIEWPORT_PADDING;

    const top = shouldOpenUp
      ? Math.max(VIEWPORT_PADDING, rect.top - menuHeight - ACTION_MENU_GAP)
      : Math.min(
          rect.bottom + ACTION_MENU_GAP,
          window.innerHeight - menuHeight - VIEWPORT_PADDING
        );

    setPosition({
      top,
      left,
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;

    updatePosition();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;

      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleViewportChange = () => {
      updatePosition();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen, onClose]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={`promotion-actions-${promoId}`}
        onClick={onToggle}
        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-black"
      >
        <MoreHorizontal size={18} />
      </button>

      {mounted && isOpen
        ? createPortal(
            <div
              ref={menuRef}
              id={`promotion-actions-${promoId}`}
              role="menu"
              style={{
                position: "fixed",
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: `${ACTION_MENU_WIDTH}px`,
              }}
              className="z-[9999] rounded-xl border border-gray-100 bg-white p-2 shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onEdit();
                  onClose();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
              >
                <Edit size={15} />
                Edit
              </button>

              <button
                type="button"
                role="menuitem"
                disabled={deleting}
                onClick={onDelete}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={15} />
                Delete
              </button>
            </div>,
            document.body
          )
        : null}
    </>
  );
};

const TableSkeleton = () => {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <TableRow key={index} className="h-[72px] border-none">
          {Array.from({ length: 8 }).map((__, cellIndex) => (
            <TableCell key={cellIndex} className="px-4">
              <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-gray-200" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};

const PromotionsTable = ({
  promotions,
  loading = false,
  meta,
  onPageChange,
}: Props) => {
  const router = useRouter();
  const { user, restaurantId } = useAuth();

  const branchId = user?.branchId ?? null;

  const deleteMutation = useDeleteAdminPromotionCampaign();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const hasData = promotions && promotions.length > 0;

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({
        id,
        restaurantId,
        branchId,
      });

      toast.success("Promotion deleted successfully.");
      setOpenMenuId(null);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to delete promotion."));
    }
  };

  if (!loading && !hasData) {
    return (
      <>
        <EmptyState
          title="Looks like there are no Promotions yet!"
          description="You haven’t added any Promotions yet. Start by creating a new"
        />
        <PromotionCreateLink
          label="Create New Promotion"
          href="/promotion-management/promotions/add"
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
              <SortableHeader label="SL" />
              <SortableHeader label="Name & Code" />
              <SortableHeader label="Discount" />
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
              promotions.map((promo, index) => (
                <TableRow key={promo.id} className="h-[72px] border-none">
                  <TableCell className="px-4">
                    {(meta.page - 1) * meta.limit + index + 1}
                  </TableCell>

                  <TableCell className="px-4">
                    <div className="flex items-start gap-3">
                      {promo.thumbnailUrl ? (
                        <Image
                          src={promo.thumbnailUrl}
                          alt={`${promo.title ?? "Promotion"} thumbnail`}
                          width={40}
                          height={40}
                          unoptimized
                          className="h-10 w-10 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-400">
                          {getTitleInitial(promo.title)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{promo.title}</p>
                        <p className="text-sm text-gray-500">
                          Code: {promo.code || "Auto apply"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(promo.startsAt)} -{" "}
                          {formatDate(promo.expiresAt)}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-4">
                    <p className="text-sm font-medium">
                      {formatDiscount(promo)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Type: {promo.discountType ?? "N/A"}
                    </p>
                  </TableCell>

                  <TableCell className="px-4 text-sm text-gray-500">
                    {getScopeText(promo)}
                  </TableCell>

                  <TableCell className="px-4 text-sm text-gray-500">
                    {promo.branch?.name ?? "All Branches"}
                  </TableCell>

                  <TableCell className="px-4 text-sm text-gray-500">
                    {promo.usedCount ?? 0} / {promo.maxUses ?? "Unlimited"}
                  </TableCell>

                  <TableCell className="px-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                        promo.status
                      )}`}
                    >
                      {promo.status ?? "N/A"}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 text-center">
                    <ActionMenu
                      promoId={promo.id}
                      isOpen={openMenuId === promo.id}
                      onToggle={() =>
                        setOpenMenuId((prev) =>
                          prev === promo.id ? null : promo.id
                        )
                      }
                      onClose={() => setOpenMenuId(null)}
                      onEdit={() =>
                        router.push(
                          `/promotion-management/promotions/add?id=${promo.id}`
                        )
                      }
                      onDelete={() => handleDelete(promo.id)}
                      deleting={deleteMutation.isPending}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 md:hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="space-y-3 rounded-[14px] border border-[#EDEFF2] bg-white p-4"
              >
                <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
              </div>
            ))
          : promotions.map((promo) => (
              <div
                key={promo.id}
                className="flex flex-col gap-3 rounded-[14px] border border-[#EDEFF2] bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {promo.thumbnailUrl ? (
                      <Image
                        src={promo.thumbnailUrl}
                        alt={`${promo.title ?? "Promotion"} thumbnail`}
                        width={40}
                        height={40}
                        unoptimized
                        className="h-10 w-10 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-400">
                        {getTitleInitial(promo.title)}
                      </div>
                    )}
                    <p className="truncate font-semibold text-gray-900">{promo.title}</p>
                  </div>
                  <Checkbox />
                </div>

                <p className="text-sm text-gray-500">
                  Code: {promo.code || "Auto apply"}
                </p>

                <div className="space-y-1 text-sm text-gray-600">
                  <p>Discount: {formatDiscount(promo)}</p>
                  <p>Scope: {getScopeText(promo)}</p>
                  <p>Branch: {promo.branch?.name ?? "All Branches"}</p>
                  <p>
                    Usage: {promo.usedCount ?? 0} /{" "}
                    {promo.maxUses ?? "Unlimited"}
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                      promo.status
                    )}`}
                  >
                    {promo.status ?? "N/A"}
                  </span>

                  <div className="flex items-center gap-2">
                    <Switch checked={Boolean(promo.isActive)} disabled />

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/promotion-management/promotions/add?id=${promo.id}`
                        )
                      }
                      className="p-2 hover:text-black"
                    >
                      <Edit size={17} />
                    </button>

                    <button
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(promo.id)}
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

export default PromotionsTable;
