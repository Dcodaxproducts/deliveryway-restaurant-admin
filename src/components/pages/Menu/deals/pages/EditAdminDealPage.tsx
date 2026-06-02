"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import Container from "@/components/common/Container";
import AdminDealForm, {
  type AdminDealFormBranchOption,
} from "@/components/pages/Menu/deals/components/AdminDealForm";
import { useAdminDeal, useUpdateAdminDeal } from "@/hooks/useAdminDeals";
import { useAuth } from "@/hooks/useAuth";
import { useGetBranches } from "@/hooks/useBranches";
import type { AdminDealFormValues } from "@/types/admin-deals";
import { buildAdminDealUpdatePayload } from "@/validations/admin-deals";

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

export default function EditAdminDealPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { restaurantId, branchId, isBranchAdmin } = useAuth();
  const scopeParams = {
    restaurantId,
    branchId: isBranchAdmin ? branchId : undefined,
  };

  const dealQuery = useAdminDeal(id || null, scopeParams);
  const updateMutation = useUpdateAdminDeal();

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
    if (!id) return;

    await updateMutation.mutateAsync({
      id,
      payload: buildAdminDealUpdatePayload({
        ...values,
        restaurantId: values.restaurantId || restaurantId,
        branchId: isBranchAdmin ? branchId : values.branchId,
      }),
      params: {
        restaurantId,
        branchId: isBranchAdmin ? branchId : values.branchId || undefined,
      },
    });
    router.push("/menu/deals");
  };

  if (dealQuery.isLoading) {
    return (
      <Container>
        <div className="flex min-h-[360px] items-center justify-center rounded-lg bg-white shadow-sm">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="rounded-lg bg-white shadow-sm">
        <AdminDealForm
          title="Edit Deal"
          initialDeal={dealQuery.data}
          restaurantId={restaurantId}
          branchId={branchId}
          isBranchAdmin={isBranchAdmin}
          branchOptions={branchOptions}
          submitting={updateMutation.isPending}
          submitLabel="Update Deal"
          onCancel={() => router.push("/menu/deals")}
          onSubmit={handleSubmit}
        />
      </div>
    </Container>
  );
}
