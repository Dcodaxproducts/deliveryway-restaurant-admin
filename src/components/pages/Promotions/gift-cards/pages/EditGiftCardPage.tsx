"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import GiftCardForm, {
  type GiftCardFormBranchOption,
} from "@/components/pages/Promotions/gift-cards/components/GiftCardForm";
import { useAuth } from "@/hooks/useAuth";
import { useGetBranches } from "@/hooks/useBranches";
import { useGiftCard, useUpdateGiftCard } from "@/hooks/useGiftCards";
import type { GiftCardFormValues } from "@/types/gift-cards";
import { buildGiftCardUpdatePayload } from "@/validations/gift-cards";
import Container from "@/components/common/Container";
import { StatePanel } from "@/components/common/EmptyState";

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

export default function EditGiftCardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations("promotions.giftCards");
  const { restaurantId, branchId, isBranchAdmin } = useAuth();
  const scopeParams = {
    restaurantId: restaurantId || undefined,
    branchId: isBranchAdmin ? branchId || undefined : undefined,
  };
  const giftCardQuery = useGiftCard(params.id, scopeParams);
  const updateMutation = useUpdateGiftCard();
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

    await updateMutation.mutateAsync({
      id: params.id,
      payload: buildGiftCardUpdatePayload(values),
      params: {
        restaurantId: restaurantId || undefined,
        branchId: values.branchId || (isBranchAdmin ? branchId || undefined : undefined),
      },
    });
    router.push("/promotion-management/gift-cards");
  };

  if (giftCardQuery.isLoading) {
    return (
      <Container>
        <StatePanel state="loading" title={t("loadingDetail")} description="" />
      </Container>
    );
  }

  if (giftCardQuery.error || !giftCardQuery.data) {
    return (
      <Container>
        <StatePanel state="error" title={t("unableToLoad")} description="" />
      </Container>
    );
  }

  return (
    <GiftCardForm
      key={giftCardQuery.data.id}
      title={t("editTitle")}
      initialGiftCard={giftCardQuery.data}
      restaurantId={restaurantId}
      branchId={branchId}
      isBranchAdmin={isBranchAdmin}
      branchOptions={branchOptions}
      submitting={updateMutation.isPending}
      submitLabel={t("updateGiftCard")}
      onCancel={() => router.push("/promotion-management/gift-cards")}
      onSubmit={handleSubmit}
    />
  );
}
