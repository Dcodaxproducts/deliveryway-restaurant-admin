"use client";

import { useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import OrderDetailsMain from "@/components/pages/Orders/components/orders/details/OrderDetails";
import OrderDetailsHeader from "@/components/pages/Orders/components/orders/details/OrderDetailsHeader";
import OrderTrackingSection from "@/components/pages/Orders/components/orders/details/OrderTrackingSection";
import UserProfile from "@/components/pages/Orders/components/orders/details/UserProfile";
import Container from "@/components/common/Container";
import { DetailLayout } from "@/components/common/DetailLayout";
import { StatePanel } from "@/components/common/EmptyState";
import { useGetOrderById } from "@/hooks/useOrders";
import { silenceOrderAlert } from "@/hooks/useRealtimeOrderNotifications";
import { shouldSilenceOrderAlertOnDetailsOpen } from "@/lib/new-order-navigation";

export default function OrderDetails() {
  const t = useTranslations("orders");
  const { orderId } = useParams();
  const searchParams = useSearchParams();
  const shouldSilenceAlert = useRef(
    shouldSilenceOrderAlertOnDetailsOpen(searchParams.get("acceptOrder")),
  ).current;

  const { data: order, isLoading: loading } = useGetOrderById(orderId as string);

  useEffect(() => {
    if (shouldSilenceAlert && typeof orderId === "string") {
      silenceOrderAlert(orderId);
    }
  }, [orderId, shouldSilenceAlert]);

  if (loading || !order) {
    return (
      <Container>
        <StatePanel
          state="loading"
          title={t("loadingOrder")}
          description=""
        />
      </Container>
    );
  }

  return (
    <Container width="wide">
      <OrderDetailsHeader order={order} />
      <DetailLayout aside={<UserProfile order={order} />}>
        <OrderTrackingSection order={order} />
        <OrderDetailsMain order={order} />
      </DetailLayout>
    </Container>
  );
}
