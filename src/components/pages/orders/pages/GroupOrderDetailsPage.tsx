"use client";

import Header from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { useGetOrderById } from "@/hooks/useOrders";
import { useTranslations } from "next-intl";

export default function GroupOrderDetails() {
  const t = useTranslations("orders");
  const { orderId } = useParams();
  const { data: order, isLoading: loading } = useGetOrderById(orderId as string);



  if (loading || !order) {
    return (
      <div className="p-6 text-center text-gray-400">
        {t("loadingDetails")}
      </div>
    );
  }

  const participants = order?.participants || [];
  const totalItems = order?.itemCount || 0;

  const getUserName = (user: any) => {
    return (
      user?.fullName ||
      `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
      t("userFallback")
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Header
        title={t("groupOrder")}
        description={t("groupOrderDescription", {
          totalItems,
          participants: participants.length,
        })}
        titleClassName="text-2xl font-semibold text-dark"
        descriptionClassName="text-sm text-gray-500"
      />

      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-6">

        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500">{t("orderId")}#</p>
            <p className="text-red-600 font-semibold">#{order.id}</p>

            <h3 className="text-lg font-semibold mt-3">
              {order.restaurant?.name}
            </h3>

            <p className="text-xs text-gray-500">
              {order.branch?.name} • {order.paymentMethod} • #
              {order.groupOrderInviteCode}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-500">{t("orderType")}</p>
              <p className="text-red-600 font-semibold">
                {order.orderType}
              </p>
            </div>

            <Button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md">
              {t("printLabel")}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
          <span className="px-3 py-1 bg-gray-100 rounded">
            {t("statusLabel")}: {order.status}
          </span>
          <span className="px-3 py-1 bg-gray-100 rounded">
            {t("payment")}: {order.paymentStatus}
          </span>
          {order.isScheduled && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded">
              {t("scheduled")}:{" "}
              {new Date(order.orderTime).toLocaleString()}
            </span>
          )}
        </div>

        {/* PARTICIPANTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants.map((p: any, index: number) => (
            <div
              key={p.id}
              className="border border-[#BBBBBB] rounded-xl p-4 flex flex-col justify-between min-h-[200px]"
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-sm truncate">
                  {getUserName(p.user)}
                </h4>

                <span className="text-[10px] bg-[#FFE2DE] px-2 py-1 rounded">
                  {p.isHost ? t("host") : p.status}
                </span>
              </div>

              {/* ITEMS */}
              <div className="space-y-2">
                {p.items?.map((item: any, i: number) => (
                  <div key={i} className="flex gap-2 items-center">
                    <img
                      src={item.menuItem?.imageUrl}
                      alt=""
                      className="w-9 h-9 rounded object-cover"
                    />

                    <div className="flex-1">
                      <p className="truncate text-sm">
                        {item.menuItem?.name}
                      </p>

                      {/* modifiers */}
                      {item.modifiers?.length > 0 && (
                        <p className="text-[12px] text-gray-400">
                          + {t("modifiers")}
                        </p>
                      )}

                      {item.note && (
                        <p className="text-[11px] text-gray-500">
                          {t("note")}: {item.note}
                        </p>
                      )}
                    </div>

                    <span className="text-red-600 text-xs">
                      x{item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-2 border-t text-xs text-gray-500 flex justify-between">
                <span>{t("itemList", { count: p.items?.length || 0 })}</span>
                <span>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ITEMS PREVIEW ( NEW) */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-4">
        <h3 className="font-semibold">{t("itemsOverview")}</h3>

        {order.itemsPreview?.map((item: any) => (
          <div
            key={item.id}
            className="flex items-center gap-3 border-b pb-3 last:border-none"
          >
            <img
              src={item.imageUrl}
              className="w-12 h-12 rounded object-cover"
            />

            <div className="flex-1">
              <p className="font-medium text-sm">
                {item.menuItemName}
              </p>

              {item.variationName && (
                <p className="text-xs text-gray-400">
                  {item.variationName}
                </p>
              )}

              {item.snapshotModifiers?.length > 0 && (
                <p className="text-xs text-gray-400">
                  + {item.snapshotModifiers.map((m: any) => m.name).join(", ")}
                </p>
              )}
            </div>

            <div className="text-right text-sm">
              <p>x{item.quantity}</p>
              <p className="text-green-600 font-medium">
                ${item.lineTotal}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-4">
        <h3 className="font-semibold">{t("orderSummary")}</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">{t("subtotal")}</p>
            <p>${order.subtotal}</p>
          </div>
          <div>
            <p className="text-gray-500">{t("deliveryFee")}</p>
            <p>${order.deliveryFee}</p>
          </div>
          <div>
            <p className="text-gray-500">{t("tax")}</p>
            <p>${order.taxAmount}</p>
          </div>
          <div>
            <p className="text-gray-500">{t("total")}</p>
            <p className="text-green-600 font-semibold">
              ${order.totalAmount}
            </p>
          </div>
        </div>
      </div>

      {order.customerNote && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h3 className="font-semibold mb-2">{t("customerNote")}</h3>
          <p className="text-sm text-gray-600">
            {order.customerNote}
          </p>
        </div>
      )}

       <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="font-semibold text-sm sm:text-base">
              {t("printConfiguration")}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              {t("printConfigurationDescription")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-[#bbbbbb] rounded-lg p-4">
              <p className="text-[10px] sm:text-xs text-primary mb-1">
                {t("printerDestination")}
              </p>
              <p className="text-xs sm:text-sm font-medium">
                {t("printerDestinationValue")}
              </p>
            </div>

            <div className="border border-[#bbbbbb] rounded-lg p-4">
              <p className="text-[10px] sm:text-xs text-primary mb-1">
                {t("labelSize")}
              </p>
              <p className="text-xs sm:text-sm font-medium">
                {t("labelSizeValue")}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[200px] h-[140px] sm:h-[160px] border-2 border-dashed border-[#bbbbbb] rounded-lg flex items-center justify-center text-center text-xs text-gray-400">
          <div>
            <div className="text-red-500 text-lg mb-2">▣▣</div>
            <p className="px-2">
              {t("scanPreview")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
