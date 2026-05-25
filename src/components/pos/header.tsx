"use client";

import { Button } from "@/components/ui/button";
import Header from "../header";
import { useRouter } from "next/navigation";
import { useState } from "react";
import OngoingOrdersModal from "../modals/OngoingOrdersModal";
import HoldOrdersModal from "../modals/HoldOrdersModal";
import MakeReservationModal from "../modals/MakeReservationModal";

interface HeaderProps {
  title: string;
  description?: string;
}

export default function PosHeader({ title, description }: HeaderProps) {
  const router = useRouter();
const [openOngoingOrders, setOpenOngoingOrders] = useState(false);
const [openHoldOrders, setOpenHoldOrders] = useState(false);
const [openMakeReservation, setOpenMakeReservation] = useState(false);


  return (
    <div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:items-center lg:justify-between w-full">
      {/* LEFT SIDE (already correct) */}
      <Header title={title} description={description} />

      {/* RIGHT SIDE (matched with design) */}
       <div className="flex flex-wrap gap-3 sm:gap-4 justify-start">
       {/* Ongoing Orders */}
          {/* <div className="relative">
        <Button
            variant="outline"
          className="h-[38px] sm:h-[44px] rounded-[12px] px-3 sm:px-4 flex items-center gap-2 text-[#767676] border-[#E6E7EC] text-[13px] sm:text-[15px] font-[500]"
             onClick={() => setOpenOngoingOrders(true)}
          >
            Ongoing Orders
          </Button>
          <span className="absolute -top-2 -right-2 size-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
            1
          </span>
        </div>

        <div className="relative">
          <Button
            variant="outline"
          className="h-[38px] sm:h-[44px] rounded-[12px] px-3 sm:px-4 flex items-center gap-2 text-[#767676] border-[#E6E7EC] text-[13px] sm:text-[15px] font-[500]"
            onClick={() => setOpenHoldOrders(true)}
          >
            Hold Orders
          </Button>
          <span className="absolute -top-2 -right-2 size-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
            1
          </span>
        </div> */}

        {/* Make Reservation */}
        <Button
           className="h-[38px] sm:h-[44px] rounded-[12px] px-4 sm:px-5 flex items-center gap-2 bg-primary hover:bg-red-700 text-white text-[13px] sm:text-[15px] font-[500]"
        onClick={() => setOpenMakeReservation(true)}
        >
          Make Reservation
        </Button>
      </div>

      <OngoingOrdersModal
  open={openOngoingOrders}
  onOpenChange={setOpenOngoingOrders}
/>
<HoldOrdersModal
  open={openHoldOrders}
  onOpenChange={setOpenHoldOrders}
/>
<MakeReservationModal
  open={openMakeReservation}
  onOpenChange={setOpenMakeReservation}
/>


    </div>
  );
}
