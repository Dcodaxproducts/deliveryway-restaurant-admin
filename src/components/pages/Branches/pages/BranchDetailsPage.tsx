"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  ImageIcon,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

import Container from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import {
  useGetBranch,
  useGetBranchHolidayOpeningHours,
} from "@/hooks/useBranches";
import { formatDateTime24 } from "@/lib/date-time-format";
import { getApiErrorMessage } from "@/lib/errors";

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const text = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const readHolidayHours = (response: unknown) => {
  const root = isRecord(response) ? response : {};
  const data = isRecord(root.data) ? root.data : root.data;
  const nested = isRecord(data) ? data : {};
  const rows = [
    nested.holidayOpeningHours,
    root.holidayOpeningHours,
    data,
    response,
  ].find(Array.isArray);

  return Array.isArray(rows) ? rows.filter(isRecord) : [];
};

const formatAddress = (address: RecordValue) =>
  [
    address.street,
    address.area,
    address.postalCode,
    address.city,
    address.state,
    address.country,
  ]
    .map(text)
    .filter(Boolean)
    .join(", ");

function DetailRow({ label, value }: { label: string; value: unknown }) {
  const display = text(value);
  if (!display) return null;

  return (
    <div className="grid gap-1 border-b border-slate-100 py-3 last:border-0 sm:grid-cols-[150px_1fr]">
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </dt>
      <dd className="break-words text-sm font-medium text-slate-800 sm:text-right">
        {display}
      </dd>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: unknown;
}) {
  return (
    <div className="rounded-[16px] bg-white p-4 ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-[12px] bg-slate-100 text-slate-600">
          <Icon size={19} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums text-slate-950">
            {text(value) || "0"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BranchDetailsPage() {
  const params = useParams<{ branchId: string }>();
  const branchId = params?.branchId ?? "";
  const t = useTranslations("branches");
  const commonT = useTranslations("common");
  const branchQuery = useGetBranch(branchId);
  const holidayQuery = useGetBranchHolidayOpeningHours(branchId || undefined);

  if (branchQuery.isLoading) {
    return (
      <Container>
        <div className="space-y-5 animate-pulse">
          <div className="h-8 w-40 rounded bg-slate-200" />
          <div className="h-72 rounded-[24px] bg-slate-200" />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="h-72 rounded-[20px] bg-slate-100 lg:col-span-2" />
            <div className="h-72 rounded-[20px] bg-slate-100" />
          </div>
        </div>
      </Container>
    );
  }

  if (branchQuery.error || !branchQuery.data) {
    return (
      <Container>
        <Link
          href="/branches"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
        >
          <ArrowLeft size={17} aria-hidden="true" /> Back to branches
        </Link>
        <div className="mt-6 rounded-[18px] border border-red-100 bg-red-50 px-6 py-10 text-center text-sm text-red-700">
          {getApiErrorMessage(branchQuery.error, "Unable to load this branch.")}
        </div>
      </Container>
    );
  }

  const branch = isRecord(branchQuery.data) ? branchQuery.data : {};
  const address = isRecord(branch.address) ? branch.address : {};
  const restaurant = isRecord(branch.restaurant) ? branch.restaurant : {};
  const manager = isRecord(branch.manager) ? branch.manager : {};
  const managerProfile = isRecord(manager.profile) ? manager.profile : {};
  const availability = isRecord(branch.availability) ? branch.availability : {};
  const counts = isRecord(branch._count) ? branch._count : {};
  const settings = isRecord(branch.settings) ? branch.settings : {};
  const orderTypes = Array.isArray(settings.allowedOrderTypes)
    ? settings.allowedOrderTypes.map(text).filter(Boolean)
    : [];
  const holidayHours = readHolidayHours(holidayQuery.data);
  const latitude = text(address.lat);
  const longitude = text(address.lng);
  const fullAddress = formatAddress(address);
  const isAvailable = availability.isAvailable === true;

  return (
    <Container>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/branches"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-primary"
        >
          <ArrowLeft size={17} aria-hidden="true" /> Back to branches
        </Link>
        <Button
          asChild
          size="lg"
          className="h-11 rounded-[11px] px-5 shadow-sm active:scale-[0.98]"
        >
          <Link href={`/branches/edit?branchId=${branchId}`}>
            <Edit3 size={17} aria-hidden="true" /> {t("editDetails")}
          </Link>
        </Button>
      </div>

      <main className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#F8FAFC] shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <section className="relative min-h-72 overflow-hidden bg-slate-900">
          {text(branch.coverImage) ? (
            <Image
              src={text(branch.coverImage)}
              alt={`${text(branch.name)} cover`}
              fill
              priority
              className="object-cover opacity-70"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(204,0,0,0.42),transparent_35%),linear-gradient(135deg,#111827,#334155)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
          {!text(branch.coverImage) ? (
            <ImageIcon
              className="absolute right-8 top-8 text-white/15"
              size={86}
              aria-hidden="true"
            />
          ) : null}

          <div className="relative flex min-h-72 flex-col justify-end p-6 sm:p-9">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-[18px] border-4 border-white/80 bg-white shadow-xl sm:size-24">
                {text(branch.logoUrl) ? (
                  <Image
                    src={text(branch.logoUrl)}
                    alt={`${text(branch.name)} logo`}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-primary/10 text-primary">
                    <Store size={34} aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 text-white">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isAvailable ? "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/30" : "bg-red-400/20 text-red-100 ring-1 ring-red-300/30"}`}
                  >
                    <CheckCircle2 size={13} aria-hidden="true" />{" "}
                    {isAvailable ? t("available") : t("closed")}
                  </span>
                  {branch.isMain === true ? (
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
                      {t("mainBranch")}
                    </span>
                  ) : null}
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {text(branch.name) || commonT("branch")}
                </h1>
                <p className="mt-2 flex items-start gap-2 text-sm text-slate-200">
                  <MapPin
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />{" "}
                  {fullAddress || commonT("noData")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="p-5 sm:p-7 lg:p-9">
          <section className="grid gap-3 sm:grid-cols-3">
            <Metric
              icon={ShoppingBag}
              label={t("orders")}
              value={counts.orders}
            />
            <Metric icon={Users} label={t("users")} value={counts.users} />
            <Metric
              icon={Truck}
              label={t("deliverymen")}
              value={counts.deliverymen}
            />
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div className="space-y-6">
              <section className="rounded-[18px] bg-white p-5 ring-1 ring-slate-200 sm:p-6">
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                  Branch information
                </h2>
                <dl className="mt-3">
                  <DetailRow label={t("branchName")} value={branch.name} />
                  <DetailRow label={t("restaurant")} value={restaurant.name} />
                  <DetailRow
                    label={t("restaurantSlug")}
                    value={restaurant.slug}
                  />
                  <DetailRow label={t("id")} value={branchId} />
                  <DetailRow
                    label={commonT("createdAt")}
                    value={
                      branch.createdAt
                        ? formatDateTime24({ value: text(branch.createdAt) })
                        : ""
                    }
                  />
                  <DetailRow
                    label={commonT("updatedAt")}
                    value={
                      branch.updatedAt
                        ? formatDateTime24({ value: text(branch.updatedAt) })
                        : ""
                    }
                  />
                </dl>
              </section>

              <section className="rounded-[18px] bg-white p-5 ring-1 ring-slate-200 sm:p-6">
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                  Manager & contact
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[14px] bg-slate-50 p-4">
                    <Mail className="size-5 text-primary" aria-hidden="true" />
                    <p className="mt-3 text-xs font-medium text-slate-500">
                      Email
                    </p>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                      {text(manager.email) || commonT("noData")}
                    </p>
                  </div>
                  <div className="rounded-[14px] bg-slate-50 p-4">
                    <Phone className="size-5 text-primary" aria-hidden="true" />
                    <p className="mt-3 text-xs font-medium text-slate-500">
                      Phone
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {text(managerProfile.phone) || commonT("noData")}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[18px] bg-white p-5 ring-1 ring-slate-200 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                    {t("holidayOpeningHours")}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {holidayHours.length} {t("entries")}
                  </span>
                </div>
                {holidayQuery.isLoading ? (
                  <div className="mt-4 h-20 animate-pulse rounded-[14px] bg-slate-100" />
                ) : holidayHours.length ? (
                  <div className="mt-4 space-y-3">
                    {holidayHours.map((holiday, index) => {
                      const from = text(holiday.fromDate || holiday.date);
                      const to = text(holiday.toDate);
                      const dateLabel =
                        to && to !== from ? `${from} – ${to}` : from;
                      const isClosed = holiday.isClosed === true;
                      return (
                        <div
                          key={text(holiday.id) || `${dateLabel}-${index}`}
                          className="flex flex-col gap-3 rounded-[14px] bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <CalendarDays
                                size={16}
                                className="text-primary"
                                aria-hidden="true"
                              />
                              {dateLabel}
                            </p>
                            {!isClosed ? (
                              <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                <Clock3 size={14} aria-hidden="true" />
                                {text(holiday.openTime)} –{" "}
                                {text(holiday.closeTime)}
                              </p>
                            ) : null}
                          </div>
                          <span
                            className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${isClosed ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
                          >
                            {isClosed ? t("closed") : t("open")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 rounded-[14px] border border-dashed border-slate-300 px-4 py-7 text-center text-sm text-slate-500">
                    {t("noHolidayHoursDescription")}
                  </p>
                )}
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-[18px] bg-white p-5 ring-1 ring-slate-200 sm:p-6">
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                  {commonT("address")}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {fullAddress || commonT("noData")}
                </p>
                {latitude && longitude ? (
                  <iframe
                    className="mt-4 h-64 w-full rounded-[14px] border-0"
                    loading="lazy"
                    title={t("branchLocation")}
                    src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
                  />
                ) : null}
              </section>

              <section className="rounded-[18px] bg-white p-5 ring-1 ring-slate-200 sm:p-6">
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                  {t("availableOrderTypes")}
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {orderTypes.length ? (
                    orderTypes.map((type) => (
                      <span
                        key={type}
                        className="rounded-[9px] bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
                      >
                        {type.replaceAll("_", " ")}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      {commonT("noData")}
                    </p>
                  )}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </Container>
  );
}
