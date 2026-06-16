"use client";

import { Input } from "@/components/ui/input";
import {
  blockInvalidNumberKeys,
  blockNegativeNumberPaste,
  sanitizeNonNegativeNumber,
} from "@/lib/number-input";
import { Clock3 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type {
  BranchFormData,
  BranchSettings,
} from "@/components/pages/branches/forms/EditBranchForm/types";

type EditBranchStepThreeProps = {
  data: BranchFormData | null;
  setData: Dispatch<SetStateAction<BranchFormData | null>>;
  loadingDeliveryTime?: boolean;
};

export function EditBranchStepThree({
  data,
  setData,
  loadingDeliveryTime = false,
}: EditBranchStepThreeProps) {
  if (!data) return null;

  const timingFields = [
    {
      key: "deliveryTime",
      label: "Delivery time",
      description: "Estimated customer delivery time.",
      placeholder: "eg. 45",
    },
    {
      key: "deliveryIntervalMinutes",
      label: "Delivery interval",
      description: "Customer delivery slot interval.",
      placeholder: "eg. 15",
    },
    {
      key: "pickupIntervalMinutes",
      label: "Pickup interval",
      description: "Customer pickup slot interval.",
      placeholder: "eg. 10",
    },
  ] satisfies {
    key: keyof Pick<
      BranchSettings,
      "deliveryTime" | "deliveryIntervalMinutes" | "pickupIntervalMinutes"
    >;
    label: string;
    description: string;
    placeholder: string;
  }[];

  const getTimingValue = (key: (typeof timingFields)[number]["key"]) => {
    const value = data.settings?.[key];

    return typeof value === "string" || typeof value === "number" ? value : "";
  };

  const updateTimingValue = (
    key: (typeof timingFields)[number]["key"],
    value: string
  ) => {
    setData({
      ...data,
      settings: {
        ...(data.settings || {}),
        [key]:
          value === ""
            ? null
            : Number(sanitizeNonNegativeNumber(value)),
      },
    });
  };

  return (
    <div className="rounded-[14px] bg-white">
      <div className="rounded-[16px] border border-gray-100 bg-white p-[24px] shadow-sm">
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
              <Clock3 size={20} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Delivery Time
              </h3>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Set the estimated delivery time and customer slot intervals for this branch.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {timingFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <div>
                  <label
                    htmlFor={`branch-${field.key}`}
                    className="text-sm font-medium text-gray-800"
                  >
                    {field.label}
                  </label>
                  <p className="mt-1 text-xs text-gray-500">{field.description}</p>
                </div>

                <div className="relative">
                  <Input
                    id={`branch-${field.key}`}
                    type="number"
                    min={0}
                    value={getTimingValue(field.key)}
                    disabled={loadingDeliveryTime}
                    onKeyDown={blockInvalidNumberKeys}
                    onPaste={blockNegativeNumberPaste}
                    onChange={(event) =>
                      updateTimingValue(
                        field.key,
                        sanitizeNonNegativeNumber(event.target.value)
                      )
                    }
                    placeholder={field.placeholder}
                    className="h-[42px] rounded-[10px] pr-[72px]"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                    min
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
