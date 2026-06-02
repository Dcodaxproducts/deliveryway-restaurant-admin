"use client";

import { BarChart3, Edit, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import AdminDealLifecycleBadge from "@/components/pages/Menu/deals/components/AdminDealLifecycleBadge";
import AdminDealStatusBadge from "@/components/pages/Menu/deals/components/AdminDealStatusBadge";
import AdminDealsEmptyState from "@/components/pages/Menu/deals/components/AdminDealsEmptyState";
import {
  formatDealDate,
  formatDealPrice,
  formatShortDealId,
  formatUsageLimit,
} from "@/components/pages/Menu/deals/utils/admin-deals-formatters";
import { Button } from "@/components/ui/button";
import type { AdminDeal } from "@/types/admin-deals";

type AdminDealsTableProps = {
  deals: AdminDeal[];
  loading: boolean;
  error: Error | null;
  onDelete: (deal: AdminDeal) => void;
  onStats: (deal: AdminDeal) => void;
};

export default function AdminDealsTable({
  deals,
  loading,
  error,
  onDelete,
  onStats,
}: AdminDealsTableProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-[16px] border border-gray-100 bg-white">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[16px] border border-red-100 bg-red-50 p-5 text-sm text-red-700">
        Unable to load deals. Please try again.
      </div>
    );
  }

  if (deals.length === 0) return <AdminDealsEmptyState />;

  return (
    <div className="overflow-hidden rounded-[16px] border border-gray-100 bg-white">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full table-fixed text-left">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[25%] px-4 py-3 font-semibold">Deal</th>
              <th className="w-[12%] px-4 py-3 font-semibold">Fixed Price</th>
              <th className="w-[10%] px-4 py-3 font-semibold">Items</th>
              <th className="w-[18%] px-4 py-3 font-semibold">Schedule</th>
              <th className="w-[13%] px-4 py-3 font-semibold">Usage</th>
              <th className="w-[12%] px-4 py-3 font-semibold">Status</th>
              <th className="w-[10%] px-4 py-3 text-right font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {deals.map((deal) => (
              <tr key={deal.id} className="hover:bg-gray-50/70">
                <td className="px-4 py-4 align-top">
                  <div className="flex min-w-0 items-start gap-3">
                    {deal.thumbnailUrl ? (
                      <Image
                        src={deal.thumbnailUrl}
                        alt={`${deal.title} thumbnail`}
                        width={40}
                        height={40}
                        unoptimized
                        className="h-10 w-10 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-400">
                        {deal.title.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {deal.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {deal.code || formatShortDealId(deal.id)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                        {deal.description || "No description"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 align-top text-sm font-semibold text-gray-900">
                  {formatDealPrice(deal.discountValue)}
                </td>
                <td className="px-4 py-4 align-top text-sm text-gray-700">
                  {deal.scopeMenuItemIds.length.toLocaleString()}
                </td>
                <td className="px-4 py-4 align-top text-xs text-gray-600">
                  <div>{formatDealDate(deal.startsAt)}</div>
                  <div className="mt-1 text-gray-400">{formatDealDate(deal.expiresAt)}</div>
                </td>
                <td className="px-4 py-4 align-top text-xs text-gray-600">
                  <div>Uses: {formatUsageLimit(deal.maxUses)}</div>
                  <div className="mt-1 text-gray-400">
                    Customer: {formatUsageLimit(deal.maxUsesPerCustomer)}
                  </div>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-col items-start gap-2">
                    <AdminDealLifecycleBadge lifecycle={deal.lifecycle} />
                    <AdminDealStatusBadge deal={deal} />
                    <span className="text-xs text-gray-400">
                      {deal.branchId ? `Branch ${formatShortDealId(deal.branchId)}` : "All branches"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex justify-end gap-1">
                    <IconButton label="View stats" onClick={() => onStats(deal)}>
                      <BarChart3 size={16} />
                    </IconButton>
                    <IconButton
                      label="Edit"
                      onClick={() => router.push(`/menu/deals/${deal.id}/edit`)}
                    >
                      <Edit size={16} />
                    </IconButton>
                    <IconButton label="Delete" onClick={() => onDelete(deal)}>
                      <Trash2 size={16} />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-gray-100 lg:hidden">
        {deals.map((deal) => (
          <div key={deal.id} className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                {deal.thumbnailUrl ? (
                  <Image
                    src={deal.thumbnailUrl}
                    alt={`${deal.title} thumbnail`}
                    width={40}
                    height={40}
                    unoptimized
                    className="h-10 w-10 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-400">
                    {deal.title.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {deal.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {deal.code || formatShortDealId(deal.id)}
                  </p>
                </div>
              </div>
              <AdminDealLifecycleBadge lifecycle={deal.lifecycle} />
            </div>
            <p className="line-clamp-2 text-xs text-gray-500">
              {deal.description || "No description"}
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
              <Info label="Fixed Price" value={formatDealPrice(deal.discountValue)} />
              <Info label="Items" value={deal.scopeMenuItemIds.length.toLocaleString()} />
              <Info label="Starts" value={formatDealDate(deal.startsAt)} />
              <Info label="Expires" value={formatDealDate(deal.expiresAt)} />
              <Info label="Max Uses" value={formatUsageLimit(deal.maxUses)} />
              <Info label="Branch" value={deal.branchId ? formatShortDealId(deal.branchId) : "All branches"} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <AdminDealStatusBadge deal={deal} />
              <div className="flex gap-1">
                <IconButton label="View stats" onClick={() => onStats(deal)}>
                  <BarChart3 size={16} />
                </IconButton>
                <IconButton
                  label="Edit"
                  onClick={() => router.push(`/menu/deals/${deal.id}/edit`)}
                >
                  <Edit size={16} />
                </IconButton>
                <IconButton label="Delete" onClick={() => onDelete(deal)}>
                  <Trash2 size={16} />
                </IconButton>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-400">{label}</p>
      <p className="mt-1 font-medium text-gray-700">{value}</p>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="h-9 w-9 rounded-full p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
    >
      {children}
    </Button>
  );
}
