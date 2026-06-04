import { useTranslations } from "next-intl";

type AdminDealLifecycleBadgeProps = {
  lifecycle?: string;
};

const getLifecycleClassName = (lifecycle?: string) => {
  switch (lifecycle?.toLowerCase()) {
    case "ACTIVE":
    case "active":
      return "bg-green-50 text-green-700";
    case "upcoming":
    case "scheduled":
      return "bg-blue-50 text-blue-700";
    case "expired":
    case "ended":
      return "bg-gray-100 text-gray-600";
    case "deleted":
      return "bg-red-50 text-red-700";
    case "inactive":
      return "bg-yellow-50 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

type LifecycleMessageKey =
  | "active"
  | "scheduled"
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
  switch (lifecycle?.toLowerCase()) {
    case "active":
      return t("active");
    case "upcoming":
      return t("upcoming");
    case "scheduled":
      return t("scheduled");
    case "expired":
      return t("expired");
    case "ended":
      return t("ended");
    case "deleted":
      return t("deleted");
    case "inactive":
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
