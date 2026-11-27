"use client";


import { LocalizedText } from "@/components/common/LocalizedText";
import { getLocalizedMessage } from "@/lib/localized-message";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import BorderedSearchBar from "@/components/common/BorderedSearchBar";
import PosModalHeader from "@/components/pages/Pos/components/pos/PosModalHeader";

const FILTER_TABS = [
  "All",
  "Confirm",
  "Cooking",
  "Ready",
  "Ready to Handover",
  "Ready to Pickup",
  "Eating",
];

const ORDER_STATUSES = [
  "Confirmed",
  "Cooking",
  "Ready",
  "Ready to Handover",
  "Ready to Pickup",
  "Eating",
];

export default function OngoingOrdersModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("Confirmed");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
     <DialogContent className="w-full sm:max-w-[630px] rounded-[28px] px-10 py-8 bg-[#F5F5F5]">

       <PosModalHeader
              title={getLocalizedMessage("message254")}
              description="Track your ongoing orders from here"
            />
       
        <div className="mt-6">
          <BorderedSearchBar
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={getLocalizedMessage("message332")}
          />
        </div>

<div className="flex flex-col bg-white mt-6 rounded-2xl border p-6 gap-6">
          
          <div className="flex flex-wrap gap-3">
            {FILTER_TABS.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    h-[36px] px-4 rounded-full text-sm font-medium
                    transition-all
                    ${
                      active
                        ? "bg-primary text-white"
                        : "bg-white border border-gray-200 text-[#667085]"
                    }
                  `}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        

        <div className=" border border-gray-300 rounded-2xl p-5 space-y-4">
          {/* Row 1 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-[16px] font-medium text-[#101828]">
                <LocalizedText messageKey="message262" />{" "}
                <span className="font-semibold">#131220251001</span>
              </p>

              <Badge className="bg-[#00A63E0F] text-[#00A63E] rounded-full px-3 py-1">
                <LocalizedText messageKey="message269" />
              </Badge>
            </div>

            <span className="text-sm font-semibold text-primary">
              <LocalizedText messageKey="message105" />
            </span>
          </div>

          {/* Row 2 */}
          <p className="text-sm text-[#667085]">
            <LocalizedText messageKey="message158" />
          </p>

          {/* Row 3 (TABLE-LIKE BAR) */}
          <div className="flex items-center gap-4 border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#667085]">
            <span><LocalizedText messageKey="message004" /></span>
            <span className="text-gray-300">|</span>
            <span><LocalizedText messageKey="message386" /></span>
            <span className="text-gray-300">|</span>
            <span><LocalizedText messageKey="message081" /></span>

            {/* Status Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-auto flex items-center gap-2 text-[#12B76A] font-medium">
                  {orderStatus}
                  <ChevronDown size={16} />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-[200px]">
                {ORDER_STATUSES.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => setOrderStatus(status)}
                    className={
                      status === orderStatus
                        ? "text-[#00A63E] font-medium"
                        : ""
                    }
                  >
                    {status}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
</div>
      </DialogContent>
    </Dialog>
  );
}
