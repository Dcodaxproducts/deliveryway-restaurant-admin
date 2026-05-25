"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

import FormInput from "../register/form/FormInput";
import FormSelect from "../register/form/FormSelect";
import { Radio } from "../ui/radioBtn";
import { Separator } from "../ui/separator";
import PosModalHeader from "../pos/PosModalHeader";
import ModalActionFooter from "../pos/PosModalActionFooter";
import AsyncSelect from "../ui/AsyncSelect";

import { useAuthContext } from "@/components/providers/auth-provider";
import { useHttpClient } from "@/hooks/useHttpClient";
import { toast } from "sonner";
import { useGetBranches } from "@/hooks/useBranches";

export default function MakeReservationModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { user, token } = useAuthContext();
  const { get, post, loading } = useHttpClient(token);

  const restaurantId = user?.restaurantId ?? undefined;

  const [tableType, setTableType] = useState<"full" | "specific">("specific");

  const [reservationDate, setReservationDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [note, setNote] = useState("");

  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // ================= FETCH BRANCHES =================
  const { data: branchesData } = useGetBranches({
    restaurantId,
  });

  const fetchBranches = async ({ search }: any) => {
    if (!restaurantId) return { data: [] };

    const list = branchesData?.data || [];

    return {
      data: list.filter((b: any) =>
        b?.name?.toLowerCase().includes(search.toLowerCase())
      ),
    };
  };

const fetchCustomers = async ({ search, page }: any) => {
  if (!restaurantId) return { data: [], meta: {} };

  let url = `/v1/admin/users/customers?restaurantId=${restaurantId}&page=${page}`;

  if (search) url += `&search=${search}`;

  const res = await get(url);

  const raw =
    res?.data?.data || res?.data || [];

  const normalized = raw.map((u: any) => ({
    ...u,
    firstName: u?.profile?.firstName || "No Name",
    lastName: u?.profile?.lastName || "",
    fullName: `${u?.profile?.firstName || ""} ${u?.profile?.lastName || ""}`,
  }));

  return {
    data: normalized,
    meta: res?.data?.meta || res?.meta,
  };
};

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    try {
      if (!selectedBranch || !selectedCustomer) {
        toast.error("Please select branch and customer");
        return;
      }

      if (!reservationDate || !startTime || !guestCount) {
        toast.error("Please fill all required fields");
        return;
      }

      const isoDate = new Date(
        `${reservationDate}T${startTime}`
      ).toISOString();

      const payload = {
        branchId: selectedBranch?.id,
        reservationDate: isoDate,
        guestCount: Number(guestCount),
        note: note || "",
      };

      const res = await post(
        `/v1/customer-app/table-reservations?customerId=${selectedCustomer?.id}`,
        payload
      );

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Reservation created successfully");

      onOpenChange(false);
      router.push("/orders?tab=reservation");
    } catch (err) {
      void err;
      toast.error("Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent
        className="w-full sm:max-w-[618px] rounded-[28px] px-10 py-8 bg-white max-h-[95vh] overflow-auto text-black"
        onClick={(e) => e.stopPropagation()}
      >
        <PosModalHeader
          title="Make Reservation"
          description="Create a new Reservation by filling necessary info from here"
        />

        {/* ================= RESERVATION INFO ================= */}
        <Collapsible defaultOpen className="mt-6">
          <CollapsibleTrigger className="flex items-center justify-between w-full text-[16px] text-[#909090]">
            Reservation Information
            <ChevronDown />
          </CollapsibleTrigger>

          <Separator className="my-3" />

          <CollapsibleContent className="mt-4 space-y-4 px-1">
            <Input
              type="date"
              value={reservationDate}
              onChange={(e) => setReservationDate(e.target.value)}
            />

            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />

            <FormInput
              label="No. of Person *"
              value={guestCount}
              onChange={(val) => setGuestCount(val)}
            />

            {/* BRANCH */}
            <AsyncSelect
              value={selectedBranch}
              onChange={setSelectedBranch}
              fetchOptions={fetchBranches}
              labelKey="name"
              valueKey="id"
              placeholder="Select branch"
            />

            {/* TABLE TYPE */}
            <div className="flex gap-6">
              <div onClick={() => setTableType("full")}>
                <Radio label="Full Floor" active={tableType === "full"} />
              </div>
              <div onClick={() => setTableType("specific")}>
                <Radio label="Specific Table" active={tableType === "specific"} />
              </div>
            </div>

            <FormSelect
              placeholder="Select Table"
              options={["Table 1", "Table 2", "Table 3"]}
            />

            <FormInput
              label="Note"
              value={note}
              onChange={(val) => setNote(val)}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* ================= CUSTOMER ================= */}
        <div className="mt-6">
          <label className="block mb-2 text-[16px] text-black">
            Customer<span className="text-red-500">*</span>
          </label>

        <AsyncSelect
  value={selectedCustomer}
  onChange={setSelectedCustomer}
  fetchOptions={fetchCustomers}
  labelKey="fullName"
  valueKey="id"
  placeholder="Select customer"
/>
        </div>

        {/* ACTION */}
        <div className="mt-6" onClick={(e) => e.stopPropagation()}>
          <ModalActionFooter
            leftLabel="Cancel"
            rightLabel={loading ? "Creating..." : "Create"}
            onLeftClick={() => onOpenChange(false)}
            onRightClick={handleSubmit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}