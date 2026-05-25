"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  PauseCircle,
  Utensils,
  Bike,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpdateBranchTemporaryClosure } from "@/hooks/useBranches";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  branchName?: string;
};

type DurationOption = {
  key: "20min" | "60min" | "tomorrow" | "custom";
  label: string;
  minutes?: number;
};

type ReasonOption = {
  key: "busy" | "couriers" | "other";
  label: string;
  reason: string;
  message: string;
  icon: React.ReactNode;
};

const durationOptions: DurationOption[] = [
  { key: "20min", label: "20 min", minutes: 20 },
  { key: "60min", label: "60 min", minutes: 60 },
  { key: "tomorrow", label: "Until Tomorrow" },
  { key: "custom", label: "Custom" },
];

const reasonOptions: ReasonOption[] = [
  {
    key: "busy",
    label: "Busy kitchen",
    reason: "Busy kitchen",
    message:
      "Branch is temporarily closed due to a busy kitchen. Please try again later.",
    icon: <Utensils size={16} />,
  },
  {
    key: "couriers",
    label: "No couriers",
    reason: "No couriers",
    message:
      "Branch is temporarily closed because no couriers are currently available.",
    icon: <Bike size={16} />,
  },
  {
    key: "other",
    label: "Other",
    reason: "Temporary closure",
    message: "Branch is temporarily closed. Please try again later.",
    icon: <MoreHorizontal size={16} />,
  },
];

