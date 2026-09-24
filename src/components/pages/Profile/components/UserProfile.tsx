"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/status-badge";
import { ProfileIdentityCard } from "@/components/pages/Profile/components/ProfileIdentityCard";
import { useAuth } from "@/hooks/useAuth";
import {
getAccountIdentity,
  getAvatarUrl,
  getDisplayName,
  getInitials,
  getStoredAuth,
  saveStoredAuth,
} from "@/lib/auth";
import { formatDateTime24 } from "@/lib/date-time-format";
import { authApi } from "@/services/auth/auth.api";

export default function UserProfile() {
  const { user, token, setUser } = useAuth();
  const t = useTranslations("profile");
  const common = useTranslations("common");
  const [refreshing, setRefreshing] = useState(false);

  const formatDate = (date?: string | null) => {
    if (!date) return "-";
    return formatDateTime24({ value: date, fallback: "-" });
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (!token) return;

        setRefreshing(true);
        const stored = getStoredAuth();
        const nextUser = await authApi.me(token, stored);

        if (nextUser) {
          setUser(nextUser);
          if (stored) {
            saveStoredAuth({ ...stored, user: nextUser });
          }
        }
      } catch {
        // Keep the locally hydrated user when the profile refresh fails.
      } finally {
        setRefreshing(false);
      }
    };

    loadUser();
  }, [setUser, token]);

  const profile = user?.profile;
  const fullName = getDisplayName(user);
  const avatarUrl = getAvatarUrl(user);
  const initials = getInitials(user);
const accountIdentity = getAccountIdentity(user);

  const accountRows = [
    [t("userId"), user?.id],
    [t("email"), user?.email],
    [t("role"), user?.role],
    [t("tenantId"), user?.tenantId],
    [t("restaurantId"), user?.restaurantId],
    [t("branchId"), user?.branchId],
    [t("phone"), profile?.phone],
    [t("status"), user?.isActive === false ? common("inactive") : common("active")],
    [common("createdAt"), formatDate(profile?.createdAt)],
    [common("updatedAt"), formatDate(profile?.updatedAt)],
  ];

  return (
    <div className="space-y-4">
      <ProfileIdentityCard
        avatarUrl={avatarUrl}
        initials={initials}
        name={fullName}
        email={user?.email}
        description={profile?.bio || t("noDescription")}
        status={
          <StatusBadge tone={user?.isActive === false ? "neutral" : "success"} size="sm">
            {user?.isActive === false ? common("inactive") : common("active")}
          </StatusBadge>
        }
        notice={refreshing ? t("refreshing") : null}
      />

      <SectionCard padding="md" title={t("profileDetails")}>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {accountRows.map(([label, value]) => (
            <div key={label} className="min-w-0 border-b border-[var(--ui-border)] pb-3 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0">
              <dt className="text-xs font-medium text-[var(--ui-text-subtle)]">
                {label}
              </dt>
              <dd className="mt-1 break-words text-sm font-medium text-[var(--ui-text)]">
                {value || "-"}
              </dd>
            </div>
          ))}
        </dl>
      </SectionCard>
    </div>
  );
}
