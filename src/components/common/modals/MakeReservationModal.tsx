"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Time24Picker } from "@/components/ui/time-24-picker";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

import FormInput from "@/components/forms/common/FormInput";
import FormSelect from "@/components/forms/common/FormSelect";
import { Radio } from "@/components/ui/radioBtn";
import { Separator } from "@/components/ui/separator";
import PosModalHeader from "@/components/pages/Pos/components/pos/PosModalHeader";
import ModalActionFooter from "@/components/pages/Pos/components/pos/PosModalActionFooter";
import AsyncSelect from "@/components/ui/AsyncSelect";

import { useAuthContext } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import { useGetBranches } from "@/hooks/useBranches";
import { useGetCustomersList } from "@/hooks/useCustomers";
import { useCreateTableReservation } from "@/hooks/useReservations";
import { getLocalTodayInputValue } from "@/lib/date-input";

export default function MakeReservationModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { user } = useAuthContext();
  const createReservationMutation = useCreateTableReservation();
  const loading = createReservationMutation.isPending;
  const todayDate = useMemo(() => getLocalTodayInputValue(), []);

  const restaurantId = user?.restaurantId ?? undefined;

  const [tableType, setTableType] = useState<"full" | "specific">("specific");

  const [reservationDate, setReservationDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [note, setNote] = useState("");

  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const { data: branchesData } = useGetBranches({
    restaurantId,
  });


  const customerQuery = useGetCustomersList({
    restaurantId,
    page: 1,
  });

  const fetchBranches = async ({ search }: any) => {
    if (!restaurantId) return { data: [] };

    const list = branchesData?.data ?? [];
    const query = String(search ?? "").toLowerCase();

    return {
      data: list.filter((branch: any) =>
        branch?.name?.toLowerCase().includes(query)
      ),
    };
  };

  const fetchCustomers = async ({ search }: any) => {
    if (!restaurantId) return { data: [], meta: {} };

    const res = await customerQuery.refetch({ throwOnError: false });
    const raw = res.data?.data?.data ?? res.data?.data ?? [];
    const query = String(search ?? "").toLowerCase();

    const normalized = raw
      .map((customer: any) => {
        const firstName = customer?.profile?.firstName ?? "No Name";
        const lastName = customer?.profile?.lastName ?? "";

        return {
          ...customer,
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`,
        };
      })
      .filter((customer: any) => customer.fullName.toLowerCase().includes(query));

    return {
      data: normalized,
      meta: res.data?.data?.meta ?? res.data?.meta,
    };
  };

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

      const res = await createReservationMutation.mutateAsync({
        customerId: selectedCustomer?.id,
        payload,
      });

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

        <Collapsible defaultOpen className="mt-6">
          <CollapsibleTrigger className="flex items-center justify-between w-full text-[16px] text-[#909090]">
            Reservation Information
            <ChevronDown />
          </CollapsibleTrigger>

          <Separator className="my-3" />

          <CollapsibleContent className="mt-4 space-y-4 px-1">
            <Input
              type="date"
              min={todayDate}
              value={reservationDate}
              onChange={(e) => setReservationDate(e.target.value)}
            />

            <Time24Picker
              value={startTime}
              onChange={setStartTime}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
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
