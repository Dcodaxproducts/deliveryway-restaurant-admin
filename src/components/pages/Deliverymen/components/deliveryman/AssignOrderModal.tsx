"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/useOrders";
import { useAssignOrderToDeliveryman } from "@/hooks/useDeliverymen";
import {
  Search,
  MapPin,
  ShoppingBag,
  CalendarDays,
  CircleDollarSign,
  CheckCircle2,
  AlertTriangle,
  Phone,
  User,
  Store,
} from "lucide-react";

interface AssignOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryman: any;
  onSuccess?: () => void;
}

export default function AssignOrderModal({
  open,
  onOpenChange,
  deliveryman,
  onSuccess,
}: AssignOrderModalProps) {
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const assignMutation = useAssignOrderToDeliveryman();

  const { orders, loading, isFetching } = useOrders({
    page: 1,
    limit: 100,
    search,
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedOrderId("");
    }
  }, [open]);

  const deliverymanBranchId = deliveryman?.branchId || deliveryman?.branch?.id || null;

  const filteredOrders = useMemo(() => {
    return (orders || []).filter((order: any) => {
      const query = search.trim().toLowerCase();

      if (!query) return true;

      return (
        order?.orderNumber?.toLowerCase().includes(query) ||
        order?.id?.toLowerCase().includes(query) ||
        order?.status?.toLowerCase().includes(query) ||
        order?.orderType?.toLowerCase().includes(query) ||
        order?.branch?.name?.toLowerCase().includes(query) ||
        order?.customer?.fullName?.toLowerCase().includes(query)
      );
    });
  }, [orders, search]);

  const selectedOrder = filteredOrders.find(
    (order: any) => order.id === selectedOrderId
  );

  const isBranchMatched = (order: any) => {
    const orderBranchId = order?.branchId || order?.branch?.id || null;
    return !!deliverymanBranchId && !!orderBranchId && deliverymanBranchId === orderBranchId;
  };

  const canAssignSelectedOrder = selectedOrder ? isBranchMatched(selectedOrder) : false;

  const handleAssign = async () => {
    if (!deliveryman?.id || !selectedOrderId || !canAssignSelectedOrder) return;

    try {
      await assignMutation.mutateAsync({
        id: deliveryman.id,
        orderId: selectedOrderId,
      });

      onSuccess?.();
    } catch (error) {
      void error;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-5xl overflow-hidden border-0 p-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div
          className="px-6 py-5 text-white"
          style={{
            background:
              "linear-gradient(135deg, var(--primary), #9f1114)",
          }}
        >
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold tracking-tight text-white">
              Assign Order
            </DialogTitle>
            <DialogDescription className="text-sm text-white/80">
              Select an order and assign it to the deliveryman.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs uppercase tracking-wide text-white/70">
                Deliveryman
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {deliveryman
                  ? `${deliveryman.firstName || ""} ${deliveryman.lastName || ""}`
                  : "-"}
              </p>
            </div>

            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs uppercase tracking-wide text-white/70">
                Phone
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                {deliveryman?.phone || "-"}
              </p>
            </div>

            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs uppercase tracking-wide text-white/70">
                Branch
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                {deliveryman?.branch?.name || "No Branch"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6">
          <div className="relative mb-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order number, ID, branch, customer, type, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-1">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Available Orders
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  All orders are shown. Only same-branch orders can be assigned.
                </p>
              </div>

              <div className="max-h-[460px] overflow-y-auto">
                {loading || isFetching ? (
                  <div className="flex min-h-[220px] items-center justify-center p-6 text-sm text-slate-500">
                    Loading orders...
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="flex min-h-[220px] items-center justify-center p-6 text-sm text-slate-500">
                    No orders found.
                  </div>
                ) : (
                  <div className="space-y-3 p-3">
                    {filteredOrders.map((order: any) => {
                      const isSelected = selectedOrderId === order.id;
                      const isMatched = isBranchMatched(order);
                      const isDisabled = !isMatched;

                      return (
                        <label
                          key={order.id}
                          className={`block rounded-2xl border p-4 transition-all ${
                            isDisabled
                              ? "cursor-not-allowed border-slate-200 bg-slate-100/80 opacity-70"
                              : isSelected
                              ? "cursor-pointer border-[var(--primary)] bg-[var(--primary)] text-white shadow-lg"
                              : "cursor-pointer border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="selectedOrder"
                              value={order.id}
                              checked={isSelected}
                              disabled={isDisabled}
                              onChange={() => setSelectedOrderId(order.id)}
                              className="mt-1 h-4 w-4 accent-[var(--primary)]"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p
                                  className={`text-sm font-semibold ${
                                    isSelected
                                      ? "text-white"
                                      : "text-slate-900"
                                  }`}
                                >
                                  Order #{order.orderNumber || order.id.slice(0, 8)}
                                </p>

                                <div className="flex flex-wrap items-center gap-2">
                                  {isDisabled && (
                                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                                      Branch Mismatch
                                    </span>
                                  )}

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                      isSelected
                                        ? "bg-white/15 text-white"
                                        : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {order.status}
                                  </span>
                                </div>
                              </div>

                              <div
                                className={`mt-3 grid gap-3 sm:grid-cols-2 ${
                                  isSelected ? "text-white/90" : "text-slate-600"
                                }`}
                              >
                                <div
                                  className={`rounded-xl p-3 ${
                                    isSelected ? "bg-white/10" : "bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 text-xs font-medium">
                                    <Store size={14} />
                                    <span>Branch</span>
                                  </div>
                                  <p className="mt-1 text-sm font-semibold">
                                    {order?.branch?.name || "No Branch"}
                                  </p>
                                </div>

                                <div
                                  className={`rounded-xl p-3 ${
                                    isSelected ? "bg-white/10" : "bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 text-xs font-medium">
                                    <ShoppingBag size={14} />
                                    <span>Order Type</span>
                                  </div>
                                  <p className="mt-1 text-sm font-semibold">
                                    {order?.orderType || "-"}
                                  </p>
                                </div>

                                <div
                                  className={`rounded-xl p-3 ${
                                    isSelected ? "bg-white/10" : "bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 text-xs font-medium">
                                    <CircleDollarSign size={14} />
                                    <span>Total Amount</span>
                                  </div>
                                  <p className="mt-1 text-sm font-semibold">
                                    {order?.totalAmount ?? order?.payableAmount ?? 0}
                                  </p>
                                </div>

                                <div
                                  className={`rounded-xl p-3 ${
                                    isSelected ? "bg-white/10" : "bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 text-xs font-medium">
                                    <CalendarDays size={14} />
                                    <span>Created At</span>
                                  </div>
                                  <p className="mt-1 text-sm font-semibold">
                                    {order?.createdAt
                                      ? new Date(order.createdAt).toLocaleString()
                                      : "-"}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div
                                  className={`rounded-xl px-3 py-3 text-xs ${
                                    isSelected ? "bg-white/10 text-white" : "bg-slate-50 text-slate-600"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <User size={14} />
                                    <span className="font-medium">Customer</span>
                                  </div>
                                  <p className="mt-1 text-sm font-semibold">
                                    {order?.customer?.fullName || "-"}
                                  </p>
                                </div>

                                <div
                                  className={`rounded-xl px-3 py-3 text-xs ${
                                    isSelected ? "bg-white/10 text-white" : "bg-slate-50 text-slate-600"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Phone size={14} />
                                    <span className="font-medium">Phone</span>
                                  </div>
                                  <p className="mt-1 text-sm font-semibold">
                                    {order?.customer?.phone || "-"}
                                  </p>
                                </div>
                              </div>

                              {isDisabled && (
                                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                  This order belongs to{" "}
                                  <span className="font-semibold">
                                    {order?.branch?.name || "another branch"}
                                  </span>
                                  , while this deliveryman belongs to{" "}
                                  <span className="font-semibold">
                                    {deliveryman?.branch?.name || "another branch"}
                                  </span>
                                  . You cannot assign this order.
                                </div>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">
                Order Summary
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Review selected deliveryman and order before assigning.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Deliveryman Branch
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {deliveryman?.branch?.name || "No Branch"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Selected Order Branch
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedOrder?.branch?.name || "No Order Selected"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Selected Order
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedOrder
                      ? `#${selectedOrder.orderNumber || selectedOrder.id.slice(0, 8)}`
                      : "No Order Selected"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Match Status
                  </p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      selectedOrder
                        ? canAssignSelectedOrder
                          ? "text-emerald-600"
                          : "text-amber-600"
                        : "text-slate-900"
                    }`}
                  >
                    {!selectedOrder
                      ? "No Order Selected"
                      : canAssignSelectedOrder
                      ? "Branch Matched"
                      : "Branch Mismatch"}
                  </p>
                </div>
              </div>

              {selectedOrder && canAssignSelectedOrder && (
                <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">
                        Ready to assign
                      </p>
                      <p className="mt-1 text-xs text-emerald-700">
                        This order can be assigned to{" "}
                        {deliveryman?.firstName || "the selected deliveryman"} because
                        both belong to{" "}
                        <span className="font-semibold">
                          {deliveryman?.branch?.name || "the same branch"}.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedOrder && !canAssignSelectedOrder && (
                <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Cannot assign this order
                      </p>
                      <p className="mt-1 text-xs text-amber-700">
                        The selected order branch and deliveryman branch do not match.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={assignMutation.isPending}
                  className="h-11 rounded-xl"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={handleAssign}
                  disabled={!selectedOrderId || !canAssignSelectedOrder || assignMutation.isPending}
                  className="h-11 rounded-xl px-6 text-white hover:text-white"
                >
                  {assignMutation.isPending ? "Assigning..." : "Assign Order"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
