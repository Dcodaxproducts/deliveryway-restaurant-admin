"use client";

import { Phone, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

import { formatDeliveryAddress } from "@/components/pages/Orders/components/orders/details/order-details-utils";
import { formatTime24 } from "@/lib/date-time-format";
import { DetailPanel, InfoList } from "@/components/common/DetailLayout";

type Props = {
  order: {
    status?: string | null;
    isScheduled?: boolean | null;
    orderTime?: string | null;
    customer?: {
      id?: string | null;
      avatarUrl?: string | null;
      fullName?: string | null;
      phone?: string | null;
    } | null;
    deliveryAddress?: Parameters<typeof formatDeliveryAddress>[0];
  };
};

export default function OrderTrackingSection({ order }: Props) {
  const t = useTranslations("orders");
  const deliveryAddress = formatDeliveryAddress(order?.deliveryAddress);
  // =========================
  // ESTIMATED TIME
  // =========================
  const estimatedTime = order?.isScheduled
    ? formatTime24({ value: order.orderTime })
    : t("estimatedMinutes");

  return (
    <DetailPanel title={t("trackOrders")} description={order.status || t("tracking")}>
      <div className="space-y-6">
        <div className="relative h-[220px] overflow-hidden rounded-[var(--ui-radius-card)] bg-[var(--ui-surface-subtle)] sm:h-[260px]">

   <svg
            viewBox="0 0 700 140"
            className="absolute inset-0 w-full h-full"
            fill="none"
          >
            {/* full faded path */}
            <polyline
              points="20,50 140,90 260,40 380,110 520,50 640,100"
              stroke="#e5e7eb"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* active red path */}
            <polyline
              points="140,90 260,40 380,110 520,50 640,100"
              stroke="#dc2626"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/*  NEW: gray starting circle */}
            <circle cx="20" cy="50" r="14" fill="#d4d4d8" />

            {/* current position */}
            <circle cx="260" cy="40" r="14" fill="#dc2626" />

            {/* end dot */}
            <circle cx="640" cy="100" r="12" fill="#dc2626" />
          </svg>
          {/* TIME BUBBLE */}
          <div className="absolute left-1/2 top-[60px] z-10 -translate-x-1/2 rounded-[var(--ui-radius-control)] bg-[var(--ui-surface-raised)] px-4 py-2 text-sm font-semibold shadow-[var(--ui-shadow-sm)]">
            {estimatedTime}
            <p className="text-[11px] text-muted-foreground font-normal">
              {t("estimatedTime")}
            </p>
          </div>

        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-4 sm:w-1/3">
              <img
                src={order?.customer?.avatarUrl || "/dummy-user.jpg"}
                alt={order?.customer?.fullName || t("customer")}
                className="size-12 rounded-[var(--ui-radius-control)] object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {order?.customer?.fullName || "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("customerId", { id: order.customer?.id || "—" })}
                </p>
              </div>
          </div>
          <InfoList
            className="flex-1"
            items={[
              {
                id: "phone",
                label: t("phone"),
                value: order.customer?.phone,
                icon: <Phone />,
              },
              {
                id: "address",
                label: t("deliveryAddress"),
                value: deliveryAddress || t("takeawayOrder"),
                icon: <MapPin />,
              },
            ]}
          />
        </div>
      </div>
    </DetailPanel>
  );
}
