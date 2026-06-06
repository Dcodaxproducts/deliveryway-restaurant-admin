"use client";

import Image from "next/image";
import { CalendarDays, Clock3, ImageIcon, Loader2, Store } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import BranchInfoCard from "./BranchInfoCard";
import DialogFooterComponent from "./DialogFooterComponent";
import DialogHeaderComponent from "./DialogHeaderComponent";
import { useGetBranchHolidayOpeningHours } from "@/hooks/useBranches";
import { useTranslations } from "next-intl";

type BranchDetails = {
  id?: string;
  name?: string;
  isMain?: boolean;
  coverImage?: string | null;
  logoUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  restaurant?: {
    name?: string | null;
    slug?: string | null;
  } | null;
  manager?: {
    email?: string | null;
    profile?: {
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
    } | null;
  } | null;
  address?: {
    street?: string | null;
    area?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    lat?: string | number | null;
    lng?: string | number | null;
  } | null;
  availability?: {
    isAvailable?: boolean | null;
    isTemporarilyClosed?: boolean | null;
  } | null;
  deletionState?: {
    isDeleted?: boolean | null;
  } | null;
  _count?: {
    users?: number | null;
    orders?: number | null;
    deliverymen?: number | null;
  } | null;
};

type InfoItem = {
  label: string;
  value?: string | number | boolean | null;
};

type HolidayOpeningHour = {
  id?: string | number | null;
  date?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  isClosed?: boolean | null;
  openTime?: string | null;
  closeTime?: string | null;
  note?: string | null;
};

type ObjectRecord = Record<string, unknown>;

const isObjectRecord = (value: unknown): value is ObjectRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getObjectValue = (value: unknown, key: string) =>
  isObjectRecord(value) ? value[key] : undefined;

const extractHolidayOpeningHours = (response: unknown): HolidayOpeningHour[] => {
  const data = getObjectValue(response, "data");
  const nestedData = getObjectValue(data, "data");
  const candidates = [
    getObjectValue(data, "holidayOpeningHours"),
    getObjectValue(nestedData, "holidayOpeningHours"),
    getObjectValue(response, "holidayOpeningHours"),
    data,
    response,
  ];

  const raw = candidates.find((candidate) => Array.isArray(candidate));

  if (!Array.isArray(raw)) return [];

  return raw.filter(isObjectRecord).map((item) => ({
    id:
      typeof item.id === "string" || typeof item.id === "number"
        ? item.id
        : undefined,
    date: typeof item.date === "string" ? item.date : "",
    fromDate: typeof item.fromDate === "string" ? item.fromDate : "",
    toDate: typeof item.toDate === "string" ? item.toDate : "",
    isClosed: Boolean(item.isClosed),
    openTime: typeof item.openTime === "string" ? item.openTime : "",
    closeTime: typeof item.closeTime === "string" ? item.closeTime : "",
    note: typeof item.note === "string" ? item.note : "",
  }));
};

const formatBoolean = (value: boolean | null | undefined, yes: string, no: string) => {
  if (typeof value !== "boolean") return undefined;
  return value ? yes : no;
};

const formatDate = (value?: string | null) => {
  if (!value) return undefined;
  return new Date(value).toLocaleString();
};

const compactInfo = (items: InfoItem[], yes: string, no: string) =>
  items
    .map(({ label, value }) => ({
      label,
      value:
        typeof value === "boolean"
          ? formatBoolean(value, yes, no)
          : value === null || value === undefined || value === ""
            ? undefined
            : String(value),
    }))
    .filter((item): item is { label: string; value: string } => Boolean(item.value));

const getManagerName = (branch: BranchDetails) => {
  const firstName = branch.manager?.profile?.firstName?.trim() || "";
  const lastName = branch.manager?.profile?.lastName?.trim() || "";
  return `${firstName} ${lastName}`.trim() || undefined;
};

