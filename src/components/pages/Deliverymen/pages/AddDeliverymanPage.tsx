"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import Container from "@/components/common/Container";
import DeliveryManForm, { type BranchOption } from "@/components/pages/Deliverymen/forms/DeliverymanForm";
import AddDeliveryManHeader from "@/components/pages/Deliverymen/components/deliveryman/add/AddDeliveryManHeader";
import { useAuth } from "@/hooks/useAuth";
import { useGetBranches } from "@/hooks/useBranches";
import {
  useCreateDeliveryman,
  useDeliveryman,
  useUpdateDeliveryman,
} from "@/hooks/useDeliverymen";
import { useSearchParams } from "next/navigation";
import {
  deliverymanSchema,
  type DeliverymanFormValues,
  type DeliverymanValues,
} from "@/validations/deliverymen";

const defaultValues: DeliverymanFormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  vehicleType: "",
  vehicleNumber: "",
  status: "OFFLINE",
  branchId: "",
};

type BranchListResponse = {
  data?: BranchOption[];
  meta?: unknown;
};

const AddDeliveryMan = () => {
  const { restaurantId, branchId: authBranchId, isBranchAdmin } = useAuth();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");

  const { data: deliveryman, isLoading: isFetching } = useDeliveryman(editId || undefined);
  const createMutation = useCreateDeliveryman();
  const updateMutation = useUpdateDeliveryman();

  const [branchQuery, setBranchQuery] = useState({
    search: "",
    page: 1,
  });
  const [selectedBranch, setSelectedBranch] = useState<BranchOption | null>(null);

  const { data: branchesData } = useGetBranches({
    search: branchQuery.search,
    restaurantId: restaurantId ?? undefined,
  }) as { data?: BranchListResponse };

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
  } = useForm<DeliverymanFormValues>({
    resolver: zodResolver(
      deliverymanSchema.omit({ restaurantId: true }).extend({
        branchId: deliverymanSchema.shape.branchId,
      })
    ),
    defaultValues,
  });

  useEffect(() => {
    if (isBranchAdmin && authBranchId && !selectedBranch) {
      setSelectedBranch({ id: authBranchId, name: "Assigned branch" });
      setValue("branchId", authBranchId);
    }
  }, [isBranchAdmin, authBranchId, selectedBranch, setValue]);

  useEffect(() => {
    if (!deliveryman) return;

    const { branch: deliverymanBranch } = deliveryman;
    const branch = deliverymanBranch
      ? {
          id: deliverymanBranch.id,
          name: deliverymanBranch.name,
        }
      : null;

    reset({
      firstName: deliveryman.firstName ?? "",
      lastName: deliveryman.lastName ?? "",
      phone: deliveryman.phone ?? "",
      email: deliveryman.email ?? "",
      vehicleType: deliveryman.vehicleType ?? "",
      vehicleNumber: deliveryman.vehicleNumber ?? "",
      status: deliveryman.status ?? "OFFLINE",
      branchId: isBranchAdmin ? authBranchId ?? "" : branch?.id ?? "",
    });

    if (branch) setSelectedBranch(branch);
  }, [authBranchId, deliveryman, isBranchAdmin, reset]);

  const fetchBranches = async ({ search, page }: { search: string; page: number }) => {
    setBranchQuery({
      search: search || "",
      page: page || 1,
    });

    return {
      data: branchesData?.data ?? [],
      meta: branchesData?.meta,
    };
  };

  const onSubmit = async (values: DeliverymanFormValues) => {
    const branchId = isBranchAdmin ? authBranchId : values.branchId;

    try {
      const payload: DeliverymanValues = {
        ...values,
        restaurantId: restaurantId ?? "",
        branchId: branchId ?? "",
      };

      if (!editId) {
        if (!restaurantId || !branchId) {
          toast.error("Restaurant or branch not found");
          return;
        }

        await createMutation.mutateAsync(payload);
        return;
      }

      const { restaurantId: _restaurantId, status: _status, ...updatePayload } = payload;
      await updateMutation.mutateAsync({
        id: editId,
        payload: updatePayload,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Container>
      <AddDeliveryManHeader
        title={editId ? "Edit Delivery Man" : "Create New Delivery Man"}
        description="Manage delivery man details"
        loading={isSaving || isFetching}
        formId="deliveryman-form"
      />

      <form id="deliveryman-form" noValidate onSubmit={handleSubmit(onSubmit)}>
        <DeliveryManForm
          control={control}
          errors={errors}
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
          fetchBranches={fetchBranches}
          branchLocked={isBranchAdmin}
        />
      </form>
    </Container>
  );
};

export default AddDeliveryMan;
