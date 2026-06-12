"use client";

import { Input } from "@/components/ui/input";
import {
  blockInvalidNumberKeys,
  blockNegativeNumberPaste,
  sanitizeNonNegativeNumber,
} from "@/lib/number-input";
import { Clock3 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { BranchFormData } from "@/components/pages/branches/forms/EditBranchForm/types";

type EditBranchStepThreeProps = {
  data: BranchFormData | null;
  setData: Dispatch<SetStateAction<BranchFormData | null>>;
};

export function EditBranchStepThree({
  data,
  setData,
}: EditBranchStepThreeProps) {
  if (!data) return null;

  const deliveryTime =
    typeof data.settings?.deliveryTime === "string" ||
    typeof data.settings?.deliveryTime === "number"
      ? data.settings.deliveryTime
      : "";

  return (
    <div className="rounded-[14px] bg-white">
      <div className="rounded-[16px] border border-gray-100 bg-white p-[24px] shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
              <Clock3 size={20} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Delivery Time
              </h3>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Set the estimated delivery time customers will see for this branch.
              </p>
            </div>
          </div>

          <div className="flex w-full items-center gap-3 md:w-auto">
            <div className="relative w-full md:w-[180px]">
              <Input
                type="number"
                min={0}
                value={deliveryTime}
                onKeyDown={blockInvalidNumberKeys}
                onPaste={blockNegativeNumberPaste}
                onChange={(event) =>
                  setData({
                    ...data,
                    settings: {
                      ...(data.settings || {}),
                      deliveryTime:
                        event.target.value === ""
                          ? null
                          : Number(sanitizeNonNegativeNumber(event.target.value)),
                    },
                  })
                }
                placeholder="eg. 30"
                className="h-[42px] rounded-[10px] pr-[72px]"
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                min
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
