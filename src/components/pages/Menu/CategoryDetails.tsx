"use client";

import Container from "@/components/container";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { useGetMenuCategoryById } from "@/hooks/useMenuCategories";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Layers,
  ListTree,
  Package,
  SlidersHorizontal,
  Tags,
  Utensils,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";

export default function CategoryDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id || "");

  const { data: response, isLoading } = useGetMenuCategoryById(id);

  const category = response?.data || response;

  const items = Array.isArray(category?.items) ? category.items : [];
  const variations = Array.isArray(category?.variations)
    ? category.variations
    : [];
  const modifierGroups = Array.isArray(category?.modifierGroups)
    ? category.modifierGroups
    : [];
  const children = Array.isArray(category?.children) ? category.children : [];

  const itemCount = category?._count?.items ?? items.length ?? 0;
  const childrenCount = category?._count?.children ?? children.length ?? 0;

  if (isLoading) {
    return (
      <Container>
        <CategoryDetailsSkeleton />
      </Container>
    );
  }

  if (!category?.id) {
    return (
      <Container>
        <div className="rounded-[20px] bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">Category not found.</p>

          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-5 rounded-[12px]"
          >
            <ArrowLeft size={18} />
            Back
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Header
          title="Category Details"
          description="View category information, items, variations, and modifier groups"
        />

        <Button
          variant="outline"
          onClick={() => router.back()}
          className="h-[44px] rounded-[14px]"
        >
          <ArrowLeft size={18} />
          Back
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-[24px] bg-white shadow-sm">
        <div className="relative h-[280px] bg-gray-100">
          {category.imageUrl ? (
            <img
              src={category.imageUrl}
              alt={category.name || "Category image"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#F9FAFB]">
              <Package size={54} className="text-gray-300" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />

          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="mb-3 flex flex-wrap gap-2">
              <StatusBadge active={category.isActive} />

              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
                /{category.slug || "no-slug"}
              </span>

              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
                Priority: {getPriorityLabel(category.sortOrder)}
              </span>
            </div>

            <h1 className="text-3xl font-semibold">
              {category.name || "Unnamed Category"}
            </h1>

            <p className="mt-2 max-w-[760px] text-sm text-white/90">
              {category.description || "No description available"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Package size={20} />}
            label="Menu Items"
            value={itemCount}
          />
          <StatCard
            icon={<SlidersHorizontal size={20} />}
            label="Variations"
            value={variations.length}
          />
          <StatCard
            icon={<Layers size={20} />}
            label="Modifier Groups"
            value={modifierGroups.length}
          />
          <StatCard
            icon={<ListTree size={20} />}
            label="Sub Categories"
            value={childrenCount}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr,1.4fr]">
        <div className="space-y-6">
          <SectionCard title="Overview">
            <div className="space-y-4">
              <InfoTile
                icon={<Tags size={18} />}
                label="Category Slug"
                value={category.slug || "Not configured"}
              />

              <InfoTile
                icon={<ListTree size={18} />}
                label="Hierarchy"
                value={
                  category.parent?.name
                    ? `Child of ${category.parent.name}`
                    : childrenCount > 0
                    ? `${childrenCount} child categories`
                    : "Top-level category"
                }
              />

              <InfoTile
                icon={<SlidersHorizontal size={18} />}
                label="Display Priority"
                value={getPriorityLabel(category.sortOrder)}
              />

              <InfoTile
                icon={<CheckCircle2 size={18} />}
                label="Availability"
                value={category.isActive ? "Visible to customers" : "Hidden"}
              />

              <InfoTile
                icon={<CalendarDays size={18} />}
                label="Created"
                value={formatDate(category.createdAt)}
              />

              <InfoTile
                icon={<Clock size={18} />}
                label="Last Updated"
                value={formatDate(category.updatedAt)}
              />
            </div>
          </SectionCard>

          <SectionCard title="Menu Items">
            {items.length === 0 ? (
              <EmptyState message="No menu items found in this category." />
            ) : (
              <div className="space-y-3">
                {items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-[14px] border border-gray-100 bg-[#F9FAFB] p-3"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[12px] bg-white">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Utensils size={18} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {item.name || "Unnamed Item"}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        /{item.slug || "no-slug"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatPrice(item.basePrice)}
                      </p>
                      <StatusDot active={item.isActive} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Variations">
            {variations.length === 0 ? (
              <EmptyState message="No variations configured for this category." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {variations.map((variation: any) => (
                  <div
                    key={variation.id}
                    className="rounded-[16px] border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-gray-900">
                          {variation.name || "Unnamed Variation"}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                          {variation.description || "No description"}
                        </p>
                      </div>

                      <StatusBadge active={variation.isActive} compact />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MiniMetric
                        label="Base Price"
                        value={formatPrice(variation.price)}
                      />
                      <MiniMetric
                        label="Priority"
                        value={getPriorityLabel(variation.sortOrder)}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {variation.isDefault ? (
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                          Default
                        </span>
                      ) : null}

                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        SKU: {variation.sku || "N/A"}
                      </span>

                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        Item overrides:{" "}
                        {Array.isArray(variation.itemPriceOverrides)
                          ? variation.itemPriceOverrides.length
                          : 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Modifier Groups">
            {modifierGroups.length === 0 ? (
              <EmptyState message="No modifier groups linked with this category." />
            ) : (
              <div className="space-y-4">
                {modifierGroups.map((group: any) => (
                  <div
                    key={group.id}
                    className="rounded-[18px] border border-gray-200 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {group.name || "Unnamed Group"}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {group.description || "No description"}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                          group.isRequired
                            ? "bg-primary/10 text-primary"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {group.isRequired ? "Required" : "Optional"}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      <MiniMetric label="Min Select" value={group.minSelect ?? 0} />
                      <MiniMetric label="Max Select" value={group.maxSelect ?? 0} />
                      <MiniMetric
                        label="Priority"
                        value={getPriorityLabel(group.sortOrder)}
                      />
                      <MiniMetric
                        label="Modifiers"
                        value={group.modifiers?.length ?? 0}
                      />
                    </div>

                    {group.modifiers?.length ? (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {group.modifiers.map((modifier: any) => (
                          <div
                            key={modifier.id}
                            className="rounded-[12px] bg-[#F9FAFB] px-3 py-2"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {modifier.name || "Unnamed Modifier"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Price Delta: {formatPrice(modifier.priceDelta)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-[12px] border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                        No modifiers inside this group.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </Container>
  );
}

function CategoryDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="h-8 w-[240px] animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-[340px] animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-11 w-[100px] animate-pulse rounded-[14px] bg-gray-200" />
      </div>

      <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
        <div className="h-[280px] animate-pulse bg-gray-200" />

        <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[18px] border border-gray-100 bg-[#F9FAFB] p-5"
            >
              <div className="mb-4 h-10 w-10 animate-pulse rounded-[12px] bg-gray-200" />
              <div className="h-7 w-16 animate-pulse rounded bg-gray-200" />
              <div className="mt-3 h-4 w-24 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.4fr]">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[20px] bg-white p-6 shadow-sm"
          >
            <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="h-16 animate-pulse rounded-[14px] bg-gray-100"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[20px] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[18px] border border-gray-100 bg-[#F9FAFB] p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-[14px] border border-gray-100 bg-[#F9FAFB] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-primary">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-gray-900">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[12px] bg-[#F9FAFB] p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[16px] border border-dashed border-gray-200 bg-[#F9FAFB] p-6 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}

function StatusBadge({
  active,
  compact = false,
}: {
  active?: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
      } ${compact ? "shrink-0" : ""}`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function StatusDot({ active }: { active?: boolean }) {
  return (
    <p
      className={`mt-1 text-xs font-medium ${
        active ? "text-green-600" : "text-gray-400"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </p>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString();
}

function formatPrice(value: any) {
  const amount = Number(value ?? 0);

  if (Number.isNaN(amount)) return "0";

  return amount.toLocaleString(undefined, {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function getPriorityLabel(value: any) {
  const order = Number(value ?? 0);

  if (order === 0) return "Top Priority";
  if (order <= 10) return "High Priority";
  if (order <= 50) return "Medium Priority";
  return "Low Priority";
}