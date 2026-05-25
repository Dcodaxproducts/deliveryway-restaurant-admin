"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Store } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useHttpClient } from "@/hooks/useHttpClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { canSwitchRestaurant, saveStoredAuth, getStoredAuth } from "@/lib/auth";
import { useGetBranch } from "@/hooks/useBranches";

export default function RestaurantPicker() {
  const { token, user, setUser, isBranchAdmin, branchId } = useAuth();
  const { data: assignedBranch } = useGetBranch(isBranchAdmin && branchId ? branchId : "");
  const { get } = useHttpClient(token);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);

  const [open, setOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const handleLogout = (): void => {
    localStorage.removeItem("auth");
    toast.success("Logged out successfully");

    setTimeout(() => {
      router.push("/login");
    }, 500);
  };

  const fetchRestaurants = async () => {
    if (!canSwitchRestaurant(user)) return;

    try {
      setIsFetching(true);

      const res = await get("/v1/restaurants");

      const filtered =
        res?.data?.filter((r: any) => r.tenantId === user?.tenantId) || [];

      setRestaurants(filtered);
    } catch {
      toast.error("Failed to fetch restaurants");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (token && user?.id && canSwitchRestaurant(user)) fetchRestaurants();
  }, [token, user?.id, user?.role]);

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

  const handleSelectRestaurant = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setOpen(false);

    const restaurantId = restaurant.id;

    setUser((prev: any) => ({
      ...prev,
      restaurantId,
      branchId: null,
    }));

    const stored = getStoredAuth() || {};

    if (stored?.user) {
      stored.user.restaurantId = restaurantId;
      stored.user.branchId = null;
      saveStoredAuth(stored);
    }

    toast.success("Switched successfully");
  };

  const renderLabel = () => {
    if (!selectedRestaurant) return "Select Restaurant";
    return selectedRestaurant.name;
  };

  if (isBranchAdmin) {
    const branchLabel =
      assignedBranch?.name ||
      assignedBranch?.data?.name ||
      user?.branchName ||
      "Assigned branch";

    return (
      <button
        type="button"
        onClick={() => router.push("/branch-workspace")}
        title={branchId ? `Branch ID: ${branchId}` : branchLabel}
        className="hidden h-[56px] max-w-[340px] items-center gap-3 rounded-xl bg-green-50 px-4 text-left text-sm text-green-700 ring-1 ring-green-200 transition hover:bg-green-100 md:flex"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-green-700 shadow-sm">
          <Store size={18} />
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wide text-green-600/80">
            Branch scope
          </span>
          <span className="block truncate font-semibold">
            {branchLabel}
          </span>
        </span>
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative w-[280px]">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between gap-2 px-4 h-[56px] rounded-xl bg-[#F5F5F5] hover:bg-[#EEEEEE] transition-all text-sm w-full"
      >
        <span className="font-medium truncate text-gray-800">
          {renderLabel()}
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
            Select Restaurant
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
                  <span className="truncate">{restaurant.name}</span>

                  {selectedRestaurant?.id === restaurant.id && (
                    <Check size={14} className="text-primary" />
                  )}
                </button>
              ))}

            {!isFetching && restaurants.length === 0 && (
              <div className="text-center text-xs text-gray-500 py-3 space-y-2">
                <p>
                  You haven’t registered any restaurant or it might have been deleted.
                </p>
                <p>
                  Please request Super Admin to add one, then login again.
                </p>

                <button
                  onClick={handleLogout}
                  className="mt-2 px-3 py-1.5 text-xs rounded-md bg-red-500 text-white hover:bg-red-600"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
