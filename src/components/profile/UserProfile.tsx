"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { authApi } from "@/services/auth/auth.api";

interface Profile {
  id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
  metadata?: any;
  isActive?: boolean | string | null;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface User {
  id?: string;
  email?: string;
  role?: string;
  tenantId?: string | null;
  restaurantId?: string | null;
  branchId?: string | null;
  profile?: Profile;
}

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);

  const formatDate = (date?: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleString();
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const auth = localStorage.getItem("auth");

        if (!auth) return;

        const parsed = JSON.parse(auth);
        const token = parsed?.accessToken;

        if (parsed?.user) {
          setUser(parsed.user);
        }

        if (!token) return;

        const nextUser = await authApi.me(token, parsed);

        if (nextUser) {
          setUser(nextUser);
        }
      } catch {
        // Keep the locally hydrated user when the profile refresh fails.
      }
    };

    loadUser();
  }, []);

  const profile = user?.profile;
  const fullName = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`;

  const rows = [
    ["User ID", user?.id],
    ["Email", user?.email],
    ["Role", user?.role],
    ["Tenant ID", user?.tenantId],
    ["Restaurant ID", user?.restaurantId],
    ["Branch ID", user?.branchId],
    ["Phone", profile?.phone],
    // ["Profile ID", profile?.id],
    // ["Profile User ID", profile?.userId],
    ["Status", profile?.isActive ? "Active" : "Inactive"],
    ["Created At", formatDate(profile?.createdAt)],
    ["Updated At", formatDate(profile?.updatedAt)],
    // ["Deleted At", formatDate(profile?.deletedAt)],
  ];

  return (
    <Card className="w-full bg-white rounded-2xl shadow-none border-none p-10">
      
      {/* Avatar */}
      <div className="flex flex-col items-center">
        <img
          // src={profile?.avatarUrl || "/user-2.jpg"}
          src={"/user-2.jpg"}
          alt="User Avatar"
          className="w-46 h-46 object-cover rounded-2xl shadow-md"
        />

        <h2 className="mt-6 text-2xl font-semibold text-gray-900">
          {fullName || "—"}
        </h2>

        <p className="text-[#909090] text-sm">{user?.email || "—"}</p>
      </div>

      {/* Description */}
      <div className="text-center mt-8">
        <p className="font-medium text-gray-700 mb-2">Description</p>
        <p className="text-[#909090] text-sm max-w-xl mx-auto leading-relaxed">
          {profile?.bio || "No description provided."}
        </p>
      </div>

      {/* Details */}
      <div className="flex justify-center mt-12">
        <div className="w-full max-w-[580px] space-y-5 text-sm">

          {rows.map(([label, value]) => (
            <div
              key={label}
              className="grid grid-cols-[1fr_auto_1fr] items-center"
            >
              <span className="text-left font-medium text-gray-600">
                {label}
              </span>

              <span className="text-center text-gray-400 px-3">:</span>

              <span className="text-right text-gray-400">
                {value || "—"}
              </span>
            </div>
          ))}

          {/* Colors section kept exactly same */}
          <div className="grid grid-cols-[1fr_1fr] items-start">
            <span className="text-left font-medium text-gray-600">
              Colors
            </span>

            <div className="grid grid-cols-[1fr_auto_1fr]">
              <span />
              <span />
            </div>

            <div className="pl-1 space-y-3 text-gray-400 text-sm mt-3">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full bg-red-600" />
                Primary
              </div>

              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full bg-black" />
                Secondary
              </div>
            </div>
          </div>

        </div>
      </div>
    </Card>
  );
}