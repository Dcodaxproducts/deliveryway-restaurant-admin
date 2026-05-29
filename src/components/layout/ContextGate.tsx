"use client";

import { Check } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useGetRestaurants } from "@/hooks/useRestaurants";

import { useAuthContext } from "@/components/providers/auth-provider";
import {
  getRecordValue,
  getStoredAuth,
  getStringValue,
  isBranchAdminRole,
  isRecord,
  saveStoredAuth,
} from "@/lib/auth";
import { cn } from "@/lib/utils";

type RestaurantOption = {
  id: string;
  name?: string;
  tenantId?: string | null;
};

export default function ContextGate() {
  const router = useRouter();
  const pathname = usePathname();

  const { user, loading, setUser, token, logout } = useAuthContext();

  const [open, setOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantOption | null>(null);
  const { data: restaurantsResponse, isFetching } = useGetRestaurants(Boolean(open && Boolean(token)));

  useEffect(() => {
    if (pathname === "/login") {
      setOpen(false);
      return;
    }

    if (loading) return;

    if (!user || !token) {
      setOpen(false);
      return;
    }

    if (isBranchAdminRole(user.role)) {
      setOpen(false);
      return;
    }

    setOpen(!user.restaurantId);
  }, [user, loading, token, pathname]);

  useEffect(() => {
    const data = isRecord(restaurantsResponse) ? restaurantsResponse.data : undefined;
    const rows = Array.isArray(data) ? data : [];
    const userTenantId = user?.tenantId ?? null;
    const filtered = rows.reduce<RestaurantOption[]>((acc, row) => {
      if (!isRecord(row)) return acc;

      const id = getStringValue(row, "id");
      if (!id) return acc;

      const tenant = getRecordValue(row, "tenant");
      const tenantId = getStringValue(row, "tenantId") ?? getStringValue(tenant, "id") ?? null;

      if (userTenantId && tenantId && tenantId !== userTenantId) return acc;

      acc.push({
        id,
        name: getStringValue(row, "name") ?? id,
        tenantId,
      });

      return acc;
    }, []);

    setRestaurants(filtered);
  }, [restaurantsResponse, user?.tenantId]);

  const handleConfirm = () => {
    if (!selectedRestaurant) {
      toast.error("Please select a restaurant");
      return;
    }

    const restaurantId = selectedRestaurant.id;

    setUser((prev) =>
      prev
        ? {
            ...prev,
            restaurantId,
            branchId: null,
          }
        : prev
    );

    const stored = getStoredAuth() || {};

    if (stored?.user) {
      stored.user.restaurantId = restaurantId;
      stored.user.branchId = null;
      saveStoredAuth(stored);
    }

    toast.success("Workspace selected");
    setOpen(false);
  };

  if (!open || !user || !token || pathname === "/login") return null;

  return (
    <div className="fixed inset-0 z-[9999] flex animate-in items-center justify-center bg-black/70 backdrop-blur-md duration-300 fade-in">
      <div className="w-full max-w-[560px] animate-in rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl duration-300 zoom-in-95">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Setup Your Workspace</h2>
          <p className="mt-1 text-sm text-gray-500">Select a restaurant to continue</p>
        </div>

        <div className="mb-6 flex items-center justify-center">
          <div className="h-2 w-10 rounded-full bg-primary" />
        </div>

        <div className="max-h-[300px] space-y-3 overflow-auto pr-1">
          {isFetching
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[72px] animate-pulse rounded-xl bg-gray-100" />
              ))
            : null}

          {!isFetching
            ? restaurants.map((restaurant) => (
                <button
                  key={restaurant.id}
                  onClick={() => setSelectedRestaurant(restaurant)}
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition-all duration-200",
                    selectedRestaurant?.id === restaurant.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-gray-200 hover:border-primary hover:bg-gray-50 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{restaurant.name}</div>
                      <div className="text-xs text-gray-400">{restaurant.id}</div>
                    </div>

                    {selectedRestaurant?.id === restaurant.id ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                        <Check size={14} className="text-primary" />
                      </div>
                    ) : null}
                  </div>
                </button>
              ))
            : null}

          {!isFetching && restaurants.length === 0 ? (
            <div className="space-y-3 py-6 text-center text-sm text-gray-500">
              <p>You haven’t registered any restaurant or it might have been deleted.</p>
              <p>Please request Super Admin to add one, then login again.</p>

              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="mt-2 rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
              >
                Logout & Go to Login
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-6">
          <button
            onClick={handleConfirm}
            disabled={!selectedRestaurant}
            className={cn(
              "h-[48px] w-full rounded-xl text-sm font-medium transition-all",
              selectedRestaurant
                ? "bg-primary text-white hover:opacity-90"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            )}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
