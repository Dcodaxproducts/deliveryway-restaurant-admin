import { useTranslations } from "next-intl";

type AdminDealLifecycleBadgeProps = {
  lifecycle?: string;
};

const getLifecycleClassName = (lifecycle?: string) => {
  switch (lifecycle) {
    case "ACTIVE":
      return "bg-green-50 text-green-700";
    case "UPCOMING":
      return "bg-blue-50 text-blue-700";
    case "EXPIRED":
    case "ENDED":
      return "bg-gray-100 text-gray-600";
    case "DELETED":
      return "bg-red-50 text-red-700";
    case "INACTIVE":
      return "bg-yellow-50 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

type LifecycleMessageKey =
  | "active"
  | "upcoming"
  | "expired"
  | "ended"
  | "deleted"
  | "inactive"
  | "unknown";

const getLocalizedLifecycleLabel = (
  lifecycle: string | undefined,
  t: (key: LifecycleMessageKey) => string
) => {
  switch (lifecycle) {
    case "ACTIVE":
      return t("active");
    case "UPCOMING":
      return t("upcoming");
    case "EXPIRED":
      return t("expired");
    case "ENDED":
      return t("ended");
    case "DELETED":
      return t("deleted");
    case "INACTIVE":
      return t("inactive");
    default:
      return t("unknown");
  }
};

export default function AdminDealLifecycleBadge({
  lifecycle,
}: AdminDealLifecycleBadgeProps) {
  const t = useTranslations("deals.lifecycle");

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getLifecycleClassName(
        lifecycle
      )}`}
    >
      {getLocalizedLifecycleLabel(lifecycle, t)}
    </span>
  );
}
