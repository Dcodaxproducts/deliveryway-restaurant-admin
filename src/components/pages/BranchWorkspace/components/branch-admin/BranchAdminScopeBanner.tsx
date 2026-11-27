"use client";


import { LocalizedText } from "@/components/common/LocalizedText";
import { Store, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetBranch } from "@/hooks/useBranches";

export default function BranchAdminScopeBanner({
  className = "",
}: {
  className?: string;
}) {
  const { isBranchAdmin, restaurantId, branchId, user } = useAuth();
  const { data: assignedBranch } = useGetBranch(isBranchAdmin && branchId ? branchId : "");

  if (!isBranchAdmin) return null;

  const branchName =
    assignedBranch?.name ||
    assignedBranch?.data?.name ||
    user?.branchName ||
    "Assigned branch";

  return (
    <div
      className={`rounded-[18px] border border-green-200 bg-green-50 p-4 text-sm text-green-700 ${className}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white text-green-700 shadow-sm">
            <Store size={18} />
          </div>

          <div>
            <p className="font-semibold"><LocalizedText messageKey="message049" /></p>
            <p className="mt-1 text-green-700/75">
              <LocalizedText messageKey="message378" />
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {restaurantId ? (
            <span className="rounded-full bg-white px-3 py-1 font-medium text-green-700 shadow-sm">
              <LocalizedText messageKey="message322" /> {restaurantId}
            </span>
          ) : null}
          {branchId ? (
            <span className="rounded-full bg-white px-3 py-1 font-medium text-green-700 shadow-sm" title={branchId}>
              <LocalizedText messageKey="message061" /> {branchName}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-medium text-green-700 shadow-sm">
            <ShieldCheck size={13} /> <LocalizedText messageKey="message385" />
          </span>
        </div>
      </div>
    </div>
  );
}
