import { BadgePercent } from "lucide-react";

export default function AdminDealsEmptyState() {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[16px] border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <BadgePercent size={22} />
      </div>
      <h3 className="text-base font-semibold text-gray-900">No deals found</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        Create fixed-price deals for selected menu items, or adjust the filters.
      </p>
    </div>
  );
}
