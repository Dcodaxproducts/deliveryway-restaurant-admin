"use client";

import Image from "next/image";

import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import BranchInfoCard from "./BranchInfoCard";
import DialogFooterComponent from "./DialogFooterComponent";
import DialogHeaderComponent from "./DialogHeaderComponent";

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

const formatBoolean = (value?: boolean | null) => {
  if (typeof value !== "boolean") return undefined;
  return value ? "Yes" : "No";
};

const formatDate = (value?: string | null) => {
  if (!value) return undefined;
  return new Date(value).toLocaleString();
};

const compactInfo = (items: InfoItem[]) =>
  items
    .map(({ label, value }) => ({
      label,
      value:
        typeof value === "boolean"
          ? formatBoolean(value)
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

export default function BranchDetailsModal({
  isOpen,
  closeDialog,
  branch,
}: {
  isOpen: boolean;
  closeDialog: () => void;
  branch: BranchDetails | null;
}) {
  if (!branch) return null;

  const { address, availability, deletionState, restaurant, manager, _count } = branch;
  const latitude = address?.lat;
  const longitude = address?.lng;
  const hasLocation = latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null;

  const branchInfo = compactInfo([
    { label: "Branch Name", value: branch.name },
    { label: "Restaurant", value: restaurant?.name },
    { label: "Restaurant Slug", value: restaurant?.slug },
  ]);

  const managerInfo = compactInfo([
    { label: "Manager Email", value: manager?.email },
    { label: "Manager Name", value: getManagerName(branch) },
    { label: "Manager Phone", value: manager?.profile?.phone },
  ]);

  const addressInfo = compactInfo([
    { label: "Street", value: address?.street },
    { label: "Area", value: address?.area },
    { label: "City", value: address?.city },
    { label: "State", value: address?.state },
    { label: "Country", value: address?.country },
  ]);

  const availabilityInfo = compactInfo([
    { label: "Available", value: availability?.isAvailable },
    { label: "Temporarily Closed", value: availability?.isTemporarilyClosed },
    { label: "Deleted", value: deletionState?.isDeleted },
  ]);

  const statsInfo = compactInfo([
    { label: "Users", value: _count?.users },
    { label: "Orders", value: _count?.orders },
    { label: "Deliverymen", value: _count?.deliverymen },
  ]);

  const auditInfo = compactInfo([
    { label: "Created At", value: formatDate(branch.createdAt) },
    { label: "Updated At", value: formatDate(branch.updatedAt) },
  ]);

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent className="max-h-[95vh] max-w-lg overflow-auto overflow-hidden rounded-[18px] p-0">
        <div className="relative h-40 bg-gray-200">
          {branch.coverImage ? (
            <Image src={branch.coverImage} alt="Branch cover" fill className="object-cover" />
          ) : null}

          <div className="absolute inset-0 bg-black/20" />

          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <div className="relative size-20 overflow-hidden rounded-full border-4 border-white bg-white">
              {branch.logoUrl ? (
                <Image src={branch.logoUrl} alt="Branch logo" fill className="object-contain" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                  No Logo
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 pb-6 pt-14">
          <DialogHeaderComponent
            title={branch.name || "Branch"}
            badgeText={branch.isMain ? "Main Branch" : "Branch"}
            branchId={branch.id || ""}
            createdAt={branch.createdAt}
            updatedAt={branch.updatedAt}
          />

          {branchInfo.length ? <BranchInfoCard title="Branch" info={branchInfo} /> : null}
          {managerInfo.length ? <BranchInfoCard title="Manager" info={managerInfo} /> : null}
          {addressInfo.length ? <BranchInfoCard title="Address" info={addressInfo} /> : null}
          {availabilityInfo.length ? <BranchInfoCard title="Availability" info={availabilityInfo} /> : null}
          {statsInfo.length ? <BranchInfoCard title="Stats" info={statsInfo} /> : null}
          {auditInfo.length ? <BranchInfoCard title="Audit" info={auditInfo} /> : null}

          {hasLocation ? (
            <Card className="rounded-lg border-none bg-[#F5F5F5] p-4">
              <h3 className="text-center text-sm font-semibold text-black">Location</h3>
              <div className="mt-2 overflow-hidden rounded-lg">
                <iframe
                  width="100%"
                  height="150"
                  loading="lazy"
                  title="Branch location"
                  src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
                />
              </div>
            </Card>
          ) : null}
        </div>

        <DialogFooterComponent closeDialog={closeDialog} branchId={branch.id} />
      </DialogContent>
    </Dialog>
  );
}
