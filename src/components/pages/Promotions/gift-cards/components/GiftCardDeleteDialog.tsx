"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { GiftCard } from "@/types/gift-cards";

type GiftCardDeleteDialogProps = {
  giftCard: GiftCard | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function GiftCardDeleteDialog({
  giftCard,
  deleting,
  onClose,
  onConfirm,
}: GiftCardDeleteDialogProps) {
  const t = useTranslations("promotions.giftCards");
  const commonT = useTranslations("common");

  if (!giftCard) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[18px] bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">{t("deleteTitle")}</h3>
        <p className="mt-2 text-sm text-gray-500">
          {t("deleteDescriptionPrefix")}{" "}
          <span className="font-medium text-gray-800">{giftCard.title}</span>?{" "}
          {t("deleteDescriptionSuffix")}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={deleting}
            onClick={onClose}
            className="rounded-[12px]"
          >
            {commonT("cancel")}
          </Button>
          <Button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="rounded-[12px] bg-primary text-white hover:bg-primary/90"
          >
            {deleting ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
            {commonT("delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}
