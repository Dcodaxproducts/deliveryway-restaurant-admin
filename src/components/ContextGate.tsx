"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import { useHttpClient } from "@/hooks/useHttpClient";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import { isBranchAdminRole, getStoredAuth, saveStoredAuth } from "@/lib/auth";

export default function ContextGate() {
  const router = useRouter();
  const pathname = usePathname();

  const { user, loading, setUser, token, logout } = useAuthContext();
  const { get } = useHttpClient(token);

  const [open, setOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);

  /* ================= CHECK ================= */

  useEffect(() => {
    // 🚫 Never show on login page
    if (pathname === "/login") {
      setOpen(false);
      return;
    }

    // 🚫 Wait until auth ready
    if (loading) return;

    // 🚫 If logged out → don't open
    if (!user || !token) {
      setOpen(false);
      return;
    }

    // Branch admins are scoped by the JWT and must never be asked to switch workspace.
    if (isBranchAdminRole(user.role)) {
      setOpen(false);
      return;
    }

    //  Only open if needed
    setOpen(!user.restaurantId);
  }, [user, loading, token, pathname]);

  /* ================= FETCH ================= */

  const fetchRestaurants = async () => {
    try {
      setIsFetching(true);

      const res = await get("/v1/restaurants");

      const filtered =
        res?.data?.filter((r: any) => r.tenantId === user?.tenantId) || [];

      setRestaurants(filtered);
    } catch {
      toast.error("Failed to load restaurants");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (open && token) fetchRestaurants();
  }, [open, token]);

  /* ================= SELECT ================= */

  const handleConfirm = () => {
    if (!selectedRestaurant) {
      toast.error("Please select a restaurant");
      return;
    }

    const restaurantId = selectedRestaurant.id;

    //  Update context
    setUser((prev: any) => ({
      ...prev,
      restaurantId,
      branchId: null,
    }));

    //  Persist
    const stored = getStoredAuth() || {};

    if (stored?.user) {
      stored.user.restaurantId = restaurantId;
      stored.user.branchId = null;
      saveStoredAuth(stored);
    }

    toast.success("Workspace selected");
    setOpen(false);
  };

  // 🚫 Hard guard (prevents flicker + ghost modal)
  if (!open || !user || !token || pathname === "/login") return null;

  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-[560px] bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 animate-in zoom-in-95 duration-300">
        
        {/* HEADER */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Setup Your Workspace
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Select a restaurant to continue
          </p>
        </div>

        {/* PROGRESS BAR */}
        <div className="flex items-center justify-center mb-6">
          <div className="h-2 w-10 bg-primary rounded-full" />
        </div>

        {/* CONTENT */}
        <div className="space-y-3 max-h-[300px] overflow-auto pr-1">

          {/* SKELETON */}
          {isFetching &&
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[72px] rounded-xl bg-gray-100 animate-pulse"
              />
            ))}

          {/* RESTAURANTS */}
          {!isFetching &&
            restaurants.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRestaurant(r)}
                className={`w-full p-4 rounded-xl border text-left transition-all duration-200
                  ${
                    selectedRestaurant?.id === r.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-gray-200 hover:border-primary hover:bg-gray-50 hover:shadow-sm"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {r.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {r.id}
                    </div>
                  </div>

                  {selectedRestaurant?.id === r.id && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check size={14} className="text-primary" />
                    </div>
                  )}
                </div>
              </button>
            ))}

          {/* EMPTY STATE */}
          {!isFetching && restaurants.length === 0 && (
            <div className="text-center text-sm text-gray-500 py-6 space-y-3">
              <p>
                You haven’t registered any restaurant or it might have been deleted.
              </p>
              <p>
                Please request Super Admin to add one, then login again.
              </p>

              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="mt-2 px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                Logout & Go to Login
              </button>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="mt-6">
          <button
            onClick={handleConfirm}
            disabled={!selectedRestaurant}
            className={`w-full h-[48px] rounded-xl text-sm font-medium transition-all
              ${
                selectedRestaurant
                  ? "bg-primary text-white hover:opacity-90"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}