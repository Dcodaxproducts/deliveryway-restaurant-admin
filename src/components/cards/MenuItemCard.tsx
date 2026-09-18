"use client";

import Image from "next/image";
import { Pencil, Plus, Star, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import AddToCartModal from "@/components/pages/pos/cart/AddToCartModal";
import DeleteDialog from "@/components/common/dialogs/delete-dialog";
import { useDeleteMenuItem } from "@/hooks/useMenus";
import { useCurrency } from "@/hooks/useCurrency";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Props = {
  item: any;
  editing?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  density?: "default" | "compact";
};

const FALLBACK_IMAGE = "/burgerTwo.jpg";

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getImageUrl = (value?: string | null) => {
  if (typeof value === "string" && value.trim().startsWith("http")) {
    return value.trim();
  }

  return FALLBACK_IMAGE;
};

const getDisplayPrice = (item: any) => {
  const defaultVariation = Array.isArray(item?.variations)
    ? item.variations.find((variation: any) => variation?.isDefault) ||
      item.variations[0]
    : null;

  return toNumber(
    defaultVariation?.price ??
      defaultVariation?.itemPriceOverrides?.[0]?.price ??
      item?.basePrice ??
      item?.unitPrice ??
      item?.price,
    0
  );
};

const getPromotionInfo = (source: any) => {
  const happyHour = source?.happyHour;

  if (happyHour && typeof happyHour === "object" && happyHour.isCurrentlyActive !== false) {
    return happyHour;
  }

  const promotion = source?.promotion;

  if (!promotion || typeof promotion !== "object") return null;

  const discountValue = toNumber(promotion.discountValue, 0);
  const discountAmount = toNumber(promotion.discountAmount, 0);
  const discountedPrice = toNumber(promotion.discountedPrice ?? promotion.discountedAmount, 0);
  const discountType = String(promotion.discountType || "").toUpperCase();

  if (
    (discountType === "PERCENTAGE" || discountType === "FLAT") && discountValue > 0 ||
    discountAmount > 0 ||
    discountedPrice > 0
  ) {
    return promotion;
  }

  return null;
};

const calculatePromotionDiscount = (originalPrice: number, promotion: any) => {
  const discountValue = toNumber(promotion?.discountValue, 0);
  const backendDiscountAmount = toNumber(promotion?.discountAmount, 0);
  const maxDiscountAmount = toNumber(promotion?.maxDiscountAmount, 0);
  const discountType = String(promotion?.discountType || "").toUpperCase();

  let discountAmount = 0;

  if (backendDiscountAmount > 0) {
    discountAmount = backendDiscountAmount;
  } else if (discountType === "PERCENTAGE") {
    discountAmount = (originalPrice * discountValue) / 100;
  } else if (discountType === "FLAT") {
    discountAmount = discountValue;
  }

  if (maxDiscountAmount > 0) {
    discountAmount = Math.min(discountAmount, maxDiscountAmount);
  }

  return Math.min(Math.max(discountAmount, 0), originalPrice);
};

const getDiscountedPrice = (item: any, originalPrice: number) => {
  const defaultVariation = Array.isArray(item?.variations)
    ? item.variations.find((variation: any) => variation?.isDefault) ||
      item.variations[0]
    : null;
  const promotion = getPromotionInfo(defaultVariation) || getPromotionInfo(item);

  if (promotion) {
    const promotionPrice = originalPrice - calculatePromotionDiscount(originalPrice, promotion);

    if (promotionPrice >= 0 && promotionPrice < originalPrice) {
      return promotionPrice;
    }
  }

  const directPrice = toNumber(
    item?.discountedPrice ??
      item?.discountPrice ??
      item?.salePrice ??
      item?.offerPrice ??
      item?.finalPrice ??
      item?.priceAfterDiscount,
    Number.NaN,
  );

  if (Number.isFinite(directPrice) && directPrice >= 0 && directPrice < originalPrice) {
    return directPrice;
  }

  const discountValue = toNumber(item?.discountValue ?? item?.discount?.value, 0);
  const discountType = String(item?.discountType ?? item?.discount?.type ?? "").toUpperCase();

  if (discountValue <= 0) return null;

  const calculatedPrice = discountType.includes("PERCENT")
    ? originalPrice - (originalPrice * discountValue) / 100
    : originalPrice - discountValue;

  return calculatedPrice >= 0 && calculatedPrice < originalPrice ? calculatedPrice : null;
};

const getDisplayRating = (item: any) => {
  const rating = toNumber(
    item?.averageRating ?? item?.rating ?? item?.reviewAverage,
    0,
  );

  return rating > 0 ? Math.min(rating, 5) : null;
};

export default function MenuItemCard({
  item,
  editing,
  onEdit,
  onDelete,
  density = "default",
}: Props) {
  const t = useTranslations("pos.menuCard");
  const { formatMoney } = useCurrency(item?.restaurantId);
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const { mutate: deleteMenuItem, isPending: isDeleting } = useDeleteMenuItem();

  const image = useMemo(() => getImageUrl(item?.imageUrl), [item?.imageUrl]);
  const price = useMemo(() => getDisplayPrice(item), [item]);
  const discountedPrice = useMemo(() => getDiscountedPrice(item, price), [item, price]);
  const rating = getDisplayRating(item);

  const itemName = item?.name || t("fallbackName");
  const categoryName = item?.category?.name || t("uncategorized");
  const description = String(item?.description || t("fallbackDescription")).trim();

  const handleDelete = () => {
    if (!item?.id) return;

    deleteMenuItem(item.id, {
      onSuccess: () => {
        setOpenDelete(false);
        onDelete?.();
      },
    });
  };

  return (
    <article
      className={cn(
        "group relative flex h-full w-full flex-col overflow-hidden rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow-xs)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[var(--ui-shadow-sm)]",
        density === "compact" ? "min-h-0" : "min-h-[250px]",
      )}
    >
      {editing ? (
        <div className="absolute right-2.5 top-2.5 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit?.()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/95 text-muted-foreground shadow-sm backdrop-blur transition hover:border-primary/30 hover:bg-primary hover:text-primary-foreground"
            aria-label={t("editAria", { name: itemName })}
          >
            <Pencil size={14} />
          </button>

          <button
            type="button"
            onClick={() => setOpenDelete(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/95 text-muted-foreground shadow-sm backdrop-blur transition hover:border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
            aria-label={t("deleteAria", { name: itemName })}
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          "relative w-full overflow-hidden bg-muted",
          density === "compact" ? "h-[120px]" : "h-[180px]",
        )}
      >
        <Image
          src={image}
          alt={itemName}
          fill
          sizes="(max-width: 768px) 100vw, 360px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          unoptimized
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/25 to-transparent" />
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          density === "compact" ? "p-3" : "p-4",
        )}
      >
        <div className="mb-2.5 flex min-w-0 items-center justify-between gap-3">
          <span className="min-w-0 truncate rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary ring-1 ring-primary/10">
            {categoryName}
          </span>

          {rating !== null ? (
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-500 ring-1 ring-amber-100">
              <Star size={14} fill="currentColor" />
              <span className="text-xs font-semibold text-foreground">
                {rating.toFixed(1)}
              </span>
            </div>
          ) : null}
        </div>

        <div className={density === "compact" ? "min-h-[56px]" : "min-h-[76px]"}>
          <h3
            className={cn(
              "line-clamp-2 font-semibold tracking-[-0.02em] text-foreground",
              density === "compact" ? "text-sm leading-5" : "text-lg leading-snug",
            )}
          >
            {itemName}
          </h3>

          <p
            className={cn(
              "line-clamp-2 text-muted-foreground",
              density === "compact"
                ? "mt-1 text-xs leading-4"
                : "mt-1.5 text-[13px] leading-5",
            )}
          >
            {description}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("price")}
            </p>
            <p
              className={cn(
                "mt-1 flex flex-wrap items-baseline gap-2 truncate font-semibold tabular-nums text-foreground",
                density === "compact" ? "text-base" : "text-2xl tracking-[-0.04em]",
              )}
            >
              {discountedPrice !== null ? (
                <>
                  <span className="text-primary">{formatMoney(discountedPrice, item?.currency)}</span>
                  <span className="text-sm font-semibold tracking-normal text-muted-foreground line-through">
                    {formatMoney(price, item?.currency)}
                  </span>
                </>
              ) : (
                <span className="text-primary">{formatMoney(price, item?.currency)}</span>
              )}
            </p>
          </div>

          <Button
            type="button"
            size="icon"
            onClick={() => setOpen(true)}
            className={cn(
              "shrink-0 rounded-[var(--ui-radius-control)] bg-primary text-primary-foreground transition hover:bg-primary/90",
              density === "compact" ? "h-9 w-9" : "h-11 w-11 shadow-lg shadow-primary/20",
            )}
            aria-label={t("addToCartAria", { name: itemName })}
          >
            <Plus size={18} />
          </Button>
        </div>
      </div>

      <AddToCartModal open={open} onOpenChange={setOpen} item={item} />

      <DeleteDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={t("deleteTitle")}
        description={t("deleteDescription", {
          name: item?.name || t("thisItem"),
        })}
      />
    </article>
  );
}