const formatHolidayDate = (value?: string | null) => {
  if (!value) return "";

  const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = ymdMatch
    ? new Date(Number(ymdMatch[1]), Number(ymdMatch[2]) - 1, Number(ymdMatch[3]))
    : new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatHolidayDateRange = (holiday: HolidayOpeningHour) => {
  if (holiday.fromDate && holiday.toDate) {
    const fromLabel = formatHolidayDate(holiday.fromDate);
    const toLabel = formatHolidayDate(holiday.toDate);

    if (!fromLabel || !toLabel) return fromLabel || toLabel;
    if (holiday.fromDate === holiday.toDate) return fromLabel;

    return `${fromLabel} - ${toLabel}`;
  }

  return formatHolidayDate(holiday.date);
};

const formatHolidayTimeRange = (
  holiday: HolidayOpeningHour,
  closedLabel: string
) => {
  if (holiday.isClosed) return closedLabel;
  if (!holiday.openTime || !holiday.closeTime) return "";

  return `${holiday.openTime} - ${holiday.closeTime}`;
};

export function BranchDetailsModal({
  isOpen,
  closeDialog,
  branch,
}: {
  isOpen: boolean;
  closeDialog: () => void;
  branch: BranchDetails | null;
}) {
  const t = useTranslations("branches");
  const commonT = useTranslations("common");

  const branchId = branch?.id || "";
  const {
    data: holidayHoursResponse,
    isFetching: isFetchingHolidayHours,
    isLoading: isLoadingHolidayHours,
  } = useGetBranchHolidayOpeningHours(isOpen && branchId ? branchId : undefined);

  if (!branch) return null;

  const { address, availability, deletionState, restaurant, manager, _count } = branch;
  const latitude = address?.lat;
  const longitude = address?.lng;
  const hasLocation = latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null;
  const holidayOpeningHours = extractHolidayOpeningHours(holidayHoursResponse);
  const fetchingHolidayHours = isLoadingHolidayHours || isFetchingHolidayHours;

  const branchInfo = compactInfo([
    { label: t("branchName"), value: branch.name },
    { label: t("restaurant"), value: restaurant?.name },
    { label: t("restaurantSlug"), value: restaurant?.slug },
  ], commonT("yes"), commonT("no"));

  const managerInfo = compactInfo([
    { label: t("managerEmail"), value: manager?.email },
    { label: t("managerName"), value: getManagerName(branch) },
    { label: t("managerPhone"), value: manager?.profile?.phone },
  ], commonT("yes"), commonT("no"));

  const addressInfo = compactInfo([
    { label: t("street"), value: address?.street },
    { label: t("area"), value: address?.area },
    { label: t("city"), value: address?.city },
    { label: t("state"), value: address?.state },
    { label: t("country"), value: address?.country },
  ], commonT("yes"), commonT("no"));

  const availabilityInfo = compactInfo([
    { label: t("available"), value: availability?.isAvailable },
    { label: t("temporarilyClosed"), value: availability?.isTemporarilyClosed },
    { label: t("deleted"), value: deletionState?.isDeleted },
  ], commonT("yes"), commonT("no"));

  const statsInfo = compactInfo([
    { label: t("users"), value: _count?.users },
    { label: t("orders"), value: _count?.orders },
    { label: t("deliverymen"), value: _count?.deliverymen },
  ], commonT("yes"), commonT("no"));

  const auditInfo = compactInfo([
    { label: commonT("createdAt"), value: formatDate(branch.createdAt) },
    { label: commonT("updatedAt"), value: formatDate(branch.updatedAt) },
  ], commonT("yes"), commonT("no"));

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-24px)] max-w-[960px] flex-col overflow-hidden rounded-[20px] p-0 sm:w-[calc(100vw-48px)] sm:max-w-[960px]">
        <div className="relative h-44 shrink-0 bg-gray-200">
          {branch.coverImage ? (
            <Image src={branch.coverImage} alt="Branch cover" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-orange-50 to-gray-100">
              <div className="flex flex-col items-center gap-2 text-primary/70">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                  <ImageIcon size={24} />
                </div>
                <span className="max-w-[260px] truncate px-4 text-sm font-semibold text-gray-500">
                  {branch.name || commonT("branch")}
                </span>
              </div>
            </div>
          )}

          {branch.coverImage ? <div className="absolute inset-0 bg-black/20" /> : null}

          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <div className="relative size-20 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
              {branch.logoUrl ? (
                <Image src={branch.logoUrl} alt="Branch logo" fill className="object-contain" />
              ) : (
                <div className="flex h-full items-center justify-center bg-primary/10 text-primary">
                  <Store size={30} aria-label={t("noLogo")} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-6 pt-14 sm:px-6">
          <DialogHeaderComponent
            title={branch.name || commonT("branch")}
            badgeText={branch.isMain ? t("mainBranch") : commonT("branch")}
            branchId={branch.id || ""}
            createdAt={branch.createdAt}
            updatedAt={branch.updatedAt}
          />

          <div className="grid gap-5 lg:grid-cols-2">
            {branchInfo.length ? <BranchInfoCard title={commonT("branch")} info={branchInfo} /> : null}
            {managerInfo.length ? <BranchInfoCard title={t("manager")} info={managerInfo} /> : null}
            {addressInfo.length ? <BranchInfoCard title={commonT("address")} info={addressInfo} /> : null}
            {availabilityInfo.length ? <BranchInfoCard title={t("availability")} info={availabilityInfo} /> : null}
            {statsInfo.length ? <BranchInfoCard title={t("stats")} info={statsInfo} /> : null}
            {auditInfo.length ? <BranchInfoCard title={t("audit")} info={auditInfo} /> : null}

            <Card className="rounded-lg border-none bg-[#F5F5F5] p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-black">
                  {t("holidayOpeningHours")}
                </h3>
                {fetchingHolidayHours ? (
                  <Loader2 size={16} className="animate-spin text-primary" />
                ) : (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600">
                    {t("entries")}: {holidayOpeningHours.length}
                  </span>
                )}
              </div>

              {fetchingHolidayHours ? (
                <div className="mt-4 space-y-3">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-16 animate-pulse rounded-xl bg-white"
                    />
                  ))}
                </div>
              ) : holidayOpeningHours.length ? (
                <div className="mt-4 space-y-3">
                  {holidayOpeningHours.map((holiday, index) => {
                    const timeRange = formatHolidayTimeRange(
                      holiday,
                      t("closedForHoliday")
                    );
                    const dateLabel = formatHolidayDateRange(holiday);

                    return (
                      <div
                        key={`${holiday.date || holiday.fromDate || "holiday"}-${holiday.id || index}`}
                        className="rounded-xl bg-white p-4 ring-1 ring-gray-100"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                              <CalendarDays size={16} className="text-primary" />
                              <span>{dateLabel || t("holidayDate")}</span>
                            </div>

                            {timeRange ? (
                              <div className="mt-2 flex items-center gap-2 text-xs font-medium text-gray-600">
                                <Clock3 size={14} className="text-gray-400" />
                                <span>{timeRange}</span>
                              </div>
                            ) : null}
                          </div>

                          <span
                            className={
                              holiday.isClosed
                                ? "inline-flex w-fit rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600"
                                : "inline-flex w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600"
                            }
                          >
                            {holiday.isClosed ? t("closed") : t("open")}
                          </span>
                        </div>

                        {holiday.note ? (
                          <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">
                            {holiday.note}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-white p-5 text-center">
                  <CalendarDays className="mx-auto mb-3 text-gray-300" size={24} />
                  <p className="text-sm font-medium text-gray-700">
                    {t("noHolidayHours")}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-400">
                    {t("noHolidayHoursDescription")}
                  </p>
                </div>
              )}
            </Card>

            {hasLocation ? (
              <Card className="rounded-lg border-none bg-[#F5F5F5] p-4">
                <h3 className="text-center text-sm font-semibold text-black">{t("location")}</h3>
                <div className="mt-2 overflow-hidden rounded-lg">
                  <iframe
                    width="100%"
                    height="150"
                    loading="lazy"
                    title={t("branchLocation")}
                    src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
                  />
                </div>
              </Card>
            ) : null}
          </div>
        </div>

        <DialogFooterComponent closeDialog={closeDialog} branchId={branch.id} />
      </DialogContent>
    </Dialog>
  );
}

export { BranchDetailsModal as default };
