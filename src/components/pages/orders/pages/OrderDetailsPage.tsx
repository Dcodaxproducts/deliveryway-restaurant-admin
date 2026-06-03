"use client";

import { useParams } from "next/navigation";

import OrderDetailsMain from "@/components/pages/Orders/components/orders/details/OrderDetails";
import OrderDetailsHeader from "@/components/pages/Orders/components/orders/details/OrderDetailsHeader";
import OrderTrackingSection from "@/components/pages/Orders/components/orders/details/OrderTrackingSection";
import UserProfile from "@/components/pages/Orders/components/orders/details/UserProfile";
import { useGetOrderById } from "@/hooks/useOrders";
import { useTranslations } from "next-intl";

export default function OrderDetails() {
  const t = useTranslations("orders");
  const { orderId } = useParams();
  const { data: order, isLoading: loading } = useGetOrderById(orderId as string);

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
