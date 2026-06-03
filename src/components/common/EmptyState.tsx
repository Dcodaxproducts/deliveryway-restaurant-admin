"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type EmptyStateProps = {
  title?: string;
  description?: string;
};

/* ---------- Route → Content Map (SCALABLE) ---------- */

const emptyStateMap: Record<
  string,
  { titleKey: string; descriptionKey: string }
> = {
  "/menu": {
    titleKey: "emptyMenuTitle",
    descriptionKey: "emptyMenuDescription",
  },

  "/menu/trash": {
    titleKey: "emptyTrashTitle",
    descriptionKey: "emptyTrashDescription",
  },

  "/branches": {
    titleKey: "emptyBranchesTitle",
    descriptionKey: "emptyBranchesDescription",
  },

  "/products": {
    titleKey: "emptyProductsTitle",
    descriptionKey: "emptyProductsDescription",
  },
};

/* ---------- Component ---------- */

export default function EmptyState({
  title,
  description,
}: EmptyStateProps) {
  const pathname = usePathname();
  const t = useTranslations("common");

  const routeContent = emptyStateMap[pathname];

  const finalTitle =
    title ?? (routeContent ? t(routeContent.titleKey) : t("emptyDefaultTitle"));

  const finalDescription =
    description ??
    (routeContent ? t(routeContent.descriptionKey) : t("emptyDefaultDescription"));

  return (
    <div className="w-full bg-[#F5F5F5] rounded-[16px] py-16 px-6 flex flex-col items-center text-center">
      <h2 className="text-[30px] font-normal text-dark mb-2">
        {finalTitle}
      </h2>

      <p className="text-base text-gray">
        {finalDescription}
      </p>
    </div>
  );
}
