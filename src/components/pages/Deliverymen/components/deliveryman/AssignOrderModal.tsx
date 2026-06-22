"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  ListChecks,
  Loader2,
  Phone,
  Search,
  ShoppingBag,
  Store,
  User,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useGetBranches } from "@/hooks/useBranches";
import { useAssignOrdersToDeliveryman, useDeliveryman } from "@/hooks/useDeliverymen";
import { useOrders } from "@/hooks/useOrders";
import { formatDateTime24 } from "@/lib/date-time-format";
import type { Order } from "@/types/orders";

interface AssignOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryman: any;
  onSuccess?: () => void;
}

type AssignmentResult = {
  orderId: string;
  success: boolean;
  message?: string;
};

const ASSIGNABLE_STATUSES = [
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_PICKUP",
];

const KIND_OPTIONS = ["all", "order", "group-orders"];

const getOrderDisplayId = (order: Order) => order.orderNumber || order.id.slice(0, 8);

const getBranchId = (order: Order) => order.branchId || order.branch?.id || null;

export default function AssignOrderModal({
  open,
  onOpenChange,
  deliveryman,
  onSuccess,
}: AssignOrderModalProps) {
  const t = useTranslations("deliverymen");
  const { user, isBranchAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState("all");
  const [status, setStatus] = useState("READY_FOR_PICKUP");
  const [kind, setKind] = useState("all");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [assignmentResults, setAssignmentResults] = useState<AssignmentResult[]>([]);

  const deliverymanBranchId =
    deliveryman?.branchId || deliveryman?.branch?.id || null;

  const { data: deliverymanDetail, isFetching: isFetchingDeliveryman } =
    useDeliveryman(open ? deliveryman?.id : undefined);

  const assignMutation = useAssignOrdersToDeliveryman({
    messages: {
      success: t("messages.orderAssigned"),
      error: t("messages.failedAssignOrder"),
    },
  });

  const { data: branchesResponse } = useGetBranches({
    restaurantId: user?.restaurantId ?? undefined,
    includeInactive: true,
  });

  const branches = Array.isArray(branchesResponse?.data)
    ? branchesResponse.data
    : [];

  const selectedBranchId =
    branchId === "all" ? undefined : branchId || undefined;

  const { orders, loading, isFetching } = useOrders({
    page: 1,
    limit: 100,
    search,
    restaurantId: user?.restaurantId ?? undefined,
    branchId: selectedBranchId,
    status,
    orderType: "DELIVERY",
    sortBy: "createdAt",
    sortOrder: "DESC",
    kind: kind === "all" ? undefined : kind,
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      setSearch("");
      setStatus("READY_FOR_PICKUP");
      setKind("all");
      setSelectedOrderIds([]);
      setAssignmentResults([]);
      return;
    }

    setBranchId(deliverymanBranchId || (isBranchAdmin ? user?.branchId || "all" : "all"));
  }, [deliverymanBranchId, isBranchAdmin, open, user?.branchId]);

  const activeDeliveryOrders = useMemo(() => {
    const activeOrders = deliverymanDetail?.orders;
    if (!Array.isArray(activeOrders)) return [];

    return activeOrders.filter((order: any) => order?.status === "OUT_FOR_DELIVERY");
  }, [deliverymanDetail]);

  const driverCanReceiveOrders =
    deliveryman?.status === "AVAILABLE" || deliveryman?.status === "BUSY";

  const isBlockedByActiveDelivery = activeDeliveryOrders.length > 0;
  const isDriverBlocked = !driverCanReceiveOrders || isBlockedByActiveDelivery;

  const filteredOrders = useMemo(() => {
    return (orders || []).filter((order: Order) => {
      const isAlreadyAssigned = Boolean(order.deliverymanId);
      const isDelivery = order.orderType === "DELIVERY";
      const isAllowedStatus = ASSIGNABLE_STATUSES.includes(order.status);

      return !isAlreadyAssigned && isDelivery && isAllowedStatus;
    });
  }, [orders]);

  const selectedOrders = useMemo(
    () => filteredOrders.filter((order: Order) => selectedOrderIds.includes(order.id)),
    [filteredOrders, selectedOrderIds],
  );

  const isBranchMatched = (order: Order) => {
    const orderBranchId = getBranchId(order);
    return (
      Boolean(deliverymanBranchId) &&
      Boolean(orderBranchId) &&
      deliverymanBranchId === orderBranchId
    );
  };

  const assignableSelectedOrders = selectedOrders.filter(isBranchMatched);
  const hasBlockedSelection = selectedOrders.length !== assignableSelectedOrders.length;

  const toggleOrder = (order: Order) => {
    if (!isBranchMatched(order) || isDriverBlocked) return;

    setSelectedOrderIds((current) =>
      current.includes(order.id)
        ? current.filter((id) => id !== order.id)
        : [order.id],
    );
    setAssignmentResults([]);
  };

  const handleAssign = async () => {
    if (!deliveryman?.id || assignableSelectedOrders.length === 0 || isDriverBlocked) {
      return;
    }

    const results = await assignMutation.mutateAsync({
      id: deliveryman.id,
      orderIds: assignableSelectedOrders.map((order) => order.id),
    });

    setAssignmentResults(results);

    if (results.some((result) => result.success)) {
      setSelectedOrderIds((current) =>
        current.filter(
          (orderId) =>
            !results.some((result) => result.orderId === orderId && result.success),
        ),
      );
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-24px)] max-w-none overflow-hidden border-0 p-0 shadow-2xl sm:w-[calc(100vw-48px)] sm:max-w-[calc(100vw-48px)] 2xl:max-w-[1500px]">
        <div className="flex max-h-[92vh] min-w-0 flex-col overflow-hidden">
          <div
            className="px-6 py-5 text-white"
            style={{
              background: "linear-gradient(135deg, var(--primary), #9f1114)",
            }}
          >
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl font-semibold tracking-tight text-white">
                {t("assignOrder.title")}
              </DialogTitle>
              <DialogDescription className="text-sm text-white/80">
                {t("assignOrder.description")}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid min-w-0 gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur sm:grid-cols-2 xl:grid-cols-4">
              <SummaryTile label={t("assignOrder.deliveryman")} value={deliveryman ? `${deliveryman.firstName || ""} ${deliveryman.lastName || ""}` : "-"} />
              <SummaryTile label={t("assignOrder.phone")} value={deliveryman?.phone || "-"} />
              <SummaryTile label={t("assignOrder.branch")} value={deliveryman?.branch?.name || t("noBranch")} />
              <SummaryTile label={t("assignOrder.status")} value={deliveryman?.status || "-"} />
            </div>
          </div>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 p-4 sm:p-6">
            <div className="mb-5 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.4fr)_minmax(180px,220px)_minmax(180px,220px)_minmax(150px,180px)]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t("assignOrder.searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-red-100"
                />
              </div>

              <Select
                value={branchId}
                onValueChange={(value) => {
                  setBranchId(value);
                  setSelectedOrderIds([]);
                  setAssignmentResults([]);
                }}
              >
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white">
                  <SelectValue placeholder={t("assignOrder.branchFilter")} />
                </SelectTrigger>
                <SelectContent>
                  {!isBranchAdmin && (
                    <SelectItem value="all">{t("assignOrder.allBranches")}</SelectItem>
                  )}
                  {branches.map((branch: any) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name || branch.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setSelectedOrderIds([]);
                  setAssignmentResults([]);
                }}
              >
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white">
                  <SelectValue placeholder={t("assignOrder.statusFilter")} />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_STATUSES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={kind}
                onValueChange={(value) => {
                  setKind(value);
                  setSelectedOrderIds([]);
                  setAssignmentResults([]);
                }}
              >
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white">
                  <SelectValue placeholder={t("assignOrder.kindFilter")} />
                </SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`assignOrder.kind.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isDriverBlocked && (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">{t("assignOrder.driverBlockedTitle")}</p>
                    <p className="mt-1 text-xs leading-5">
                      {isBlockedByActiveDelivery
                        ? t("assignOrder.driverActiveDeliveryDescription")
                        : t("assignOrder.driverStatusDescription")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
              <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {t("assignOrder.availableOrders")}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {t("assignOrder.availableOrdersDescription")}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {t("assignOrder.selectedCount", {
                      count: assignableSelectedOrders.length,
                    })}
                  </span>
                </div>

                <div className="max-h-[560px] overflow-y-auto">
                  {loading || isFetching || isFetchingDeliveryman ? (
                    <div className="flex min-h-[260px] items-center justify-center gap-2 p-6 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("assignOrder.loadingOrders")}
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="flex min-h-[260px] items-center justify-center p-6 text-sm text-slate-500">
                      {t("assignOrder.noOrdersFound")}
                    </div>
                  ) : (
                    <div className="grid min-w-0 gap-3 p-3 md:grid-cols-2 2xl:grid-cols-3">
                      {filteredOrders.map((order: Order) => {
                        const isSelected = selectedOrderIds.includes(order.id);
                        const isMatched = isBranchMatched(order);
                        const isDisabled = !isMatched || isDriverBlocked;

                        return (
                          <button
                            key={order.id}
                            type="button"
                            onClick={() => toggleOrder(order)}
                            disabled={isDisabled}
                            className={`min-w-0 rounded-2xl border p-4 text-left transition-all ${
                              isDisabled
                                ? "cursor-not-allowed border-slate-200 bg-slate-100/80 opacity-70"
                                : isSelected
                                  ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-lg"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p
                                  className={`truncate text-sm font-semibold ${
                                    isSelected ? "text-white" : "text-slate-900"
                                  }`}
                                >
                                  {t("assignOrder.orderNumber", {
                                    id: getOrderDisplayId(order),
                                  })}
                                </p>
                                <p
                                  className={`mt-1 text-xs ${
                                    isSelected ? "text-white/75" : "text-slate-500"
                                  }`}
                                >
                                  {order.createdAt
                                    ? formatDateTime24({ value: order.createdAt })
                                    : "-"}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  isSelected
                                    ? "bg-white/15 text-white"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {order.status.replaceAll("_", " ")}
                              </span>
                            </div>

                            <div
                              className={`mt-4 grid gap-2 ${
                                isSelected ? "text-white/90" : "text-slate-600"
                              }`}
                            >
                              <CardLine icon={<Store size={14} />} label={t("assignOrder.branch")} value={order.branch?.name || t("noBranch")} selected={isSelected} />
                              <CardLine icon={<ShoppingBag size={14} />} label={t("assignOrder.orderType")} value={order.orderType || "-"} selected={isSelected} />
                              <CardLine icon={<CircleDollarSign size={14} />} label={t("assignOrder.totalAmount")} value={String(order.totalAmount ?? 0)} selected={isSelected} />
                              <CardLine icon={<User size={14} />} label={t("assignOrder.customer")} value={order.customer?.fullName || order.customer?.name || "-"} selected={isSelected} />
                              <CardLine icon={<Phone size={14} />} label={t("assignOrder.phone")} value={order.customer?.phone || "-"} selected={isSelected} />
                            </div>

                            {!isMatched && (
                              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                {t("assignOrder.branchMismatch")}
                              </div>
                            )}

                            {isSelected && (
                              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-white">
                                <CheckCircle2 className="h-4 w-4" />
                                {t("assignOrder.selected")}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-0 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-red-50 p-3 text-[var(--primary)]">
                      <ListChecks className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {t("assignOrder.orderSummary")}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {t("assignOrder.orderSummaryDescription")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <InfoTile label={t("assignOrder.deliverymanBranch")} value={deliveryman?.branch?.name || t("noBranch")} />
                    <InfoTile label={t("assignOrder.selectedOrders")} value={String(assignableSelectedOrders.length)} />
                    <InfoTile label={t("assignOrder.matchStatus")} value={hasBlockedSelection ? t("assignOrder.branchMismatch") : t("assignOrder.branchMatched")} tone={hasBlockedSelection ? "warning" : "success"} />
                  </div>

                  {assignableSelectedOrders.length > 0 && !isDriverBlocked && (
                    <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-sm font-semibold text-emerald-800">
                            {t("assignOrder.readyToAssign")}
                          </p>
                          <p className="mt-1 text-xs text-emerald-700">
                            {t("assignOrder.multiReadyDescription", {
                              deliveryman:
                                deliveryman?.firstName ||
                                t("assignOrder.selectedDeliverymanFallback"),
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex flex-col gap-2">
                    <Button
                      type="button"
                      onClick={handleAssign}
                      disabled={
                        assignableSelectedOrders.length === 0 ||
                        isDriverBlocked ||
                        assignMutation.isPending
                      }
                      className="h-11 rounded-xl px-6 text-white hover:text-white"
                    >
                      {assignMutation.isPending
                        ? t("actions.assigning")
                        : t("actions.assignOrder")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={assignMutation.isPending}
                      className="h-11 rounded-xl"
                    >
                      {t("actions.cancel")}
                    </Button>
                  </div>
                </div>

                {assignmentResults.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {t("assignOrder.assignmentResults")}
                    </h3>
                    <div className="mt-3 space-y-2">
                      {assignmentResults.map((result) => (
                        <div
                          key={result.orderId}
                          className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${
                            result.success
                              ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                              : "border-red-100 bg-red-50 text-red-800"
                          }`}
                        >
                          {result.success ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                          ) : (
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          )}
                          <span>
                            {result.orderId.slice(0, 8)} ·{" "}
                            {result.success
                              ? t("assignOrder.assigned")
                              : result.message || t("messages.failedAssignOrder")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-3">
      <p className="text-xs uppercase tracking-wide text-white/70">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function CardLine({
  icon,
  label,
  value,
  selected,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  selected: boolean;
}) {
  return (
    <div className={`rounded-xl p-2.5 ${selected ? "bg-white/10" : "bg-slate-50"}`}>
      <div className="flex items-center gap-2 text-xs font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function InfoTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "warning";
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-semibold ${
          tone === "success"
            ? "text-emerald-600"
            : tone === "warning"
              ? "text-amber-600"
              : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
