"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/* ---------- TYPES ---------- */
type Customer = any;

type CustomerDetailModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
};

export default function CustomerDetailModal({
  open,
  onOpenChange,
  customer,
}: CustomerDetailModalProps) {
  if (!customer) return null;

  const {
    id,
    email,
    profile,
    role,
    isGuest,
    isVerified,
    isApproved,
    isActive,
    tenant,
    restaurant,
    branch,
    createdAt,
    _count,
    verificationOtpAttempts,
    resetPasswordOtpAttempts,
    deletedAt,
  } = customer;
  const fullName = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
  const profileAvatarUrl = profile?.avatarUrl;

  const avatar =
    profileAvatarUrl?.startsWith("http")
      ? profileAvatarUrl
      : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200";

  const formatDate = (date?: string) =>
    date ? new Date(date).toLocaleString() : "-";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] max-h-[85vh] overflow-y-auto rounded-[18px] px-6 py-8">

        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Customer #{id?.slice(-6)}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 text-center">
            Full customer details
          </DialogDescription>
        </DialogHeader>

        {/* Avatar */}
        <div className="flex justify-center mt-4">
          <Image
            src={avatar}
            alt="Customer"
            width={120}
            height={120}
            className="rounded-[16px] object-cover"
          />
        </div>

        {/* Basic Info */}
        <div className="mt-6 space-y-3 text-sm">
          <InfoRow label="Name" value={fullName || "-"} />
        <InfoRow
  label="Email"
  value={
    <span className="max-w-[160px] truncate inline-block" title={email}>
      {email?.trim() || "-"}
    </span>
  }
/>  <InfoRow label="Phone" value={profile?.phone?.trim() || "-"} />
          <InfoRow label="Role" value={role} />
          <InfoRow label="Guest" value={isGuest ? "Yes" : "No"} />
          <InfoRow label="Verified" value={isVerified ? "Yes" : "No"} />
          <InfoRow label="Approved" value={isApproved ? "Yes" : "No"} />
          <InfoRow label="Status" value={isActive ? "Active" : "Blocked"} />
        </div>

        {/* Meta Info */}
        <div className="mt-6 space-y-3 text-sm">
          <InfoRow label="Tenant" value={tenant?.name?.trim() || "-"} />
          <InfoRow label="Restaurant" value={restaurant?.name?.trim() || "-"} />
          <InfoRow label="Branch" value={branch?.name?.trim() || "-"} />
        </div>

        {/* Dates (cleaned) */}
        <div className="mt-6 space-y-3 text-sm">
          <InfoRow label="Created At" value={formatDate(createdAt)} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <StatCard value={_count?.customerOrders ?? 0} label="Orders" />
          <StatCard value={_count?.couponUsages ?? 0} label="Coupons" />
          <StatCard value={verificationOtpAttempts ?? 0} label="OTP Attempts" />
          <StatCard value={resetPasswordOtpAttempts ?? 0} label="Reset Attempts" />
          <StatCard
            value={deletedAt ? "Yes" : "No"}
            label="Deleted"
            full
          />
        </div>

        <Button
          onClick={() => onOpenChange(false)}
          className="mt-6 w-full h-[44px] rounded-[12px] bg-primary text-white hover:bg-primary/90"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Helpers ---------- */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">
        {label} :
      </span>
      <span className="text-gray-700 text-right max-w-[60%] truncate">
        {value}
      </span>
    </div>
  );
}

function StatCard({
  value,
  label,
  full,
}: {
  value: any;
  label: string;
  full?: boolean;
}) {
  return (
    <div
      className={`border border-gray-400 rounded-[12px] p-4 text-center ${
        full ? "col-span-2" : ""
      }`}
    >
      <p className="text-lg font-semibold text-dark">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
