"use client";

import { Truck } from "lucide-react";
import { useTranslations } from "next-intl";

import { formatDeliveryAddress } from "@/components/pages/Orders/components/orders/details/order-details-utils";
import { DetailPanel, InfoList } from "@/components/common/DetailLayout";

type UserProfileOrder = {
  customer?: {
    avatarUrl?: string | null;
    fullName?: string | null;
  } | null;
  customerNote?: string | null;
  deliveryAddress?: Parameters<typeof formatDeliveryAddress>[0];
};

const UserProfile = ({ order }: { order: UserProfileOrder }) => {
  const t = useTranslations("orders");
  const customer = order?.customer;
  const deliveryAddress = formatDeliveryAddress(order?.deliveryAddress);

  return (
    <DetailPanel
      title={t("customer")}
      className="overflow-hidden"
      padding="none"
    >
      <div className="flex flex-col items-center px-5 py-6 text-center">
        <img
          src={customer?.avatarUrl || "/dummy-user-2.jpg"}
          alt={customer?.fullName || t("unknownUser")}
          className="mb-4 size-24 rounded-[var(--ui-radius-card)] object-cover"
        />
        <h3 className="text-lg font-semibold">
          {customer?.fullName || t("unknownUser")}
        </h3>
        <p className="mt-1 rounded-full bg-[var(--ui-brand-soft)] px-3 py-1 text-xs font-medium text-primary">
          {t("customerRole")}
        </p>
      </div>
      <div className="border-t border-[var(--ui-border)] px-5 py-5">
        <InfoList
          columns={1}
          items={[
            {
              id: "note",
              label: t("noteOrder"),
              value: order.customerNote || t("noOrderNote"),
            },
            {
              id: "address",
              label: t("deliveryAddress"),
              value: deliveryAddress || t("takeawayOrder"),
              icon: <Truck />,
            },
          ]}
        />
      </div>
    </DetailPanel>
  );
};

export default UserProfile;
