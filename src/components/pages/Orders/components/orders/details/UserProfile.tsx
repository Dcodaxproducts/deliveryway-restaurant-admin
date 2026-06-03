"use client";

import { Truck } from "lucide-react";
import { useTranslations } from "next-intl";

const UserProfile = ({ order }: { order: any }) => {
  const t = useTranslations("orders");
  const customer = order?.customer;

  return (
    <div className="pt-9 min-w-[320px] mx-auto bg-white rounded-lg shadow-lg relative h-full">
      <div className="flex flex-col items-center text-center pb-28">
        {/* Avatar */}
        <img
          src={customer?.avatarUrl || "/dummy-user-2.jpg"}
          alt="User"
          className="w-32 h-32 rounded-xl object-cover mb-4"
        />

        {/* Name */}
        <h3 className="text-xl font-semibold">
          {customer?.fullName || t("unknownUser")}
        </h3>

        {/* Role */}
        <p className="text-sm text-primary mb-4 bg-primary/10 rounded-full px-4 py-1">
          {t("customerRole")}
        </p>

        {/* Note */}
        <div className="w-full px-6 py-3 rounded-lg text-left">
          <h4 className="text-lg font-medium mb-2">{t("noteOrder")}</h4>
          <p className="text-sm text-gray-600">
            {order?.customerNote || t("noOrderNote")}
          </p>
        </div>
      </div>

      {/*  ABSOLUTE BOTTOM BAR */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-b-lg flex items-center space-x-4">
        <div className="bg-white text-red-600 rounded-full p-2">
          <Truck className="w-5 h-5" />
        </div>

        <p className="text-sm">
          {order?.deliveryAddress?.address || t("takeawayOrder")}
        </p>
      </div>
    </div>
  );
};

export default UserProfile;
