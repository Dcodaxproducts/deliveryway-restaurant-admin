"use client";

import { Check } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQueries } from "@tanstack/react-query";
import { useGetRestaurants } from "@/hooks/useRestaurants";
import { getRestaurant } from "@/services/restaurants";

import { useAuthContext } from "@/components/providers/auth-provider";
import {
  getRecordValue,
  getStoredAuth,
  getStringValue,
  isBranchAdminRole,
  isRecord,
  isStaffRole,
  saveStoredAuth,
} from "@/lib/auth";
import { cn } from "@/lib/utils";

type RestaurantOption = {
  id: string;
  name?: string;
  tenantId?: string | null;
};

const RESTAURANT_SELECTOR_LIMIT = 20;

const getResponseRows = (response: unknown) => {
  if (!isRecord(response)) return [];

  return Array.isArray(response.data) ? response.data : [];
};

const getResponseMeta = (response: unknown) => {
  if (!isRecord(response)) return null;

  return isRecord(response.meta) ? response.meta : null;
};

const mergeRestaurantsById = (
  current: RestaurantOption[],
  next: RestaurantOption[],
) => {
  const map = new Map(current.map((restaurant) => [restaurant.id, restaurant]));

  next.forEach((restaurant) => {
    map.set(restaurant.id, { ...map.get(restaurant.id), ...restaurant });
  });

  return Array.from(map.values());
};

const getStaffRestaurantIds = (
  user: ReturnType<typeof useAuthContext>["user"],
) => {
  if (!isStaffRole(user?.role, user?.actorType)) return [];

  const directIds = user?.restaurantAccess?.restaurantIds ?? [];
  const roleIds = user?.staffRole?.restaurantAccess?.restaurantIds ?? [];

  return Array.from(new Set([...directIds, ...roleIds].filter(Boolean)));
};

const getRestaurantName = (restaurant: unknown, fallback: string) => {
  if (!isRecord(restaurant)) return fallback;

  return (
    getStringValue(restaurant, "name") ??
    getStringValue(restaurant, "restaurantName") ??
    getStringValue(restaurant, "businessName") ??
    fallback
  );
};

