"use client";

import { usePathname } from "next/navigation";

type EmptyStateProps = {
  title?: string;
  description?: string;
};

/* ---------- Route → Content Map (SCALABLE) ---------- */

const emptyStateMap: Record<
  string,
  { title: string; description: string }
> = {
  "/menu": {
    title: "Looks like there are no menus yet!",
    description: "You haven’t added any menus yet. Start by creating a new one.",
  },

  "/menu/trash": {
    title: "Trash is empty",
    description: "Deleted menus will appear here.",
  },

  "/branches": {
    title: "No branches found",
    description: "Create your first branch to get started.",
  },

  "/products": {
    title: "No products yet",
    description: "Add products to start selling.",
  },
};

/* ---------- Component ---------- */

export default function EmptyState({
  title,
  description,
}: EmptyStateProps) {
  const pathname = usePathname();

  const routeContent = emptyStateMap[pathname];

  const finalTitle =
    title ?? routeContent?.title ?? "Looks like there is no data yet!";

  const finalDescription =
    description ??
    routeContent?.description ??
    "You haven’t added anything yet. Start by creating a new one.";

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
