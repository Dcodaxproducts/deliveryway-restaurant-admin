"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useDeleteDeliveryman, useUpdateDeliveryman } from "@/hooks/useDeliverymen";
import { toast } from "sonner";

type DeliveryManDetailsProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: any;
};

export default function DeliveryManDetails({
  open,
  onOpenChange,
  data,
}: DeliveryManDetailsProps) {
  const router = useRouter();
  const updateDeliverymanMutation = useUpdateDeliveryman();
  const deleteDeliverymanMutation = useDeleteDeliveryman();
  const loading = updateDeliverymanMutation.isPending || deleteDeliverymanMutation.isPending;

  const [isBlocked, setIsBlocked] = useState(data?.isBlocked || false);
  const [showExtra, setShowExtra] = useState(false);

  if (!data) return null;

  const handleToggle = async (checked: boolean) => {
    setIsBlocked(checked);

    try {
      await updateDeliverymanMutation.mutateAsync({ id: data.id, payload: {} });
      toast.success(`Deliveryman ${checked ? "blocked" : "unblocked"}`);
    } catch {
      toast.error("Failed to update status");
      setIsBlocked(!checked);
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm("Are you sure you want to delete?");
    if (!confirm) return;

    await deleteDeliverymanMutation.mutateAsync(data.id);

    if (true) {
      toast.success("Deleted successfully");
      onOpenChange(false);
    }
  };

  const handleEdit = () => {
    router.push(`/deliveryman/add?editId=${data.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] max-h-[85vh] overflow-y-auto rounded-[18px] px-6 py-8">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-semibold text-center">
            Delivery Man #{data?.id || "N/A"}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 text-center">
            View delivery man information and activity
          </DialogDescription>
        </DialogHeader>

        {/* Avatar */}
        <div className="flex justify-center mt-4">
          <div className="relative">
            <Image
              src={data?.image || "/deliveryboy.png"}
              alt="Deliveryman"
              width={180}
              height={180}
              className="rounded-[16px] object-cover"
            />

            <button
              onClick={handleDelete}
              className="absolute bottom-2 right-2 size-8 rounded-full bg-white shadow flex items-center justify-center text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Block / Unblock */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <span className="text-sm text-gray-500">Block / Unblock</span>
          <Switch
            checked={isBlocked}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>

        {/* Info */}
        <div className="mt-6 space-y-3 text-sm">
          <InfoRow
            label="Name"
            value={`${data?.firstName || ""} ${data?.lastName || ""}`}
            showDots
          />
          <InfoRow label="Phone" value={data?.phone || "N/A"} showDots />
          <InfoRow label="Email" value={data?.email || "N/A"} showDots />
          <InfoRow
            label="Joining Date"
            value={
              data?.createdAt
                ? new Date(data.createdAt).toLocaleString()
                : "N/A"
            }
            showDots
          />

          {/* Toggle Extra */}
          <InfoRow
            label="Address"
            value="View all Address"
            link
            showDots
            onClick={() => setShowExtra(!showExtra)}
          />

          {/* EXTRA DETAILS */}
          {showExtra && (
            <div className="space-y-2 mt-2 border-t pt-3">
              <InfoRow
                label="Vehicle Type"
                value={data?.vehicleType || "N/A"}
              />
              <InfoRow
                label="Vehicle Number"
                value={data?.vehicleNumber || "N/A"}
              />
              <InfoRow
                label="Branch"
                value={data?.branch?.name || "N/A"}
              />
              <InfoRow
                label="Assigned Orders"
                value={String(data?._count?.orders || 0)}
              />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 mt-6">
          <StatCard
            value={String(data?._count?.orders || 0)}
            label="Assigned Orders"
          />
          {/* <StatCard value="N/A" label="Order Limit" /> */}
        </div>

        <Button
          onClick={handleEdit}
          className="mt-6 w-full h-[44px] rounded-[12px] bg-primary text-white hover:bg-primary/90"
        >
          Edit
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Helpers ---------- */

function InfoRow({
  label,
  value,
  link,
  showDots,
  onClick,
}: {
  label: string;
  value: string;
  link?: boolean;
  showDots?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center">
      <span className="text-gray-600">{label}</span>

      {showDots ? (
        <button className="p-1 rounded-full hover:bg-gray-200 justify-self-center">
          <TwoDotsVertical size={16} color="#6A7282" />
        </button>
      ) : (
        <span />
      )}

      {link ? (
        <button
          onClick={onClick}
          className="text-primary underline text-sm font-medium justify-self-end"
        >
          {value}
        </button>
      ) : (
        <span className="text-gray-600 justify-self-end">{value}</span>
      )}
    </div>
  );
}

const TwoDotsVertical = ({ size = 16, color = "#6A7282" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <circle cx="12" cy="8" r="1.5" />
    <circle cx="12" cy="16" r="1.5" />
  </svg>
);

function StatCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="border border-gray-400 rounded-[12px] p-4 text-center">
      <p className="text-lg font-semibold text-dark mb-1">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}
