"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import BrandLogo from "@/components/common/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueries } from "@tanstack/react-query";
import { useGetRestaurants } from "@/hooks/useRestaurants";
import { getRestaurant } from "@/services/restaurants";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  canSwitchRestaurant,
  getRecordValue,
  getStoredAuth,
  getStringValue,
  isRecord,
  isStaffRole,
  saveStoredAuth,
} from "@/lib/auth";
import { useGetBranch } from "@/hooks/useBranches";

type RestaurantOption = {
  id: string;
  name?: string;
  tenantId?: string | null;
  logoUrl?: string | null;
};

const RESTAURANT_PICKER_LIMIT = 20;

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

type RestaurantPickerProps = {
  className?: string;
};

const getStaffRestaurantIds = (user: ReturnType<typeof useAuth>["user"]) => {
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

const getRestaurantLogoUrl = (restaurant: unknown) => {
  if (!isRecord(restaurant)) return null;

  const branding = getRecordValue(restaurant, "branding");
  const assets = getRecordValue(branding, "assets");
  const logo = getRecordValue(branding, "logo");

  return (
    getStringValue(restaurant, "logoUrl") ??
    getStringValue(assets, "logoUrl") ??
    getStringValue(logo, "light") ??
    null
  );
};

export default function RestaurantPicker({ className }: RestaurantPickerProps) {
  const t = useTranslations("common");
  const navigation = useTranslations("navigation");
  const { token, user, setUser, isBranchAdmin, branchId, logout } = useAuth();
  const { data: assignedBranch } = useGetBranch(
    isBranchAdmin && branchId ? branchId : "",
  );
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

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
      enabled: Boolean(token && id),
      retry: false,
      staleTime: 5 * 60 * 1000,
    })),
  });
  const staffRestaurantDetailsKey = JSON.stringify(
    staffRestaurantQueries.map((query) => query.data ?? null),
  );

  const [open, setOpen] = useState(false);
  const { data: restaurantsResponse, isFetching } = useGetRestaurants(
    {
      page: restaurantPage,
      limit: RESTAURANT_PICKER_LIMIT,
      search: debouncedRestaurantSearch || undefined,
    },
    Boolean(token && user?.id && canSwitchRestaurant(user)),
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

  const handleLogout = (): void => {
    logout();
    toast.success(navigation("logoutSuccess"));

    setTimeout(() => {
      router.push("/login");
    }, 500);
  };

  useEffect(() => {
    const rows = getResponseRows(restaurantsResponse);
    const meta = getResponseMeta(restaurantsResponse);
    const totalPages = Number(meta?.totalPages ?? meta?.pages ?? 0);
    const responseHasNext =
      typeof meta?.hasNext === "boolean"
        ? meta.hasNext
        : totalPages > 0
          ? restaurantPage < totalPages
          : rows.length >= RESTAURANT_PICKER_LIMIT;
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
        logoUrl: getRestaurantLogoUrl(row),
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
          logoUrl: getRestaurantLogoUrl(restaurant),
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

  useEffect(() => {
    if (!user?.restaurantId || restaurants.length === 0) return;

    const r = restaurants.find(
      (restaurant) => restaurant.id === user.restaurantId,
    );
    if (r) setSelectedRestaurant(r);
  }, [user?.restaurantId, restaurants]);

  useEffect(() => {
    const handleClickOutside = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  const handleRestaurantScroll = (event: { currentTarget: HTMLDivElement }) => {
    const target = event.currentTarget;
    const nearBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 24;

    if (nearBottom && hasMoreRestaurants && !isFetching) {
      setRestaurantPage((page) => page + 1);
    }
  };

  const handleSelectRestaurant = (restaurant: RestaurantOption) => {
    setSelectedRestaurant(restaurant);
    setOpen(false);

    const restaurantId = restaurant.id;

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

    toast.success(t("switchedSuccessfully"));
  };

  const renderLabel = () => {
    if (!selectedRestaurant) return t("selectRestaurant");
    return selectedRestaurant.name;
  };

  if (isBranchAdmin) {
    const branchLabel =
      assignedBranch?.name ||
      assignedBranch?.data?.name ||
      user?.branchName ||
      t("assignedBranch");

    return (
      <button
        type="button"
        onClick={() => router.push("/branch-workspace")}
        title={branchId ? `Branch ID: ${branchId}` : branchLabel}
        className={cn(
          "flex h-[52px] w-full items-center gap-3 rounded-xl bg-primary/10 px-3 text-left text-sm text-primary ring-1 ring-primary/20 transition hover:bg-primary/15 md:h-[56px] md:max-w-[340px] md:px-4",
          className,
        )}
      >
        <BrandLogo
          className="shrink-0 gap-0"
          imageClassName="size-9 rounded-full bg-white shadow-sm"
          showName={false}
          name={branchLabel}
        />
        <span className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wide text-primary/80">
            {t("branchScope")}
          </span>
          <span className="block truncate font-semibold">{branchLabel}</span>
        </span>
      </button>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative w-[280px]", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-[52px] w-full items-center justify-between gap-2 rounded-xl bg-muted px-3 text-sm transition-all hover:bg-primary/10 md:h-[56px] md:px-4"
      >
        <span className="flex min-w-0 items-center gap-3">
          <BrandLogo
            className="shrink-0 gap-0"
            imageClassName="size-9 rounded-full bg-white shadow-sm"
            showName={false}
            logoUrl={selectedRestaurant?.logoUrl}
            name={selectedRestaurant?.name}
          />
          <span className="truncate font-medium text-gray-800">
            {renderLabel()}
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute top-[110%] left-0 w-full bg-white shadow-xl rounded-xl p-3 z-50 border animate-in fade-in zoom-in-95 duration-200">
          <p className="text-xs text-gray-400 px-2 mb-2">
            {t("selectRestaurant")}
          </p>

          <input
            type="search"
            value={restaurantSearch}
            onChange={(event) => setRestaurantSearch(event.target.value)}
            placeholder="Search restaurants..."
            className="mb-2 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
          />

          <div
            className="space-y-1 max-h-[240px] overflow-auto"
            onScroll={handleRestaurantScroll}
          >
            {isFetching &&
              restaurants.length === 0 &&
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[40px] rounded-md bg-gray-100 animate-pulse"
                />
              ))}

            {restaurants.map((restaurant) => (
              <button
                key={restaurant.id}
                onClick={() => handleSelectRestaurant(restaurant)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                  selectedRestaurant?.id === restaurant.id
                    ? "bg-primary/5 text-primary"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <BrandLogo
                    className="shrink-0 gap-0"
                    imageClassName="size-7 rounded-full bg-white shadow-sm"
                    showName={false}
                    logoUrl={restaurant.logoUrl}
                    name={restaurant.name}
                  />
                  <span className="truncate">{restaurant.name}</span>
                </span>

                {selectedRestaurant?.id === restaurant.id && (
                  <Check size={14} className="text-primary" />
                )}
              </button>
            ))}

            {isFetching && restaurants.length > 0 ? (
              <div className="py-2 text-center text-xs text-gray-400">
                Loading more restaurants...
              </div>
            ) : null}

            {!isFetching && restaurants.length === 0 && (
              <div className="text-center text-xs text-gray-500 py-3 space-y-2">
                <p>{t("noRestaurants")}</p>
                <p>{t("requestRestaurant")}</p>

                <button
                  onClick={handleLogout}
                  className="mt-2 rounded-md bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary/90"
                >
                  {t("goToLogin")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