export default function ContextGate() {
  const router = useRouter();
  const pathname = usePathname();

  const { user, loading, setUser, token, logout } = useAuthContext();

  const [open, setOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<RestaurantOption | null>(null);
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [debouncedRestaurantSearch, setDebouncedRestaurantSearch] =
    useState("");
  const [restaurantPage, setRestaurantPage] = useState(1);
  const [hasMoreRestaurants, setHasMoreRestaurants] = useState(false);
  const staffRestaurantIds = useMemo(() => getStaffRestaurantIds(user), [user]);
  const staffRestaurantQueries = useQueries({
    queries: staffRestaurantIds.map((id) => ({
      queryKey: ["staff-restaurant", id],
      queryFn: () => getRestaurant(id),
      enabled: Boolean(open && token && id),
      retry: false,
      staleTime: 5 * 60 * 1000,
    })),
  });
  const staffRestaurantDetailsKey = JSON.stringify(
    staffRestaurantQueries.map((query) => query.data ?? null),
  );
  const { data: restaurantsResponse, isFetching } = useGetRestaurants(
    {
      page: restaurantPage,
      limit: RESTAURANT_SELECTOR_LIMIT,
      search: debouncedRestaurantSearch || undefined,
    },
    Boolean(open && Boolean(token)),
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedRestaurantSearch(restaurantSearch.trim());
      setRestaurantPage(1);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [restaurantSearch]);

  useEffect(() => {
    if (!open) {
      setRestaurantSearch("");
      setDebouncedRestaurantSearch("");
      setRestaurantPage(1);
    }
  }, [open]);

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
    const rows = getResponseRows(restaurantsResponse);
    const meta = getResponseMeta(restaurantsResponse);
    const totalPages = Number(meta?.totalPages ?? meta?.pages ?? 0);
    const responseHasNext =
      typeof meta?.hasNext === "boolean"
        ? meta.hasNext
        : totalPages > 0
          ? restaurantPage < totalPages
          : rows.length >= RESTAURANT_SELECTOR_LIMIT;
    const userTenantId = user?.tenantId ?? null;
    const allowedStaffIds = new Set(staffRestaurantIds);
    const filtered = rows.reduce<RestaurantOption[]>((acc, row) => {
      if (!isRecord(row)) return acc;

      const id = getStringValue(row, "id");
      if (!id) return acc;
      if (allowedStaffIds.size > 0 && !allowedStaffIds.has(id)) return acc;

      const tenant = getRecordValue(row, "tenant");
      const tenantId =
        getStringValue(row, "tenantId") ?? getStringValue(tenant, "id") ?? null;

      if (userTenantId && tenantId && tenantId !== userTenantId) return acc;

      acc.push({
        id,
        name: getRestaurantName(row, id),
        tenantId,
      });

      return acc;
    }, []);

    const knownIds = new Set(filtered.map((restaurant) => restaurant.id));
    const staffRestaurantDetails = JSON.parse(
      staffRestaurantDetailsKey,
    ) as unknown[];
    const staffFallbackOptions = staffRestaurantIds
      .filter((id) => !knownIds.has(id))
      .map((id) => {
        const restaurant = staffRestaurantDetails[staffRestaurantIds.indexOf(id)];

        return {
          id,
          name: getRestaurantName(restaurant, id),
          tenantId: user?.tenantId ?? null,
        };
      });

    const nextRestaurants = [...filtered, ...staffFallbackOptions];

    setHasMoreRestaurants(responseHasNext);
    setRestaurants((current) =>
      restaurantPage === 1
        ? nextRestaurants
        : mergeRestaurantsById(current, nextRestaurants),
    );
  }, [
    restaurantsResponse,
    staffRestaurantDetailsKey,
    staffRestaurantIds,
    user?.tenantId,
    restaurantPage,
  ]);

  const handleRestaurantScroll = (event: { currentTarget: HTMLDivElement }) => {
    const target = event.currentTarget;
    const nearBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 24;

    if (nearBottom && hasMoreRestaurants && !isFetching) {
      setRestaurantPage((page) => page + 1);
    }
  };

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
        : prev,
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
          <h2 className="text-2xl font-semibold tracking-tight">
            Setup Your Workspace
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Select a restaurant to continue
          </p>
        </div>

        <div className="mb-6 flex items-center justify-center">
          <div className="h-2 w-10 rounded-full bg-primary" />
        </div>

        <div className="mb-4">
          <input
            type="search"
            value={restaurantSearch}
            onChange={(event) => setRestaurantSearch(event.target.value)}
            placeholder="Search restaurants..."
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
          />
        </div>

        <div
          className="max-h-[300px] space-y-3 overflow-auto pr-1"
          onScroll={handleRestaurantScroll}
        >
          {isFetching && restaurants.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[72px] animate-pulse rounded-xl bg-gray-100"
                />
              ))
            : null}

          {restaurants.map((restaurant) => (
            <button
              key={restaurant.id}
              onClick={() => setSelectedRestaurant(restaurant)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition-all duration-200",
                selectedRestaurant?.id === restaurant.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-gray-200 hover:border-primary hover:bg-gray-50 hover:shadow-sm",
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">
                    {restaurant.name}
                  </div>
                  <div className="text-xs text-gray-400">{restaurant.id}</div>
                </div>

                {selectedRestaurant?.id === restaurant.id ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                    <Check size={14} className="text-primary" />
                  </div>
                ) : null}
              </div>
            </button>
          ))}

          {isFetching && restaurants.length > 0 ? (
            <div className="py-3 text-center text-xs text-gray-400">
              Loading more restaurants...
            </div>
          ) : null}

          {!isFetching && restaurants.length === 0 ? (
            <div className="space-y-3 py-6 text-center text-sm text-gray-500">
              <p>
                You haven’t registered any restaurant or it might have been
                deleted.
              </p>
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
                : "cursor-not-allowed bg-gray-200 text-gray-400",
            )}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
