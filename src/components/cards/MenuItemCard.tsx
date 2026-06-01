"use client";

import Image from "next/image";
import { Pencil, Plus, Star, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import AddToCartModal from "@/components/pages/Pos/cart/AddToCartModal";
import DeleteDialog from "@/components/common/dialogs/delete-dialog";
import { useDeleteMenuItem } from "@/hooks/useMenus";

type Props = {
  item: any;
  editing?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
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

const formatCurrency = (value: unknown) => {
  const numeric = toNumber(value, 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(numeric) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(numeric);
};

export default function MenuItemCard({ item, editing, onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const { mutate: deleteMenuItem, isPending: isDeleting } = useDeleteMenuItem();

  const image = useMemo(() => getImageUrl(item?.imageUrl), [item?.imageUrl]);
  const price = useMemo(() => getDisplayPrice(item), [item]);

  const categoryName = item?.category?.name || "Uncategorized";
  const description = String(item?.description || "Freshly prepared menu item.").trim();

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
    <article className="group relative flex h-full min-h-[270px] w-full flex-col overflow-hidden rounded-[22px] border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl">
      {editing ? (
        <div className="absolute right-2.5 top-2.5 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit?.()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/95 text-muted-foreground shadow-sm backdrop-blur transition hover:border-primary/30 hover:bg-primary hover:text-primary-foreground"
            aria-label={`Edit ${item?.name || "menu item"}`}
          >
            <Pencil size={14} />
          </button>

          <button
            type="button"
            onClick={() => setOpenDelete(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/95 text-muted-foreground shadow-sm backdrop-blur transition hover:border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
            aria-label={`Delete ${item?.name || "menu item"}`}
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      <div className="relative h-[180px] w-full overflow-hidden bg-muted">
        <Image
          src={image}
          alt={item?.name || "Menu item"}
          fill
          sizes="(max-width: 768px) 100vw, 360px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          unoptimized
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/25 to-transparent" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="mb-2.5 flex min-w-0 items-center justify-between gap-3">
          <span className="min-w-0 truncate rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary ring-1 ring-primary/10">
            {categoryName}
          </span>

          <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-500 ring-1 ring-amber-100">
            <Star size={14} fill="currentColor" />
            <span className="text-xs font-semibold text-foreground">4.5</span>
          </div>
        </div>

        <div className="min-h-[92px]">
          <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-[-0.02em] text-foreground">
            {item?.name || "Menu Item"}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Price
            </p>
            <p className="mt-1 truncate text-2xl font-extrabold tracking-[-0.04em] text-foreground">
              <span className="text-primary">{formatCurrency(price).charAt(0)}</span>
              {formatCurrency(price).slice(1)}
            </p>
          </div>

          <Button
            type="button"
            size="icon"
            onClick={() => setOpen(true)}
            className="h-11 w-11 shrink-0 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90"
            aria-label={`Add ${item?.name || "menu item"} to cart`}
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
        title="Delete Menu Item"
        description={`Are you sure you want to delete \"${
          item?.name || "this item"
        }\"? This action cannot be undone.`}
      />
    </article>
  );
}
