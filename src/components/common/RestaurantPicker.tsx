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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { useIsMobile } from "@/hooks/use-mobile";

type RestaurantOption = {
  id: string;
  displayNumber?: number;
  name?: string;
  tenantId?: string | null;
  logoUrl?: string | null;
};

const RESTAURANT_PICKER_LIMIT = 20;
const getRestaurantIdentifier = (restaurant: RestaurantOption) =>
  restaurant.displayNumber !== undefined
    ? `#${restaurant.displayNumber}`
    : `#${restaurant.id.slice(-6)}`;

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

const getRestaurantDisplayNumber = (restaurant: unknown) => {
  if (!isRecord(restaurant)) return undefined;

  const direct = Number(restaurant.displayNumber);
  if (Number.isSafeInteger(direct) && direct > 0) return direct;

  return getRestaurantDisplayNumber(restaurant.data);
};

export default function RestaurantPicker({ className }: RestaurantPickerProps) {
  const t = useTranslations("common");
  const navigation = useTranslations("navigation");
  const { token, user, setUser, isBranchAdmin, branchId, logout } = useAuth();
  const { data: assignedBranch } = useGetBranch(
    isBranchAdmin && branchId ? branchId : "",
  );
  const router = useRouter();
  const isMobile = useIsMobile();
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
      includeInactive: true,
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
    const allowedStaffIds = new Set(staffRestaurantIds);
    const filtered = rows.reduce<RestaurantOption[]>((acc, row) => {
      if (!isRecord(row)) return acc;

      const id = getStringValue(row, "id");
      if (!id) return acc;
      if (allowedStaffIds.size > 0 && !allowedStaffIds.has(id)) return acc;

      const tenant = getRecordValue(row, "tenant");
      const tenantId =
        getStringValue(row, "tenantId") ?? getStringValue(tenant, "id") ?? null;

      acc.push({
        id,
        displayNumber: getRestaurantDisplayNumber(row),
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
        const restaurant =
          staffRestaurantDetails[staffRestaurantIds.indexOf(id)];

        return {
          id,
          displayNumber: getRestaurantDisplayNumber(restaurant),
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
      if ((e.target as Element).closest('[data-slot="sheet-content"]')) return;

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

  const renderPickerButton = () => (
    <button
      type="button"
      onClick={() => setOpen((prev) => !prev)}
      aria-expanded={open}
      aria-controls="restaurant-picker-options"
      className="flex h-12 w-full items-center justify-between gap-2 rounded-xl bg-muted px-3 text-sm transition-all hover:bg-primary/10 md:h-[56px] md:px-4"
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
        className={`shrink-0 transition-transform duration-200 ${
          open ? "rotate-180" : ""
        }`}
      />
    </button>
  );

  const renderRestaurantOptions = (mobile = false) => (
    <>
      <input
        type="search"
        value={restaurantSearch}
        onChange={(event) => setRestaurantSearch(event.target.value)}
        placeholder={t("searchRestaurants")}
        className="mb-2 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
      />

      <div
        id={mobile ? "restaurant-picker-options" : undefined}
        className={cn(
          "space-y-1 overflow-auto",
          mobile ? "max-h-[min(60dvh,420px)]" : "max-h-[240px]",
        )}
        onScroll={handleRestaurantScroll}
      >
        {isFetching &&
          restaurants.length === 0 &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[40px] animate-pulse rounded-md bg-gray-100"
            />
          ))}

        {restaurants.map((restaurant) => (
          <button
            key={restaurant.id}
            type="button"
            onClick={() => handleSelectRestaurant(restaurant)}
            title={`${restaurant.name ?? restaurant.id} · ${restaurant.id}`}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all",
              selectedRestaurant?.id === restaurant.id
                ? "bg-primary/5 text-primary"
                : "text-gray-700 hover:bg-gray-100",
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <BrandLogo
                className="shrink-0 gap-0"
                imageClassName="size-7 rounded-full bg-white shadow-sm"
                showName={false}
                logoUrl={restaurant.logoUrl}
                name={restaurant.name}
              />
              <span className="min-w-0 text-left">
                <span className="block truncate">{restaurant.name}</span>
                <span className="block truncate text-[10px] font-medium text-gray-400">
                  {getRestaurantIdentifier(restaurant)}
                </span>
              </span>
            </span>

            {selectedRestaurant?.id === restaurant.id ? (
              <Check size={14} className="shrink-0 text-primary" />
            ) : null}
          </button>
        ))}

        {isFetching && restaurants.length > 0 ? (
          <div className="py-2 text-center text-xs text-gray-400">
            {t("loadingMoreRestaurants")}
          </div>
        ) : null}

        {!isFetching && restaurants.length === 0 ? (
          <div className="space-y-2 py-3 text-center text-xs text-gray-500">
            <p>{t("noRestaurants")}</p>
            <p>{t("requestRestaurant")}</p>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 rounded-md bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary/90"
            >
              {t("goToLogin")}
            </button>
          </div>
        ) : null}
      </div>
    </>
  );

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
      {isMobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          {renderPickerButton()}
          <SheetContent
            side="bottom"
            className="max-h-[85dvh] gap-0 rounded-t-2xl border-gray-200 p-0"
          >
            <SheetHeader className="border-b border-gray-100 px-4 py-4 pr-12 text-left">
              <SheetTitle className="text-base">
                {t("selectRestaurant")}
              </SheetTitle>
              <SheetDescription>{t("searchRestaurants")}</SheetDescription>
            </SheetHeader>
            <div className="min-h-0 px-4 pb-4 pt-3">
              {renderRestaurantOptions(true)}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <div className="relative">
          {renderPickerButton()}
          {open ? (
            <div
              id="restaurant-picker-options"
              className="absolute left-0 top-[110%] z-50 w-full animate-in rounded-xl border bg-white p-3 shadow-xl duration-200 fade-in zoom-in-95"
            >
              <p className="text-xs text-gray-400 px-2 mb-2">
                {t("selectRestaurant")}
              </p>
              {renderRestaurantOptions()}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
