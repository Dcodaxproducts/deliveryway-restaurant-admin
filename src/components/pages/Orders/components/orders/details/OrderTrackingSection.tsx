"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Phone, MapPin } from "lucide-react";

type Props = {
  order: any;
};

export default function OrderTrackingSection({ order }: Props) {
  // =========================
  // STATUS → PROGRESS MAPPING
  // =========================
  const getProgressIndex = () => {
    switch (order?.status) {
      case "PLACED":
        return 1;
      case "PREPARING":
        return 2;
      case "ON_DELIVERY":
        return 3;
      case "DELIVERED":
        return 4;
      default:
        return 2; // fallback so UI never looks broken
    }
  };

  const progress = getProgressIndex();

  // =========================
  // ESTIMATED TIME
  // =========================
  const estimatedTime = order?.isScheduled
    ? new Date(order.orderTime).toLocaleTimeString()
    : "4-6 mins";

  return (
    <Card className="w-full rounded-2xl shadow-sm border-0">
      <CardContent className="p-6 pt-0 space-y-8">
        <div className="relative bg-muted/40 rounded-2xl h-[280px] overflow-hidden">

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
          <div className="absolute left-[250px] top-[60px] bg-white shadow-md rounded-xl px-4 py-2 text-sm font-semibold z-10">
            {estimatedTime}
            <p className="text-[11px] text-muted-foreground font-normal">
              Estimated time
            </p>
          </div>

          <div className="absolute right-8 top-8 text-right z-10">
            <h3 className="text-lg font-semibold">Track Orders</h3>
            <p className="text-sm text-muted-foreground">
              {order?.status || "Tracking..."}
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

          {/* LEFT */}
          <div className="space-y-3">
            <p className="font-semibold text-base">Customer</p>

            <div className="flex items-center gap-4">
              <img
                src={order?.customer?.avatarUrl || "/dummy-user.jpg"}
                alt=""
                className="w-14 h-14 rounded-xl object-cover"
              />

              <div>
                <p className="font-semibold text-base">
                  {order?.customer?.fullName || "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">
                  ID {order?.customer?.id}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-wrap items-center gap-10">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Phone size={16} />
              {order?.customer?.phone || "N/A"}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground max-w-[260px]">
              <MapPin size={16} />
              {order?.deliveryAddress?.address || "Takeaway Order"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
