"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { useAuthContext } from "@/components/providers/auth-provider";


import OrderDetailsMain from "@/components/orders/details/OrderDetails";
import OrderDetailsHeader from "@/components/orders/details/OrderDetailsHeader";
import OrderTrackingSection from "@/components/orders/details/OrderTrackingSection";
import UserProfile from "@/components/orders/details/UserProfile";
import { useHttpClient } from "@/hooks/useHttpClient";

export default function OrderDetails() {
  const { orderId } = useParams();

  const { user, token } = useAuthContext();
  const { get, loading } = useHttpClient(token);

  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (!orderId || !token) return;

    const fetchOrder = async () => {
      const res = await get(`/v1/orders/${orderId}`);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      setOrder(res?.data);
    };

    fetchOrder();
  }, [orderId, token]);

  if (loading || !order) {
    return <div className="p-6">Loading order...</div>;
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