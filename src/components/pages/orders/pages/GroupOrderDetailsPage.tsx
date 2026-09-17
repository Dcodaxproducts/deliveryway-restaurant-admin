"use client";

import { Printer } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import Container from "@/components/common/Container";
import {
  DetailLayout,
  DetailPanel,
  InfoList,
} from "@/components/common/DetailLayout";
import { StatePanel } from "@/components/common/EmptyState";
import Header from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPaymentMethod } from "@/components/pages/Orders/components/orders/details/order-details-utils";
import { useCurrency } from "@/hooks/useCurrency";
import { useGetOrderById } from "@/hooks/useOrders";
import { formatDateTime24 } from "@/lib/date-time-format";

type GroupOrderUser = {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

type GroupOrderParticipantItem = {
  id?: string;
  quantity?: number;
  note?: string | null;
  modifiers?: unknown[];
  menuItem?: { name?: string | null; imageUrl?: string | null } | null;
};

type GroupOrderParticipant = {
  id: string;
  isHost?: boolean;
  status?: string | null;
  user?: GroupOrderUser | null;
  items?: GroupOrderParticipantItem[];
};

type GroupOrderPreviewItem = {
  id: string;
  imageUrl?: string | null;
  menuItemName?: string | null;
  variationName?: string | null;
  snapshotModifiers?: Array<{ name?: string | null }>;
  quantity?: number;
  lineTotal?: number;
};

type GroupOrderRecord = {
  id: string;
  orderType?: string | null;
  status?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  groupOrderInviteCode?: string | null;
  isScheduled?: boolean;
  orderTime?: string | null;
  itemCount?: number;
  participants?: GroupOrderParticipant[];
  itemsPreview?: GroupOrderPreviewItem[];
  restaurant?: { name?: string | null } | null;
  branch?: { name?: string | null } | null;
  subtotal?: number;
  deliveryFee?: number;
  taxAmount?: number;
  totalAmount?: number;
  customerNote?: string | null;
};

const getUserName = (user: GroupOrderUser | null | undefined, fallback: string) =>
  user?.fullName ||
  `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
  fallback;

export default function GroupOrderDetails() {
  const t = useTranslations("orders");
  const { orderId } = useParams();
  const { data, isLoading } = useGetOrderById(orderId as string);
  const { formatMoney } = useCurrency();

  if (isLoading) {
    return (
      <Container>
        <StatePanel state="loading" title={t("loadingDetails")} description="" />
      </Container>
    );
  }

  if (!data) {
    return (
      <Container>
        <StatePanel state="unavailable" title={t("loadingDetails")} description="" />
      </Container>
    );
  }

  const order = data as GroupOrderRecord;
  const participants = order.participants || [];
  const totalItems = order.itemCount || 0;
  const paymentMethod = formatPaymentMethod(order.paymentMethod, {
    COD: t("paymentMethods.COD"),
    CARD_ON_DELIVERY: t("paymentMethods.CARD_ON_DELIVERY"),
    STRIPE: t("paymentMethods.STRIPE"),
    PAYPAL: t("paymentMethods.PAYPAL"),
    WALLET: t("paymentMethods.WALLET"),
  });

  return (
    <Container width="wide">
      <Header
        title={t("groupOrder")}
        description={t("groupOrderDescription", {
          totalItems,
          participants: participants.length,
        })}
        actions={
          <Button type="button" onClick={() => window.print()}>
            <Printer aria-hidden="true" />
            {t("printLabel")}
          </Button>
        }
      />

      <DetailLayout>
        <DetailPanel
          title={`${t("orderId")} #${order.id}`}
          description={[order.restaurant?.name, order.branch?.name, paymentMethod]
            .filter(Boolean)
            .join(" • ")}
          action={<Badge variant="outline">{order.status}</Badge>}
        >
          <InfoList
            columns={3}
            items={[
              { id: "type", label: t("orderType"), value: order.orderType },
              {
                id: "payment",
                label: t("payment"),
                value: order.paymentStatus,
              },
              {
                id: "invite",
                label: t("groupOrder"),
                value: order.groupOrderInviteCode,
              },
              {
                id: "scheduled",
                label: t("scheduled"),
                value: order.orderTime
                  ? formatDateTime24({ value: order.orderTime })
                  : undefined,
                hidden: !order.isScheduled,
              },
            ]}
          />
        </DetailPanel>

        <DetailPanel title={t("participants")}>
          {participants.length === 0 ? (
            <StatePanel state="empty" compact />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {participants.map((participant) => (
                <section
                  key={participant.id}
                  className="flex min-h-48 flex-col rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="truncate text-sm font-semibold">
                      {getUserName(participant.user, t("userFallback"))}
                    </h3>
                    <Badge variant={participant.isHost ? "default" : "secondary"}>
                      {participant.isHost ? t("host") : participant.status}
                    </Badge>
                  </div>
                  <div className="flex-1 space-y-3">
                    {participant.items?.map((item, index) => (
                      <div key={item.id || index} className="flex items-center gap-3">
                        {item.menuItem?.imageUrl ? (
                          <img
                            src={item.menuItem.imageUrl}
                            alt={item.menuItem.name || ""}
                            className="size-10 rounded-[var(--ui-radius-control)] object-cover"
                          />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.menuItem?.name}
                          </p>
                          {item.modifiers?.length ? (
                            <p className="text-xs text-[var(--ui-text-muted)]">
                              + {t("modifiers")}
                            </p>
                          ) : null}
                          {item.note ? (
                            <p className="text-xs text-[var(--ui-text-muted)]">
                              {t("note")}: {item.note}
                            </p>
                          ) : null}
                        </div>
                        <span className="text-xs font-semibold text-primary">
                          ×{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between border-t border-[var(--ui-border)] pt-3 text-xs text-[var(--ui-text-muted)]">
                    <span>{t("itemList", { count: participant.items?.length || 0 })}</span>
                    <span>{participant.status}</span>
                  </div>
                </section>
              ))}
            </div>
          )}
        </DetailPanel>

        <DetailPanel title={t("itemsOverview")}>
          {order.itemsPreview?.length ? (
            <div className="divide-y divide-[var(--ui-border)]">
              {order.itemsPreview.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.menuItemName || ""}
                      className="size-12 rounded-[var(--ui-radius-control)] object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.menuItemName}</p>
                    {item.variationName ? (
                      <p className="text-xs text-[var(--ui-text-muted)]">{item.variationName}</p>
                    ) : null}
                    {item.snapshotModifiers?.length ? (
                      <p className="truncate text-xs text-[var(--ui-text-muted)]">
                        + {item.snapshotModifiers.map((modifier) => modifier.name).join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right text-sm">
                    <p>×{item.quantity}</p>
                    <p className="font-semibold text-emerald-600">
                      {formatMoney(item.lineTotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <StatePanel state="empty" compact />
          )}
        </DetailPanel>

        <DetailPanel title={t("orderSummary")}>
          <InfoList
            columns={3}
            items={[
              { id: "subtotal", label: t("subtotal"), value: formatMoney(order.subtotal) },
              {
                id: "delivery-fee",
                label: t("deliveryFee"),
                value: formatMoney(order.deliveryFee),
              },
              { id: "tax", label: t("tax"), value: formatMoney(order.taxAmount) },
              { id: "total", label: t("total"), value: formatMoney(order.totalAmount) },
            ]}
          />
        </DetailPanel>

        {order.customerNote ? (
          <DetailPanel title={t("customerNote")}>
            <p className="text-sm leading-6 text-[var(--ui-text-muted)]">{order.customerNote}</p>
          </DetailPanel>
        ) : null}

        <DetailPanel
          title={t("printConfiguration")}
          description={t("printConfigurationDescription")}
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_200px] lg:items-center">
            <InfoList
              items={[
                {
                  id: "destination",
                  label: t("printerDestination"),
                  value: t("printerDestinationValue"),
                },
                { id: "size", label: t("labelSize"), value: t("labelSizeValue") },
              ]}
            />
            <div className="flex min-h-32 items-center justify-center rounded-[var(--ui-radius-card)] border border-dashed border-[var(--ui-border-strong)] px-4 text-center text-xs text-[var(--ui-text-muted)]">
              {t("scanPreview")}
            </div>
          </div>
        </DetailPanel>
      </DetailLayout>
    </Container>
  );
}
