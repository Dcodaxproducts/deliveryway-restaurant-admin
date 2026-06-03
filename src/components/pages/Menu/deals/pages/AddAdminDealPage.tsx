"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import Container from "@/components/common/Container";
import AdminDealForm, {
  type AdminDealFormBranchOption,
} from "@/components/pages/Menu/deals/components/AdminDealForm";
import { useCreateAdminDeal } from "@/hooks/useAdminDeals";
import { useAuth } from "@/hooks/useAuth";
import { useGetBranches } from "@/hooks/useBranches";
import type { AdminDealFormValues } from "@/types/admin-deals";
import { buildAdminDealCreatePayload } from "@/validations/admin-deals";
import { useTranslations } from "next-intl";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getBranchOptions = (payload: unknown): AdminDealFormBranchOption[] => {
  const source = isRecord(payload) ? payload.data : payload;
  if (!Array.isArray(source)) return [];

  return source.reduce<AdminDealFormBranchOption[]>((options, item) => {
    if (!isRecord(item) || typeof item.id !== "string") return options;
    options.push({
      id: item.id,
      name: typeof item.name === "string" && item.name ? item.name : item.id,
    });

    return options;
  }, []);
};

export default function AddAdminDealPage() {
  const router = useRouter();
  const t = useTranslations("deals");
  const { restaurantId, branchId, isBranchAdmin } = useAuth();
  const createMutation = useCreateAdminDeal();

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

  const handleSubmit = async (values: AdminDealFormValues) => {
    await createMutation.mutateAsync(
      buildAdminDealCreatePayload({
        ...values,
        restaurantId: values.restaurantId || restaurantId,
        branchId: isBranchAdmin ? branchId : values.branchId,
      })
    );
    router.push("/menu/deals");
  };

  return (
    <Container>
      <div className="rounded-lg bg-white shadow-sm">
        <AdminDealForm
          title={t("addTitle")}
          restaurantId={restaurantId}
          branchId={branchId}
          isBranchAdmin={isBranchAdmin}
          branchOptions={branchOptions}
          submitting={createMutation.isPending}
          submitLabel={t("createDeal")}
          onCancel={() => router.push("/menu/deals")}
          onSubmit={handleSubmit}
        />
      </div>
    </Container>
  );
}
