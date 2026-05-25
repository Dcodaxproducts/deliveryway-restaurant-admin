"use client";

import { useState, useEffect } from "react";
import Container from "@/components/container";
import AddDeliveryManHeader from "@/components/deliveryman/add/AddDeliveryManHeader";
import DeliveryManForm from "@/components/forms/deliveryman-form";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCreateDeliveryman,
  useUpdateDeliveryman,
  useDeliveryman,
} from "@/hooks/useDeliverymen";
import { useGetBranches } from "@/hooks/useBranches";
import { deliverymanSchema } from "@/validations/deliverymen";
import { validateSchema } from "@/lib/zod-errors";

const AddDeliveryMan = () => {
  const { restaurantId, branchId: authBranchId, isBranchAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const editId = searchParams.get("editId");

  /* ================= DELIVERYMAN HOOKS ================= */
  const { data: deliveryman, isLoading: isFetching } =
    useDeliveryman(editId || undefined);

  const createMutation = useCreateDeliveryman();
  const updateMutation = useUpdateDeliveryman();

  /* ================= BRANCH STATE (FOR SEARCH/PAGINATION) ================= */
  const [branchQuery, setBranchQuery] = useState({
    search: "",
    page: 1,
  });

  const { data: branchesData, isFetching: isBranchesFetching } =
    useGetBranches({
      search: branchQuery.search,
      restaurantId: restaurantId ?? undefined, 
    });

  /* ================= STATE ================= */
  const [selectedBranch, setSelectedBranch] = useState<any>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    vehicleType: "",
    vehicleNumber: "",
    status: "OFFLINE" as "ONLINE" | "OFFLINE",
  });

  /* ================= PREFILL ================= */
  useEffect(() => {
    if (isBranchAdmin && authBranchId && !selectedBranch) {
      setSelectedBranch({ id: authBranchId, name: "Assigned branch" });
    }
  }, [isBranchAdmin, authBranchId, selectedBranch]);

  useEffect(() => {
    if (!deliveryman) return;

    setFormData({
      firstName: deliveryman.firstName || "",
      lastName: deliveryman.lastName || "",
      phone: deliveryman.phone || "",
      email: deliveryman.email || "",
      vehicleType: deliveryman.vehicleType || "",
      vehicleNumber: deliveryman.vehicleNumber || "",
      status: deliveryman.status || "OFFLINE",
    });

    if (deliveryman.branch) {
      setSelectedBranch(deliveryman.branch);
    }
  }, [deliveryman]);

  /* ================= BRANCH FETCH WRAPPER ================= */
  const fetchBranches = async ({ search, page }: any) => {
    // update query → triggers hook refetch
    setBranchQuery({
      search: search || "",
      page: page || 1,
    });

    // return current cached data (React Query handles freshness)
    return {
      data: branchesData?.data || [],
      meta: branchesData?.meta,
    };
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    const branchId = isBranchAdmin ? authBranchId : selectedBranch?.id;

    try {
      const payload = {
        ...formData,
        restaurantId,
        branchId,
      };

      const parsed = validateSchema(deliverymanSchema, payload);

      if (!parsed.success) {
        toast.error(Object.values(parsed.errors)[0] || "Invalid form data");
        return;
      }

      /* CREATE */
      if (!editId) {
        if (!restaurantId || !branchId) {
          toast.error("Restaurant or branch not found");
          return;
        }

        await createMutation.mutateAsync(parsed.data);
        return;
      }

      /* UPDATE */
      await updateMutation.mutateAsync({
  id: editId,
  payload: (({ restaurantId, status, ...rest }) => rest)(parsed.data), 
});
    } catch (err: any) {
      void err;
      toast.error(err?.message || "Something went wrong");
    }
  };

  /* ================= LOADING ================= */
  const isSaving =
    createMutation.isPending || updateMutation.isPending;

  return (
    <Container>
      <AddDeliveryManHeader
        title={editId ? "Edit Delivery Man" : "Create New Delivery Man"}
        description="Manage delivery man details"
        onConfirm={handleSubmit}
        loading={isSaving || isFetching}
      />

      <DeliveryManForm
        formData={formData}
        setFormData={setFormData}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        fetchBranches={fetchBranches}
        branchLocked={isBranchAdmin}
      />
    </Container>
  );
};

export default AddDeliveryMan;
