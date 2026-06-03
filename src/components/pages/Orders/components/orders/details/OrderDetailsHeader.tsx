import { Button } from "@/components/ui/button";
import { Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { ORDER_STATUS_LABEL_KEYS } from "@/lib/status-labels";

const OrderDetailsHeader = ({
  order,
}: {
  order: { id: string; status: string };
}) => {
  const t = useTranslations("orders");
  const statusLabel = ORDER_STATUS_LABEL_KEYS[order.status]
    ? t(ORDER_STATUS_LABEL_KEYS[order.status])
    : order.status;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      
      {/* Left Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 break-all">
          {t("detailsTitle", { id: order.id })}
        </h1>

        <p className="text-xs sm:text-sm text-gray-500">
          <span className="text-primary">{t("breadcrumbDetails").split(" / ")[0]} /</span> {t("breadcrumbDetails").split(" / ")[1]}
        </p>
      </div>

      {/* Right Section */}
      <Button
        variant="ghost"
        className="w-full sm:w-auto justify-center sm:justify-start rounded-[10px] h-10 bg-green-500 text-white hover:bg-green-700 text-xs sm:text-sm font-medium px-4 flex items-center gap-2"
      >
        <Truck size={16} className="sm:w-[18px] sm:h-[18px]" />
        {statusLabel}
      </Button>
    </div>
  );
};

export default OrderDetailsHeader;
