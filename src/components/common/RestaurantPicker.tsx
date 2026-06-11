"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import BrandLogo from "@/components/common/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useGetRestaurants } from "@/hooks/useRestaurants";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  canSwitchRestaurant,
  getRecordValue,
  getStoredAuth,
  getStringValue,
  isRecord,
  saveStoredAuth,
} from "@/lib/auth";
import { useGetBranch } from "@/hooks/useBranches";

type RestaurantOption = {
  id: string;
  name?: string;
  tenantId?: string | null;
  logoUrl?: string | null;
};

type RestaurantPickerProps = {
  className?: string;
};

export default function RestaurantPicker({ className }: RestaurantPickerProps) {
  const t = useTranslations("common");
  const navigation = useTranslations("navigation");
  const { token, user, setUser, isBranchAdmin, branchId, logout } = useAuth();
  const { data: assignedBranch } = useGetBranch(isBranchAdmin && branchId ? branchId : "");
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantOption | null>(null);

  const [open, setOpen] = useState(false);
  const { data: restaurantsResponse, isFetching } = useGetRestaurants(Boolean(token && user?.id && canSwitchRestaurant(user)));

  const handleLogout = (): void => {
    logout();
    toast.success(navigation("logoutSuccess"));

    setTimeout(() => {
      router.push("/login");
    }, 500);
  };

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

      const branding = getRecordValue(row, "branding");
      const assets = getRecordValue(branding, "assets");
      const logo = getRecordValue(branding, "logo");
      const logoUrl =
        getStringValue(row, "logoUrl") ??
        getStringValue(assets, "logoUrl") ??
        getStringValue(logo, "light") ??
        null;

      acc.push({
        id,
        name: getStringValue(row, "name") ?? id,
        tenantId,
        logoUrl,
      });

      return acc;
    }, []);

    setRestaurants(filtered);
  }, [restaurantsResponse, user?.tenantId]);

  useEffect(() => {
    if (!user?.restaurantId || restaurants.length === 0) return;

    const r = restaurants.find((restaurant) => restaurant.id === user.restaurantId);
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
        : prev
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
          className
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
          <span className="block truncate font-semibold">
            {branchLabel}
          </span>
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

          <div className="space-y-1 max-h-[240px] overflow-auto">
            {isFetching &&
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[40px] rounded-md bg-gray-100 animate-pulse"
                />
              ))}

            {!isFetching &&
              restaurants.map((restaurant) => (
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

            {!isFetching && restaurants.length === 0 && (
              <div className="text-center text-xs text-gray-500 py-3 space-y-2">
                <p>
                  {t("noRestaurants")}
                </p>
                <p>
                  {t("requestRestaurant")}
                </p>

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
