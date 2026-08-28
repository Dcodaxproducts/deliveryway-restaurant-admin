"use client";

import { useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import OrderDetailsMain from "@/components/pages/Orders/components/orders/details/OrderDetails";
import OrderDetailsHeader from "@/components/pages/Orders/components/orders/details/OrderDetailsHeader";
import OrderTrackingSection from "@/components/pages/Orders/components/orders/details/OrderTrackingSection";
import UserProfile from "@/components/pages/Orders/components/orders/details/UserProfile";
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
    return <div className="p-6">{t("loadingOrder")}</div>;
  }

  return (
    <div className="min-h-screen bg-muted/40 p-6 w-full">
      <OrderDetailsHeader order={order} />

      <div className="flex flex-col md:flex-row w-full gap-10">
        <OrderTrackingSection order={order} />
        <UserProfile order={order} />
      </div>

      <OrderDetailsMain order={order} />
    </div>
  );
}
