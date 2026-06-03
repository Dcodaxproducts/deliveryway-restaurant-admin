import EmptyState from "@/components/common/EmptyState";
import { useTranslations } from "next-intl";

export default function TableReservationsEmptyState() {
  const t = useTranslations("tableReservations");

  return (
    <EmptyState
      title={t("emptyTitle")}
      description={t("emptyDescription")}
    />
  );
}
