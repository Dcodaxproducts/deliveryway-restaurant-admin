"use client";

import Link from "next/link";
import {
  CalendarClock,
  ClipboardList,
  PackagePlus,
  ShoppingBag,
  Store,
  Truck,
  Users,
} from "lucide-react";

import Container from "@/components/container";
import Header from "@/components/header";
import BranchAdminScopeBanner from "@/components/branch-admin/BranchAdminScopeBanner";
import BranchCard from "@/components/cards/BranchCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useGetBranch } from "@/hooks/useBranches";

const quickActions = [
  {
    title: "Orders",
    description: "Track delivery, pickup, and kitchen flow for this branch.",
    href: "/orders",
    icon: ShoppingBag,
  },
  {
    title: "POS",
    description: "Create walk-in and takeaway orders.",
    href: "/pos",
    icon: ClipboardList,
  },
  {
    title: "Menu overrides",
    description: "Manage item availability and branch-specific pricing.",
    href: "/menu/items",
    icon: PackagePlus,
  },
  {
    title: "Delivery team",
    description: "Assign orders and manage deliveryman status.",
    href: "/deliveryman",
    icon: Truck,
  },
  {
    title: "Staff & roles",
    description: "Invite staff and maintain branch panel roles.",
    href: "/employees-settings",
    icon: Users,
  },
  {
    title: "Reports",
    description: "Review branch financial and order performance.",
    href: "/reports",
    icon: CalendarClock,
  },
];

export default function BranchWorkspace() {
  const { branchId, restaurantId, isBranchAdmin, loading } = useAuth();
  const effectiveBranchId = branchId || "";

  const {
    data: branch,
    isLoading,
    isFetching,
    refetch,
  } = useGetBranch(effectiveBranchId);

  const branchData = branch?.data ?? branch;
  const isBusy = loading || isLoading || isFetching;

  return (
    <Container>
      <div className="space-y-6">
        <Header
          title={isBranchAdmin ? "My Branch Workspace" : "Branch Workspace"}
          description="A single-branch command center for branch admins."
        />

        <BranchAdminScopeBanner />

        {!effectiveBranchId && !loading ? (
          <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
            This account does not have a branch assignment. Please assign a
            branchId to the branch-admin user from the backend/admin console.
          </div>
        ) : null}

        <section className="rounded-[22px] bg-white p-5 shadow-sm lg:p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-primary/10 text-primary">
                <Store size={20} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Assigned branch
                </h2>
                <p className="text-sm text-gray-500">
                  Restaurant {restaurantId || "-"} • Branch {effectiveBranchId || "-"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-[12px]"
                onClick={() => refetch()}
                disabled={!effectiveBranchId || isBusy}
              >
                Refresh
              </Button>

              {effectiveBranchId ? (
                <Link href={`/branches/edit?branchId=${effectiveBranchId}`}>
                  <Button type="button" className="rounded-[12px]">
                    Edit branch profile
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>

          {isBusy ? (
            <div className="h-[96px] animate-pulse rounded-[16px] bg-gray-100" />
          ) : branchData ? (
            <BranchCard
              id={branchData.id}
              name={branchData.name}
              isActive={branchData.isActive}
              availability={branchData.availability}
              isDefault={branchData.isMain}
              itemsCount={branchData._count?.items || 0}
              coverImage={branchData.coverImage}
              logoUrl={branchData.logoUrl}
              allowDelete={false}
              allowLifecycleActions={false}
              branchAdminMode
            />
          ) : effectiveBranchId ? (
            <div className="rounded-[16px] border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
              Branch details could not be loaded.
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-[20px] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#F9FAFB] text-primary transition group-hover:bg-primary group-hover:text-white">
                    <Icon size={20} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {action.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-gray-500">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </Container>
  );
}
