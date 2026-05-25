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

  const fullName = `${customer?.profile?.firstName || ""} ${
    customer?.profile?.lastName || ""
  }`.trim();

  const avatar =
    customer?.profile?.avatarUrl?.startsWith("http")
      ? customer.profile.avatarUrl
      : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200";

  const formatDate = (date?: string) =>
    date ? new Date(date).toLocaleString() : "-";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] max-h-[85vh] overflow-y-auto rounded-[18px] px-6 py-8">

        {/* Header */}
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Customer #{customer.id?.slice(-6)}
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
    <span className="max-w-[160px] truncate inline-block" title={customer.email}>
      {customer.email || "-"}
    </span>
  }
/>  <InfoRow label="Phone" value={customer?.profile?.phone || "-"} />
          <InfoRow label="Role" value={customer.role} />
          <InfoRow label="Guest" value={customer.isGuest ? "Yes" : "No"} />
          <InfoRow label="Verified" value={customer.isVerified ? "Yes" : "No"} />
          <InfoRow label="Approved" value={customer.isApproved ? "Yes" : "No"} />
          <InfoRow label="Status" value={customer.isActive ? "Active" : "Blocked"} />
        </div>

        {/* Meta Info */}
        <div className="mt-6 space-y-3 text-sm">
          <InfoRow label="Tenant" value={customer?.tenant?.name || "-"} />
          <InfoRow label="Restaurant" value={customer?.restaurant?.name || "-"} />
          <InfoRow label="Branch" value={customer?.branch?.name || "-"} />
        </div>

        {/* Dates (cleaned) */}
        <div className="mt-6 space-y-3 text-sm">
          <InfoRow label="Created At" value={formatDate(customer.createdAt)} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <StatCard value={customer?._count?.customerOrders || 0} label="Orders" />
          <StatCard value={customer?._count?.couponUsages || 0} label="Coupons" />
          <StatCard value={customer?.verificationOtpAttempts || 0} label="OTP Attempts" />
          <StatCard value={customer?.resetPasswordOtpAttempts || 0} label="Reset Attempts" />
          <StatCard
            value={customer?.deletedAt ? "Yes" : "No"}
            label="Deleted"
            full
          />
        </div>

        {/* Footer */}
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