export default function TemporaryBranchClosureModal({
  open,
  onOpenChange,
  branchId,
  branchName,
}: Props) {
  const [durationKey, setDurationKey] =
    useState<DurationOption["key"]>("20min");
  const [reasonKey, setReasonKey] = useState<ReasonOption["key"]>("busy");
  const [customHours, setCustomHours] = useState("2");
  const [customMinutes, setCustomMinutes] = useState("0");
  const [mode, setMode] = useState<"main" | "custom">("main");

  const mutation = useUpdateBranchTemporaryClosure();

  const selectedReason = useMemo(
    () =>
      reasonOptions.find((item) => item.key === reasonKey) ?? reasonOptions[0],
    [reasonKey]
  );

  const reloadAfterSuccess = () => {
    onOpenChange(false);
    setMode("main");
    window.location.reload();
  };

  const getClosedUntil = () => {
    const now = new Date();

    if (durationKey === "tomorrow") {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      return tomorrow;
    }

    if (durationKey === "custom") {
      const totalMinutes =
        Number(customHours || 0) * 60 + Number(customMinutes || 0);

      const customDate = new Date(now);
      customDate.setMinutes(customDate.getMinutes() + Math.max(totalMinutes, 1));
      return customDate;
    }

    const selectedDuration = durationOptions.find(
      (item) => item.key === durationKey
    );

    const date = new Date(now);
    date.setMinutes(date.getMinutes() + (selectedDuration?.minutes ?? 20));
    return date;
  };

  const durationText = useMemo(() => {
    if (durationKey === "20min") return "20 minutes";
    if (durationKey === "60min") return "60 minutes";
    if (durationKey === "tomorrow") return "until tomorrow";

    const hours = Number(customHours || 0);
    const minutes = Number(customMinutes || 0);

    const parts: string[] = [];

    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
    if (minutes > 0) {
      parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
    }

    return parts.length ? parts.join(" and ") : "1 minute";
  }, [durationKey, customHours, customMinutes]);

  const handlePause = async () => {
    await mutation.mutateAsync({
      id: branchId,
      payload: {
        isClosed: true,
        closedUntil: getClosedUntil().toISOString(),
        reason: selectedReason.reason,
        message: selectedReason.message,
      },
    });

    reloadAfterSuccess();
  };

  const handleDurationClick = (key: DurationOption["key"]) => {
    setDurationKey(key);

    if (key === "custom") {
      setMode("custom");
    }
  };

  const isLoading = mutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) setMode("main");
      }}
    >
      <DialogContent className="max-w-[520px] max-h-[92vh] overflow-y-auto rounded-[28px] border-0 bg-white p-0">
        {mode === "main" ? (
          <div className="p-5 sm:p-7">
            <DialogHeader>
              <DialogTitle className="text-[24px] font-bold text-gray-950">
                Pause Operations
              </DialogTitle>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Temporarily stop receiving new orders for{" "}
                <span className="font-semibold text-gray-800">
                  {branchName || "this branch"}
                </span>
                . Existing orders will still need to be fulfilled.
              </p>
            </DialogHeader>

            <div className="mt-6 rounded-[20px] bg-gray-50 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-950">
                    Pause duration
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Choose how long this branch should stay unavailable.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {durationOptions.map((item) => {
                  const active = durationKey === item.key;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleDurationClick(item.key)}
                      disabled={isLoading}
                      className={cn(
                        "h-[82px] rounded-[16px] border bg-white transition hover:border-primary/40",
                        "flex flex-col items-center justify-center gap-2",
                        active
                          ? "border-primary shadow-sm"
                          : "border-transparent"
                      )}
                    >
                      <Clock3
                        size={19}
                        className={active ? "text-primary" : "text-gray-400"}
                      />

                      <span className="text-sm font-semibold text-gray-950">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 rounded-[20px] bg-gray-50 p-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-950">
                  Closure reason
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  This reason helps explain why new orders are paused.
                </p>
              </div>

              <div className="space-y-3">
                {reasonOptions.map((item) => {
                  const active = reasonKey === item.key;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setReasonKey(item.key)}
                      disabled={isLoading}
                      className={cn(
                        "flex min-h-[52px] w-full items-center justify-between rounded-[14px] border bg-white px-4 transition hover:border-primary/40",
                        active
                          ? "border-primary"
                          : "border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex size-4 items-center justify-center rounded-full border",
                            active ? "border-primary" : "border-gray-300"
                          )}
                        >
                          {active && (
                            <span className="size-2 rounded-full bg-primary" />
                          )}
                        </span>

                        <span className="text-sm font-semibold text-gray-900">
                          {item.label}
                        </span>
                      </div>

                      <span
                        className={active ? "text-primary" : "text-gray-300"}
                      >
                        {item.icon}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => onOpenChange(false)}
                className="h-[48px] flex-1 rounded-full border-primary text-primary hover:bg-primary/5"
              >
                Cancel & Keep Live
              </Button>

              <Button
                type="button"
                disabled={isLoading}
                onClick={handlePause}
                className="h-[48px] flex-1 rounded-full bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <PauseCircle size={17} />
                    Confirm & Pause Branch
                  </>
                )}
              </Button>
            </div>

       
          </div>
        ) : (
          <div className="p-5 sm:p-7">
            <DialogHeader>
              <DialogTitle className="text-[24px] font-bold text-gray-950">
                Set Custom Pause Time
              </DialogTitle>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Specify exactly how long you need to pause branch operations.
              </p>
            </DialogHeader>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-950">
                  Hours
                </label>

                <select
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  disabled={isLoading}
                  className="mt-2 h-[52px] w-full rounded-full bg-gray-100 px-5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {Array.from({ length: 25 }).map((_, index) => (
                    <option key={index} value={String(index)}>
                      {String(index).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-950">
                  Minutes
                </label>

                <select
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  disabled={isLoading}
                  className="mt-2 h-[52px] w-full rounded-full bg-gray-100 px-5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {[0, 5, 10, 15, 20, 30, 45].map((minute) => (
                    <option key={minute} value={String(minute)}>
                      {String(minute).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3 rounded-[16px] border-l-4 border-primary bg-gray-50 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white">
                <Clock3 size={17} className="text-primary" />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Your branch will be closed for{" "}
                  <span className="text-primary">{durationText}</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Orders will resume automatically after the selected time.
                </p>
              </div>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                disabled={isLoading}
                onClick={() => {
                  setMode("main");
                  setDurationKey("20min");
                }}
                className="h-[48px] flex-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <ArrowLeft size={17} />
                Back
              </Button>

              <Button
                type="button"
                disabled={isLoading}
                onClick={handlePause}
                className="h-[48px] flex-1 rounded-full bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Confirm & Set Time
                    <CheckCircle2 size={17} />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}