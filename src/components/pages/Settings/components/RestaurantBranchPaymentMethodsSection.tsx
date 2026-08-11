"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, CreditCard, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetBranches, useUpdateBranch } from "@/hooks/useBranches";
import { useRestaurantPaymentManagement } from "@/hooks/useRestaurantPaymentManagement";
import { getApiErrorMessage } from "@/lib/errors";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethodCode,
} from "@/types/payment-methods";
import {
  readBranchPaymentOptions,
  resolveSelectedBranchMethods,
} from "./restaurant-branch-payment-methods";

type RestaurantBranchPaymentMethodsSectionProps = {
  restaurantId?: string | null;
  canEdit: boolean;
};

export function RestaurantBranchPaymentMethodsSection({
  restaurantId,
  canEdit,
}: RestaurantBranchPaymentMethodsSectionProps) {
  const managementQuery = useRestaurantPaymentManagement(restaurantId);
  const branchesQuery = useGetBranches({
    limit: 100,
    restaurantId: restaurantId ?? undefined,
    includeInactive: true,
  });
  const updateBranch = useUpdateBranch();
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<PaymentMethodCode[]>(
    [],
  );

  const branches = useMemo(
    () => readBranchPaymentOptions(branchesQuery.data),
    [branchesQuery.data],
  );
  const assignedMethods = useMemo(
    () => managementQuery.data?.allowedPaymentMethods ?? [],
    [managementQuery.data?.allowedPaymentMethods],
  );
  const selectedBranch = branches.find(
    (branch) => branch.id === selectedBranchId,
  );

  useEffect(() => {
    if (!selectedBranchId && branches[0]) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  useEffect(() => {
    setSelectedMethods(
      resolveSelectedBranchMethods(selectedBranch, assignedMethods),
    );
  }, [assignedMethods, selectedBranch]);

  const toggleMethod = (method: PaymentMethodCode) => {
    setSelectedMethods((current) =>
      current.includes(method)
        ? current.filter((entry) => entry !== method)
        : [...current, method],
    );
  };
  const isLoading = managementQuery.isLoading || branchesQuery.isLoading;
  const error = managementQuery.error ?? branchesQuery.error;
  const canSave =
    canEdit &&
    Boolean(selectedBranch) &&
    selectedMethods.length > 0 &&
    !updateBranch.isPending;

  return (
    <section className="overflow-hidden rounded-[18px] border border-[#E8E8E8] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-4 border-b border-[#E8E8E8] bg-gradient-to-r from-[#FFF8F8] to-white p-5 md:flex-row md:items-start md:justify-between lg:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-primary/10 text-primary">
            <CreditCard size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-dark">
              Customer checkout methods
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray">
              Super Admin makes payment methods available to this restaurant.
              Choose which of them customers can use at each branch.
            </p>
          </div>
        </div>

        {assignedMethods.length > 0 ? (
          <div className="rounded-full border border-primary/20 bg-white px-4 py-2 text-sm text-gray shadow-sm">
            <span className="font-semibold text-dark">
              {assignedMethods.length}
            </span>{" "}
            available
          </div>
        ) : null}
      </div>

      <div className="space-y-5 p-5 lg:p-6">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-12 animate-pulse rounded-[12px] bg-slate-100" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-[14px] bg-slate-100"
                />
              ))}
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-[12px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getApiErrorMessage(error, "Unable to load payment settings.")}
          </p>
        ) : null}

        {!isLoading && !error && branches.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-[#D0D5DD] bg-[#F8FAFC] px-5 py-8 text-center">
            <Building2
              className="mx-auto size-6 text-gray"
              aria-hidden="true"
            />
            <p className="mt-2 text-sm font-medium text-dark">
              Create a branch before configuring customer payment methods.
            </p>
          </div>
        ) : null}

        {!isLoading && !error && branches.length > 0 ? (
          <>
            <div className="grid gap-2 md:grid-cols-[minmax(0,360px)_1fr] md:items-end">
              <div className="space-y-2">
                <label
                  htmlFor="payment-method-branch"
                  className="text-sm font-semibold text-dark"
                >
                  Branch
                </label>
                <Select
                  value={selectedBranchId}
                  onValueChange={setSelectedBranchId}
                >
                  <SelectTrigger
                    id="payment-method-branch"
                    className="h-12 rounded-[12px] border-[#D0D5DD] bg-white"
                  >
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                        {branch.isActive ? "" : " (inactive)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="pb-1 text-sm leading-6 text-gray">
                These choices directly control the payment options shown on this
                branch&apos;s customer website.
              </p>
            </div>

            {assignedMethods.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {assignedMethods.map((method) => {
                  const checked = selectedMethods.includes(method);

                  return (
                    <label
                      key={method}
                      className={`flex cursor-pointer items-center gap-3 rounded-[14px] border px-4 py-4 text-sm font-medium transition-colors ${
                        checked
                          ? "border-primary/30 bg-primary/[0.045] text-dark"
                          : "border-[#E8E8E8] bg-[#FAFAFA] text-gray hover:border-primary/20"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMethod(method)}
                        disabled={!canEdit}
                        className="size-4 accent-primary"
                      />
                      <span>{PAYMENT_METHOD_LABELS[method]}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-[12px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Super Admin has not made any payment methods available to this
                restaurant yet.
              </p>
            )}

            {selectedMethods.length === 0 && assignedMethods.length > 0 ? (
              <p className="text-sm font-medium text-red-600">
                Select at least one payment method for this branch.
              </p>
            ) : null}

            <div className="flex justify-end border-t border-[#E8E8E8] pt-5">
              <Button
                type="button"
                onClick={() => {
                  if (!selectedBranch || !canSave) return;

                  updateBranch.mutate({
                    id: selectedBranch.id,
                    data: {
                      settings: { allowedPaymentMethods: selectedMethods },
                    },
                  });
                }}
                disabled={!canSave}
                className="h-11 w-full rounded-[11px] px-6 shadow-sm active:scale-[0.98] sm:w-auto"
              >
                {updateBranch.isPending ? (
                  <Loader2
                    className="mr-2 size-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : null}
                Save branch methods
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
