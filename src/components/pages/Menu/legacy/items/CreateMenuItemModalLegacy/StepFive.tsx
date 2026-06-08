"use client";

import type { Dispatch, SetStateAction } from "react";
import { forwardRef, useImperativeHandle, useMemo } from "react";

import VariationModifierPriceMatrix from "./VariationModifierPriceMatrix";
import {
  hydrateVariationModifierPriceMatrix,
  mergeMatrixCellsIntoVariationOverrides,
  pruneVariationModifierPriceMatrix,
  type VariationModifierPriceMatrixGroup,
  type VariationModifierPriceMatrixVariation,
  type VariationPriceOverrideLike,
} from "./variation-modifier-price-utils";
import { useAuth } from "@/hooks/useAuth";
import { useModifierGroups } from "@/hooks/useModifierGroups";
import { normalizeMenuItemModifierGroupAssignments } from "@/lib/modifier-group-assignment-utils";
import type { ModifierGroupModifier } from "@/types/modifier-groups";
import type { VariationModifierPriceMatrixCell } from "@/types/menu-items";

type MenuItemFormRecord = Record<string, unknown>;

type StepFiveProps = {
  form: MenuItemFormRecord;
  setForm: Dispatch<SetStateAction<MenuItemFormRecord>>;
};

type NamedRecord = {
  id?: unknown;
  name?: unknown;
  displayText?: unknown;
  price?: unknown;
  variationId?: unknown;
  variation?: unknown;
  menuVariation?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const getString = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const getVariationFromRecord = (
  entry: NamedRecord
): VariationModifierPriceMatrixVariation | null => {
  const source = isRecord(entry.variation)
    ? entry.variation
    : isRecord(entry.menuVariation)
    ? entry.menuVariation
    : entry;
  const id =
    getString(entry.variationId) ||
    getString(source.id) ||
    getString(entry.id);

  if (!id) return null;

  return {
    id,
    name: getString(source.name) || undefined,
    displayText: getString(entry.displayText) || undefined,
    price:
      typeof entry.price === "number" || typeof entry.price === "string"
        ? entry.price
        : typeof source.price === "number" || typeof source.price === "string"
        ? source.price
        : null,
  };
};

const getVariationPriceOverrides = (
  value: unknown
): VariationPriceOverrideLike[] =>
  normalizeArray(value)
    .filter(isRecord)
    .map((entry) => ({
      ...entry,
      variationId: getString(entry.variationId),
      modifierPriceOverrides: normalizeArray(entry.modifierPriceOverrides)
        .filter(isRecord)
        .map((modifierOverride) => ({
          modifierId: getString(modifierOverride.modifierId),
          priceDelta:
            typeof modifierOverride.priceDelta === "number" ||
            typeof modifierOverride.priceDelta === "string"
              ? modifierOverride.priceDelta
              : null,
        })),
    }));

export const getSelectedVariations = (
  form: MenuItemFormRecord
): VariationModifierPriceMatrixVariation[] => {
  const map = new Map<string, VariationModifierPriceMatrixVariation>();

  const addVariation = (variation: VariationModifierPriceMatrixVariation) => {
    const existing = map.get(variation.id);

    map.set(variation.id, {
      ...variation,
      ...existing,
      name: existing?.name || variation.name,
      displayText: existing?.displayText || variation.displayText,
      price: existing?.price ?? variation.price,
    });
  };

  normalizeArray(form.selectedVariationOptions)
    .filter(isRecord)
    .forEach((entry) => {
      const variation = getVariationFromRecord(entry);
      if (variation) addVariation(variation);
    });

  normalizeArray(form.variationPriceOverrides)
    .filter(isRecord)
    .forEach((entry) => {
      const variation = getVariationFromRecord(entry);
      if (variation) addVariation(variation);
    });

  const selectedVariationIds = normalizeArray(form.variationIds)
    .map(getString)
    .filter(Boolean);

  selectedVariationIds.forEach((variationId) => {
    const existing = map.get(variationId);

    addVariation({
      id: variationId,
      name: existing?.name,
      displayText: existing?.displayText,
      price: existing?.price,
    });
  });

  if (Array.isArray(form.variationIds)) {
    return selectedVariationIds.map((variationId) => ({
      id: variationId,
      ...map.get(variationId),
    }));
  }

  normalizeArray(form.variationIds).forEach((id) => {
    const variationId = getString(id);
    if (!variationId) return;

    addVariation({
      id: variationId,
    });
  });

  return Array.from(map.values());
};

const getAssignedModifierGroups = (
  form: MenuItemFormRecord,
  fetchedGroups: VariationModifierPriceMatrixGroup[]
): VariationModifierPriceMatrixGroup[] => {
  const fetchedGroupMap = new Map(
    fetchedGroups.map((group) => [group.id, group])
  );
  const directGroups = normalizeArray(form.modifierGroups)
    .filter(isRecord)
    .flatMap((group) => {
      const id = getString(group.groupId) || getString(group.id);
      const name = getString(group.name);
      if (!id || !name) return [];

      return [
        {
          id,
          name,
          modifiers: normalizeArray(group.modifiers).filter(
            (modifier): modifier is ModifierGroupModifier =>
              isRecord(modifier) &&
              typeof modifier.id === "string" &&
              typeof modifier.name === "string"
          ),
        },
      ];
    });
  const directGroupMap = new Map(directGroups.map((group) => [group.id, group]));

  return normalizeMenuItemModifierGroupAssignments(
    form.modifierGroupAssignments
  ).flatMap((assignment) => {
    const assignmentGroup = assignment.group;
    const group =
      assignmentGroup?.modifiers?.length
        ? {
            id: assignment.groupId,
            name: assignmentGroup.name || assignment.groupId,
            modifiers: assignmentGroup.modifiers,
          }
        : directGroupMap.get(assignment.groupId) ??
          fetchedGroupMap.get(assignment.groupId);

    return group ? [group] : [];
  });
};

const StepFive = forwardRef(function StepFive(
  { form, setForm }: StepFiveProps,
  ref
) {
  const { restaurantId: authRestaurantId } = useAuth();
  const restaurantId = authRestaurantId ?? undefined;
  const { data: groupsResponse } = useModifierGroups({
    restaurantId,
    page: 1,
    limit: 100,
    all: true,
  });

  const fetchedGroups = useMemo<VariationModifierPriceMatrixGroup[]>(
    () =>
      (groupsResponse?.data ?? []).map((group) => ({
        id: group.id,
        name: group.name,
        modifiers: group.modifiers ?? [],
      })),
    [groupsResponse?.data]
  );

  const variations = useMemo(() => getSelectedVariations(form), [form]);
  const modifierGroups = useMemo(
    () => getAssignedModifierGroups(form, fetchedGroups),
    [form, fetchedGroups]
  );
  const matrixValue = useMemo(
    () =>
      pruneVariationModifierPriceMatrix({
        cells: hydrateVariationModifierPriceMatrix(
          getVariationPriceOverrides(form.variationPriceOverrides)
        ),
        variationIds: variations.map((variation) => variation.id),
        modifierIds: modifierGroups.flatMap((group) =>
          group.modifiers.map((modifier) => modifier.id)
        ),
      }),
    [form.variationPriceOverrides, modifierGroups, variations]
  );

  useImperativeHandle(ref, () => ({
    validateStep: () => true,
  }));

  const handleMatrixChange = (nextValue: VariationModifierPriceMatrixCell[]) => {
    setForm((previous) => {
      const currentVariationOverrides = getVariationPriceOverrides(
        previous.variationPriceOverrides
      );

      return {
        ...previous,
        variationPriceOverrides: mergeMatrixCellsIntoVariationOverrides({
          variationPriceOverrides: currentVariationOverrides,
          cells: nextValue,
        }),
      };
    });
  };

  return (
    <VariationModifierPriceMatrix
      variations={variations}
      modifierGroups={modifierGroups}
      value={matrixValue}
      onChange={handleMatrixChange}
    />
  );
});

export default StepFive;
