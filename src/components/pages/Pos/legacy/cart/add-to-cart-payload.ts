type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toPositiveInteger = (value: unknown, fallback = 1) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;

  return Math.max(1, Math.floor(parsed));
};

const readId = (value: unknown) => {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);

  return "";
};

export type PosAddToCartModifierPayload = {
  modifierId: string;
  quantity: number;
};

export type PosAddToCartModifierSelectionPayload = {
  modifierGroupId: string;
  modifiers: PosAddToCartModifierPayload[];
};

export const buildPosAddToCartModifierSelections = (
  selectedModifiersByGroup: unknown,
): PosAddToCartModifierSelectionPayload[] => {
  if (!isRecord(selectedModifiersByGroup)) return [];

  return Object.entries(selectedModifiersByGroup).flatMap(
    ([modifierGroupId, rawModifiers]) => {
      const normalizedGroupId = readId(modifierGroupId);
      if (!normalizedGroupId || !Array.isArray(rawModifiers)) return [];

      const modifiers = rawModifiers.flatMap((modifier) => {
        if (!isRecord(modifier)) return [];

        const modifierId = readId(modifier.id ?? modifier.modifierId);
        if (!modifierId) return [];

        return [
          {
            modifierId,
            quantity: toPositiveInteger(
              modifier.selectedQuantity ?? modifier.quantity,
            ),
          },
        ];
      });

      return modifiers.length
        ? [{ modifierGroupId: normalizedGroupId, modifiers }]
        : [];
    },
  );
};

export const flattenPosAddToCartModifierSelections = (
  modifierSelections: PosAddToCartModifierSelectionPayload[],
): PosAddToCartModifierPayload[] =>
  modifierSelections.flatMap((selection) => selection.modifiers);
