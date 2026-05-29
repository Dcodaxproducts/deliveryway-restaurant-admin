"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import BorderedSearchBar from "@/components/common/BorderedSearchBar";
import PosModalHeader from "@/components/pages/Pos/components/pos/PosModalHeader";
import ModalActionFooter from "@/components/pages/Pos/components/pos/PosModalActionFooter";

export default function HoldOrdersModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [search, setSearch] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px] rounded-[28px] px-10 py-8 bg-[#F5F5F5]">
      
        <PosModalHeader
        title="Hold Orders"
        description="View your hold orders from here"
      />
      
        <div className="mt-6">
          <BorderedSearchBar
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
          />
        </div>

          <div className="mt-6 bg-white rounded-2xl border-none p-9 space-y-4">
            {/* Row 1 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-[16px]  text-[#101828]">
                  Hold ID:{" "}
                 #11106
                </p>

                {/* Empty green dot as per design */}
                <span className="size-6 rounded-full bg-[#ECFDF3]" />
              </div>

              <span className="text-sm font-semibold text-primary">
                Dine-in
              </span>
            </div>

            {/* Row 2 */}
            <p className="text-sm text-[#667085]">
              Item: 1, Addons: 0
            </p>
          </div>
        

       <ModalActionFooter
  leftLabel="Remove"
  rightLabel="Resume"
  onLeftClick={() => {
    // remove hold order
  }}
  onRightClick={() => {
    // resume order
  }}
/>

      </DialogContent>
    </Dialog>
  );
}
