import type { ModifierGroupModifier } from "@/types/modifier-groups";
import type { VariationModifierPriceMatrixCell } from "@/types/menu-items";

export type VariationModifierPriceMatrixVariation = {
  id: string;
  name?: string;
  displayText?: string;
  price?: number | string | null;
};

export type VariationModifierPriceMatrixGroup = {
  id: string;
  name: string;
  modifiers: ModifierGroupModifier[];
};

export type VariationModifierPriceMatrixModifier = {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  priceDelta?: number | string | null;
  category?: {
    id: string;
    name: string;
  } | null;
};

export type VariationPriceOverrideLike = {
  variationId?: string;
  price?: number | string | null;
  pickupPrice?: number | string | null;
  displayText?: string | null;
  modifierPriceOverrides?: Array<{
    modifierId?: string;
    priceDelta?: number | string | null;
  }>;
};

const toFiniteNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return null;

  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : null;
};

export const getVariationLabel = (
  variation: VariationModifierPriceMatrixVariation
) =>
  variation.displayText?.trim() ||
  variation.name?.trim() ||
  `Variation ${variation.id}`;

export const formatDefaultModifierPrice = (
  value: number | string | null | undefined
) => {
  const numeric = toFiniteNumber(value);

  return numeric === null ? "Default 0" : `Default ${numeric}`;
};

export const flattenModifierGroupsForMatrix = (
  groups: VariationModifierPriceMatrixGroup[]
): VariationModifierPriceMatrixModifier[] => {
  const map = new Map<string, VariationModifierPriceMatrixModifier>();

  groups.forEach((group) => {
    group.modifiers.forEach((modifier) => {
      if (!modifier.id || map.has(modifier.id)) return;

      map.set(modifier.id, {
        id: modifier.id,
        name: modifier.name,
        groupId: group.id,
        groupName: group.name,
        priceDelta: modifier.priceDelta,
        category: modifier.category
          ? {
              id: modifier.category.id,
              name: modifier.category.name,
            }
          : null,
      });
    });
  });

  return Array.from(map.values());
};

export const hydrateVariationModifierPriceMatrix = (
  variationPriceOverrides: VariationPriceOverrideLike[]
): VariationModifierPriceMatrixCell[] =>
  variationPriceOverrides.flatMap((variationOverride) => {
    const variationId = variationOverride.variationId;
    if (!variationId) return [];

    return (variationOverride.modifierPriceOverrides ?? []).flatMap(
      (modifierOverride) => {
        const modifierId = modifierOverride.modifierId;
        const priceDelta = toFiniteNumber(modifierOverride.priceDelta);

        if (!modifierId || priceDelta === null) return [];

        return [
          {
            variationId,
            modifierId,
            priceDelta,
          },
        ];
      }
    );
  });

export const pruneVariationModifierPriceMatrix = ({
  cells,
  variationIds,
  modifierIds,
}: {
  cells: VariationModifierPriceMatrixCell[];
  variationIds: string[];
  modifierIds: string[];
}) => {
  const variationIdSet = new Set(variationIds);
  const modifierIdSet = new Set(modifierIds);

  return cells.filter(
    (cell) =>
      variationIdSet.has(cell.variationId) &&
      modifierIdSet.has(cell.modifierId) &&
      cell.priceDelta !== null &&
      cell.priceDelta !== undefined
  );
};

export const upsertVariationModifierPriceCell = ({
  cells,
  variationId,
  modifierId,
  priceDelta,
}: {
  cells: VariationModifierPriceMatrixCell[];
  variationId: string;
  modifierId: string;
  priceDelta: number | null;
}) => {
  const next = cells.filter(
    (cell) =>
      !(
        cell.variationId === variationId && cell.modifierId === modifierId
      )
  );

  if (priceDelta === null) return next;

  return [
    ...next,
    {
      variationId,
      modifierId,
      priceDelta,
    },
  ];
};

export const getVariationModifierPriceCellValue = ({
  cells,
  variationId,
  modifierId,
}: {
  cells: VariationModifierPriceMatrixCell[];
  variationId: string;
  modifierId: string;
}) => {
  const cell = cells.find(
    (entry) =>
      entry.variationId === variationId && entry.modifierId === modifierId
  );

  return cell?.priceDelta ?? null;
};

export const mergeMatrixCellsIntoVariationOverrides = ({
  variationPriceOverrides,
  cells,
}: {
  variationPriceOverrides: VariationPriceOverrideLike[];
  cells: VariationModifierPriceMatrixCell[];
}) => {
  const groupedCells = new Map<string, VariationModifierPriceMatrixCell[]>();

  cells.forEach((cell) => {
    if (cell.priceDelta === null || cell.priceDelta === undefined) return;

    const existing = groupedCells.get(cell.variationId) ?? [];
    groupedCells.set(cell.variationId, [...existing, cell]);
  });

  const knownVariationIds = new Set<string>();
  const merged = variationPriceOverrides
    .filter((entry) => entry.variationId)
    .map((entry) => {
      const variationId = String(entry.variationId);
      knownVariationIds.add(variationId);

      const modifierPriceOverrides = (groupedCells.get(variationId) ?? []).map(
        (cell) => ({
          modifierId: cell.modifierId,
          priceDelta: cell.priceDelta ?? 0,
        })
      );

      return {
        ...entry,
        variationId,
        modifierPriceOverrides,
      };
    });

  groupedCells.forEach((variationCells, variationId) => {
    if (knownVariationIds.has(variationId)) return;

    merged.push({
      variationId,
      modifierPriceOverrides: variationCells.map((cell) => ({
        modifierId: cell.modifierId,
        priceDelta: cell.priceDelta ?? 0,
      })),
    });
  });

  return merged;
};
