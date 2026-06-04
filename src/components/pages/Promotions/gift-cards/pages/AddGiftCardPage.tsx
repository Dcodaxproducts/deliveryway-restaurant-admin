"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import GiftCardForm, {
  type GiftCardFormBranchOption,
} from "@/components/pages/Promotions/gift-cards/components/GiftCardForm";
import { useAuth } from "@/hooks/useAuth";
import { useGetBranches } from "@/hooks/useBranches";
import { useCreateGiftCard } from "@/hooks/useGiftCards";
import type { GiftCardFormValues } from "@/types/gift-cards";
import { buildGiftCardCreatePayload } from "@/validations/gift-cards";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getBranchOptions = (payload: unknown): GiftCardFormBranchOption[] => {
  const source = isRecord(payload) ? payload.data : payload;
  if (!Array.isArray(source)) return [];

  return source.reduce<GiftCardFormBranchOption[]>((options, item) => {
    if (!isRecord(item) || typeof item.id !== "string") return options;

    options.push({
      id: item.id,
      name: typeof item.name === "string" && item.name ? item.name : item.id,
    });

    return options;
  }, []);
};

export default function AddGiftCardPage() {
  const router = useRouter();
  const t = useTranslations("promotions.giftCards");
  const { restaurantId, branchId, isBranchAdmin } = useAuth();
  const createMutation = useCreateGiftCard();
  const branchesQuery = useGetBranches(
    restaurantId
      ? {
          restaurantId,
          includeInactive: false,
          sortOrder: "ASC",
        }
      : undefined
  );
  const branchOptions = useMemo(
    () => getBranchOptions(branchesQuery.data),
    [branchesQuery.data]
  );

  const handleSubmit = async (values: GiftCardFormValues) => {
    if (!restaurantId && !values.restaurantId) {
      toast.error(t("restaurantMissing"));
      return;
    }

    await createMutation.mutateAsync(buildGiftCardCreatePayload(values));
    router.push("/promotion-management/gift-cards");
  };

  return (
    <GiftCardForm
      title={t("addTitle")}
      restaurantId={restaurantId}
      branchId={branchId}
      isBranchAdmin={isBranchAdmin}
      branchOptions={branchOptions}
      submitting={createMutation.isPending}
      submitLabel={t("createGiftCard")}
      onCancel={() => router.push("/promotion-management/gift-cards")}
      onSubmit={handleSubmit}
    />
  );
}
