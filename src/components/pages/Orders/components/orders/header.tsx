"use client";

import { FormSelect } from "@/components/ui/form-select";

import { BellRing, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/common/PageHeader";
import { formatDateTime24 } from "@/lib/date-time-format";
import { useTranslations } from "next-intl";
import type { Order } from "@/types/orders";
import { useEffect, useState } from "react";
import {
  ORDER_SOUND_SETTING_EVENT,
  ORDER_SOUND_MODE_STORAGE_KEY,
  ORDER_SOUND_STORAGE_KEY,
  type OrderSoundMode,
  unlockOrderNotificationSound,
} from "@/hooks/useRealtimeOrderNotifications";
import Link from "next/link";

interface HeaderProps {
  title: string;
  description: string;
  orders: Order[];
}

export function OrdersHeader({ title, description, orders }: HeaderProps) {
  const common = useTranslations("common");
  const ordersT = useTranslations("orders");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundMode, setSoundMode] = useState<OrderSoundMode>("REPEAT");
  useEffect(() => {
    setSoundEnabled(
      window.localStorage.getItem(ORDER_SOUND_STORAGE_KEY) !== "false",
    );
    setSoundMode(
      window.localStorage.getItem(ORDER_SOUND_MODE_STORAGE_KEY) === "ONCE"
        ? "ONCE"
        : "REPEAT",
    );
  }, []);

  //  CSV GENERATOR
  const handleExport = () => {
    if (!orders || orders.length === 0) return;

    const headers = [
      ordersT("orderId"),
      ordersT("customerName"),
      ordersT("phone"),
      ordersT("email"),
      ordersT("orderType"),
      ordersT("statusLabel"),
      ordersT("paymentMethod"),
      ordersT("paymentStatus"),
      ordersT("amount"),
      ordersT("date"),
    ];

    const rows = orders.map((o) => [
      o.id,
      o.customer?.fullName || "",
      o.customer?.phone || "",
      o.customer?.email || "",
      o.orderType || "",
      o.status || "",
      o.paymentMethod || "",
      o.paymentStatus || "",
      o.totalAmount ?? 0,
      o.createdAt ? formatDateTime24({ value: o.createdAt }) : "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((val) => `"${val}"`).join(","))
      .join("\n");

    //  CREATE FILE
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `orders-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Header
      title={title}
      description={description}
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            aria-pressed={soundEnabled}
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              window.localStorage.setItem(
                ORDER_SOUND_STORAGE_KEY,
                String(next),
              );
              if (next) {
                void unlockOrderNotificationSound();
              }
              window.dispatchEvent(new Event(ORDER_SOUND_SETTING_EVENT));
            }}
            className="w-full gap-2 sm:w-auto"
          >
            <BellRing size={18} />
            {soundEnabled
              ? ordersT("notificationSoundOn")
              : ordersT("notificationSoundOff")}
          </Button>
          <FormSelect
            value={soundMode}
            disabled={!soundEnabled}
            aria-label={ordersT("notificationSoundMode")}
            onChange={(event) => {
              const next = event.target.value as OrderSoundMode;
              setSoundMode(next);
              window.localStorage.setItem(ORDER_SOUND_MODE_STORAGE_KEY, next);
              window.dispatchEvent(new Event(ORDER_SOUND_SETTING_EVENT));
            }}
            className="h-10 w-full min-w-[180px] rounded-[var(--ui-radius-control)] border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <option value="ONCE">{ordersT("notificationSoundOnce")}</option>
            <option value="REPEAT">{ordersT("notificationSoundRepeat")}</option>
          </FormSelect>
          <Button asChild variant="outline" className="w-full gap-2 sm:w-auto">
            <Link href="/auto-printing">
              <Printer size={18} />
              {ordersT("printingSettings")}
            </Link>
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            className="w-full gap-2 sm:w-auto"
          >
            <Download size={18} className="text-gray-600" />
            <span>{common("export")}</span>
          </Button>
        </>
      }
    />
  );
}
