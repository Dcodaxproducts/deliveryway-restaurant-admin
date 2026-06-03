import { BadgePercent } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminDealsEmptyState() {
  const t = useTranslations("deals");

  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[16px] border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <BadgePercent size={22} />
      </div>
      <h3 className="text-base font-semibold text-gray-900">{t("emptyTitle")}</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        {t("emptyDescription")}
      </p>
    </div>
  );
}
