"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AdminDeal } from "@/types/admin-deals";

type AdminDealDeleteDialogProps = {
  deal: AdminDeal | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function AdminDealDeleteDialog({
  deal,
  deleting,
  onClose,
  onConfirm,
}: AdminDealDeleteDialogProps) {
  if (!deal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[18px] bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">Delete deal</h3>
        <p className="mt-2 text-sm text-gray-500">
          Are you sure you want to delete{" "}
          <span className="font-medium text-gray-800">{deal.title}</span>? This will
          deactivate the deal through the backend delete endpoint.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={deleting}
            onClick={onClose}
            className="rounded-[12px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="rounded-[12px] bg-primary text-white hover:bg-primary/90"
          >
            {deleting ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
