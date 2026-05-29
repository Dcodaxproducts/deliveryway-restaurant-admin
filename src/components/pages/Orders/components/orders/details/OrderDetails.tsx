"use client";

import { X } from "lucide-react";

const formatDate = (date?: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleString();
};

const OrderDetailsMain = ({ order }: { order: any }) => {
  const items = order?.items || [];

  const history = [
    {
      label: "Order Delivered",
      date: formatDate(order?.deliveredAt),
      active: !!order?.deliveredAt,
    },
    {
      label: "On Delivery",
      date: order?.status === "ON_DELIVERY" ? "In progress" : "-",
      active:
        order?.status === "ON_DELIVERY" ||
        order?.status === "DELIVERED",
    },
    {
      label: "Payment Success",
      date:
        order?.paymentStatus === "PAID"
          ? "Paid"
          : order?.paymentStatus,
      active:
        order?.paymentStatus === "PAID" ||
        order?.status === "DELIVERED",
    },
    {
      label: "Order Created",
      date: formatDate(order?.createdAt),
      active: true,
    },
  ];

  return (
    <div className="w-full mt-5">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-9">

        {/* ITEMS */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">

          {/*  Scroll wrapper for mobile ONLY */}
          <div className="w-full overflow-x-auto">
            
            {/* HEADER */}
            <div className="min-w-[600px] grid grid-cols-[1fr_80px_100px_120px_40px] text-xs sm:text-sm font-semibold text-gray-600 pb-4 border-b">
              <span>Items</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Price</span>
              <span className="text-right">Total Price</span>
              <span />
            </div>

            {/* ITEMS */}
            <div className="divide-y min-w-[600px]">
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_80px_100px_120px_40px] items-center py-4 sm:py-5"
                >
                  <div className="flex gap-3 sm:gap-4 min-w-0">
                    <img
                      src={item?.menuItem?.imageUrl}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover flex-shrink-0"
                    />

                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-semibold text-red-500 uppercase truncate">
                        {item?.menuItem?.category?.name || "Item"}
                      </p>

                      <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                        {item.menuItemName}
                      </p>

                      <p className="text-[10px] sm:text-xs text-gray-400 mt-1 truncate">
                        {item.variationName}
                      </p>
                    </div>
                  </div>

                  <span className="text-center text-xs sm:text-sm">
                    {item.quantity}x
                  </span>

                  <span className="text-right text-xs sm:text-sm">
                    ${item.unitPrice.toFixed(2)}
                  </span>

                  <span className="text-right font-semibold text-xs sm:text-sm">
                    ${item.lineTotal.toFixed(2)}
                  </span>

                  <div className="flex justify-end">
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 cursor-pointer" />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* HISTORY */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">
            History
          </h3>

          <div className="space-y-0">
            {history.map((h, i, arr) => {
              const nextIsActive = arr[i + 1]?.active;

              return (
                <div key={i} className="relative flex gap-3 sm:gap-4 items-start">
                  
                  {/* TIMELINE */}
                  <div className="flex flex-col items-center pt-[4px] sm:pt-[6px]">
                    
                    <span
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                        h.active ? "bg-red-500" : "bg-gray-300"
                      }`}
                    />

                    {i !== arr.length - 1 && (
                      <span
                        className={`w-px h-full ${
                          h.active && nextIsActive
                            ? "bg-red-500"
                            : "bg-gray-200"
                        }`}
                        style={{ minHeight: "24px" }}
                      />
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="pb-5 sm:pb-6">
                    <p className="font-medium text-gray-900 text-sm sm:text-base leading-tight">
                      {h.label}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-[2px] leading-tight">
                      {h.date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderDetailsMain;