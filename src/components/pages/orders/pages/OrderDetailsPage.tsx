"use client";

import { useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import Container from "@/components/common/Container";
import { StatePanel } from "@/components/common/EmptyState";
import { DetailLayout } from "@/components/common/DetailLayout";
import OrderDetailsMain from "@/components/pages/Orders/components/orders/details/OrderDetails";
import OrderDetailsHeader from "@/components/pages/Orders/components/orders/details/OrderDetailsHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetOrderById } from "@/hooks/useOrders";
import { silenceOrderAlert } from "@/hooks/useRealtimeOrderNotifications";
import { shouldSilenceOrderAlertOnDetailsOpen } from "@/lib/new-order-navigation";

function OrderDetailsSkeleton() {
  return (
    <Container width="wide">
      <div data-testid="order-details-skeleton" className="space-y-5" aria-label="Loading order details">
        <div className="flex flex-col gap-4 border-b border-[var(--ui-border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-5 w-80 max-w-full" />
          </div>
          <Skeleton className="h-10 w-56 max-w-full" />
        </div>
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
          <div className="space-y-5">
            <Skeleton className="h-72 w-full rounded-[var(--ui-radius-card)]" />
            <Skeleton className="h-56 w-full rounded-[var(--ui-radius-card)]" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-52 w-full rounded-[var(--ui-radius-card)]" />
            <Skeleton className="h-64 w-full rounded-[var(--ui-radius-card)]" />
          </div>
        </div>
      </div>
    </Container>
  );
}

export default function OrderDetails() {
  const t = useTranslations("orders");
  const { orderId } = useParams();
  const searchParams = useSearchParams();
  const shouldSilenceAlert = useRef(
    shouldSilenceOrderAlertOnDetailsOpen(searchParams.get("acceptOrder")),
  ).current;
  const { data: order, isLoading, isError, refetch } = useGetOrderById(orderId as string);

  useEffect(() => {
    if (shouldSilenceAlert && typeof orderId === "string") silenceOrderAlert(orderId);
  }, [orderId, shouldSilenceAlert]);

  if (isLoading) return <OrderDetailsSkeleton />;

  if (isError) {
    return (
      <Container width="wide">
        <StatePanel
          state="error"
          title={t("orderLoadError")}
          description={t("orderLoadErrorDescription")}
          action={<Button onClick={() => void refetch()}>{t("retry")}</Button>}
        />
      </Container>
    );
  }

  if (!order) {
    return (
      <Container width="wide">
        <StatePanel state="empty" title={t("orderNotFound")} description={t("orderNotFoundDescription")} />
      </Container>
    );
  }

  return (
    <Container width="wide">
      <div className="min-w-0 space-y-5 overflow-x-clip">
        <OrderDetailsHeader order={order} />
        <DetailLayout aside={undefined}>
          <OrderDetailsMain order={order} />
        </DetailLayout>
      </div>
    </Container>
  );
}
