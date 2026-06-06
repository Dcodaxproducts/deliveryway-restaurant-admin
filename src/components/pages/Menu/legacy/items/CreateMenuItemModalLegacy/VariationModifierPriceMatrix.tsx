"use client";

import { SlidersHorizontal } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  blockInvalidNumberKeys,
  blockNegativeNumberPaste,
} from "@/lib/number-input";
import type { VariationModifierPriceMatrixCell } from "@/types/menu-items";
import {
  flattenModifierGroupsForMatrix,
  formatDefaultModifierPrice,
  getVariationLabel,
  getVariationModifierPriceCellValue,
  upsertVariationModifierPriceCell,
  type VariationModifierPriceMatrixGroup,
  type VariationModifierPriceMatrixVariation,
} from "./variation-modifier-price-utils";

type VariationModifierPriceMatrixProps = {
  variations: VariationModifierPriceMatrixVariation[];
  modifierGroups: VariationModifierPriceMatrixGroup[];
  value: VariationModifierPriceMatrixCell[];
  onChange: (value: VariationModifierPriceMatrixCell[]) => void;
};

const parseCellValue = (value: string) => {
  if (value.trim() === "") return null;

  const numeric = Number(value);

  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
};

export default function VariationModifierPriceMatrix({
  variations,
  modifierGroups,
  value,
  onChange,
}: VariationModifierPriceMatrixProps) {
  const modifiers = flattenModifierGroupsForMatrix(modifierGroups);

  if (variations.length === 0) {
    return (
      <MatrixEmptyState message="Add variations first to customize modifier prices by variation." />
    );
  }

  if (modifiers.length === 0) {
    return (
      <MatrixEmptyState message="Assign modifier groups first to customize modifier prices." />
    );
  }

  return (
    <section className="w-full min-w-0 space-y-5 overflow-hidden">
      <div className="rounded-[18px] border border-primary/10 bg-primary/5 p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary text-white">
            <SlidersHorizontal size={18} />
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900">
              Variation Modifier Prices
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Set custom modifier prices for each variation. Empty cells use
              the default modifier price.
            </p>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Leave empty to use the default modifier price.
      </p>

      <div className="w-full min-w-0 overflow-x-auto rounded-[18px] border border-gray-100 bg-white shadow-sm [scrollbar-width:thin]">
        <table className="min-w-[760px] w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-[#FAFAFA]">
              <th className="sticky left-0 z-10 w-[220px] border-b border-gray-100 bg-[#FAFAFA] p-4 text-sm font-semibold text-gray-900">
                Variation
              </th>
              {modifiers.map((modifier) => (
                <th
                  key={modifier.id}
                  className="min-w-[180px] border-b border-gray-100 p-4 align-top"
                >
                  <span className="block text-sm font-semibold text-gray-900">
                    {modifier.name}
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    {modifier.category?.name || modifier.groupName}
                  </span>
                  <span className="mt-1 block text-xs text-primary">
                    {formatDefaultModifierPrice(modifier.priceDelta)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variations.map((variation) => (
              <tr key={variation.id}>
                <th className="sticky left-0 z-10 border-b border-gray-100 bg-white p-4 align-top text-sm font-semibold text-gray-900">
                  <span className="block max-w-[190px] truncate">
                    {getVariationLabel(variation)}
                  </span>
                  {variation.price !== null && variation.price !== undefined ? (
                    <span className="mt-1 block text-xs font-normal text-gray-500">
                      Base {variation.price}
                    </span>
                  ) : null}
                </th>
                {modifiers.map((modifier) => {
                  const cellValue = getVariationModifierPriceCellValue({
                    cells: value,
                    variationId: variation.id,
                    modifierId: modifier.id,
                  });

                  return (
                    <td
                      key={`${variation.id}-${modifier.id}`}
                      className="border-b border-gray-100 p-4 align-top"
                    >
                      <Input
                        type="number"
                        min={0}
                        inputMode="decimal"
                        value={cellValue ?? ""}
                        placeholder={formatDefaultModifierPrice(
                          modifier.priceDelta
                        )}
                        onKeyDown={blockInvalidNumberKeys}
                        onPaste={blockNegativeNumberPaste}
                        onChange={(event) => {
                          onChange(
                            upsertVariationModifierPriceCell({
                              cells: value,
                              variationId: variation.id,
                              modifierId: modifier.id,
                              priceDelta: parseCellValue(event.target.value),
                            })
                          );
                        }}
                        className="h-[40px] rounded-[12px] border-gray-200 bg-[#FAFAFA] text-sm focus:border-primary focus:ring-primary/15"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MatrixEmptyState({ message }: { message: string }) {
  return (
    <section className="w-full min-w-0 space-y-5 overflow-hidden">
      <div className="rounded-[18px] border border-primary/10 bg-primary/5 p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary text-white">
            <SlidersHorizontal size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900">
              Variation Modifier Prices
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Set custom modifier prices for each variation. Empty cells use
              the default modifier price.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[18px] border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        {message}
      </div>
    </section>
  );
}
