"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import StepThree from "./StepThree";
import StepFour from "./stepFour";

import { useAuth } from "@/hooks/useAuth";
import { useCreateMenuItem, useUpdateMenuItem } from "@/hooks/useMenus";

interface CreateMenuItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  onSuccess?: () => void;
}

type EntityType = "variation" | "modifier";

type ModifierPriceOverride = {
  modifierId: string;
  priceDelta: string;
  isRequired?: boolean;
};

type VariationPriceOverride = {
  variationId: string;
  price: string;
  pickupPrice: string;
  displayText: string;
  modifierPriceOverrides: ModifierPriceOverride[];
};

type EntitySnapshot = {
  id: string;
  name: string;
  description?: string;
  price?: string | number;
  priceDelta?: string | number;
  isActive?: boolean;
  sortOrder?: number;
};

const buildSlug = (value: string) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const normalizeArray = (value: any): any[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [];
};

const normalizeTextArray = (value: any): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeIds = (sources: any[], type: EntityType): string[] => {
  const ids = new Set<string>();

  sources.forEach((source) => {
    normalizeArray(source).forEach((entry) => {
      if (entry === null || entry === undefined) return;

      if (typeof entry === "string" || typeof entry === "number") {
        ids.add(String(entry));
        return;
      }

      const modifierId =
        entry?.modifierId || entry?.modifier?.id || entry?.menuModifier?.id;

      const variationId =
        entry?.variationId || entry?.variation?.id || entry?.menuVariation?.id;

      if (type === "variation") {
        /**
         * Important:
         * Never use entry.id as a variation id for modifier override records.
         * Example bad record:
         * {
         *   id: "modifierPriceOverrideId",
         *   modifierId: "...",
         *   priceDelta: "..."
         * }
         */
        if (modifierId && !variationId) return;

        const id =
          variationId ||
          /**
           * Allow real variation objects only.
           * A real variation usually has name/categoryId/sku/description/isActive.
           */
          (entry?.name !== undefined ||
          entry?.categoryId !== undefined ||
          entry?.sku !== undefined ||
          entry?.description !== undefined ||
          entry?.isActive !== undefined
            ? entry?.id
            : undefined);

        if (id) ids.add(String(id));
        return;
      }

      if (type === "modifier") {
        const id =
          modifierId ||
          /**
           * Allow real modifier objects only.
           */
          (entry?.name !== undefined ||
          entry?.priceDelta !== undefined ||
          entry?.restaurantId !== undefined ||
          entry?.isActive !== undefined
            ? entry?.id
            : undefined);

        if (id) ids.add(String(id));
      }
    });
  });

  return Array.from(ids);
};

const hasUsableName = (value: any) => {
  return typeof value === "string" && value.trim().length > 0;
};

const getEntitySnapshot = (
  entry: any,
  type: EntityType
): EntitySnapshot | null => {
  if (!entry) return null;

  const source =
    type === "variation"
      ? entry?.variation || entry?.menuVariation || entry
      : entry?.modifier || entry?.menuModifier || entry;

  const id =
    type === "variation"
      ? entry?.variationId ||
        entry?.variation?.id ||
        entry?.menuVariation?.id ||
        source?.id
      : entry?.modifierId ||
        entry?.modifier?.id ||
        entry?.menuModifier?.id ||
        source?.id;

  const name =
    type === "variation"
      ? source?.name || entry?.displayText || entry?.name
      : source?.name || entry?.name;

  if (!id || !hasUsableName(name)) return null;

  return {
    id: String(id),
    name: String(name),
    description: source?.description,
    price: source?.price ?? entry?.price,
    priceDelta: source?.priceDelta ?? entry?.priceDelta,
    isActive:
      typeof source?.isActive === "boolean"
        ? source.isActive
        : typeof entry?.isActive === "boolean"
        ? entry.isActive
        : undefined,
    sortOrder: source?.sortOrder ?? entry?.sortOrder,
  };
};

const collectEntitySnapshots = (
  sources: any[],
  type: EntityType
): EntitySnapshot[] => {
  const map = new Map<string, EntitySnapshot>();

  sources.forEach((source) => {
    normalizeArray(source).forEach((entry) => {
      const snapshot = getEntitySnapshot(entry, type);

      if (snapshot?.id) {
        const id = String(snapshot.id);
        const generatedFallback =
          type === "variation" ? `Variation ${id}` : `Modifier ${id}`;
        const existing = map.get(id);

        if (!existing || snapshot.name !== generatedFallback) {
          map.set(id, snapshot);
        }
      }

      if (type === "variation" && entry?.variation) {
        const nested = getEntitySnapshot(entry.variation, type);
        if (nested?.id) {
          const id = String(nested.id);
          const existing = map.get(id);
          if (!existing || nested.name !== `Variation ${id}`) {
            map.set(id, nested);
          }
        }
      }

      if (type === "modifier" && entry?.modifier) {
        const nested = getEntitySnapshot(entry.modifier, type);
        if (nested?.id) {
          const id = String(nested.id);
          const existing = map.get(id);
          if (!existing || nested.name !== `Modifier ${id}`) {
            map.set(id, nested);
          }
        }
      }
    });
  });

  return Array.from(map.values());
};

const toNumberOrZero = (value: any) => {
  if (value === "" || value === undefined || value === null) return 0;

  const numeric = Number(value);

  return Number.isNaN(numeric) ? 0 : numeric;
};

const toOptionalNumber = (value: any): number | null => {
  if (value === "" || value === undefined || value === null) return null;

  const numeric = Number(value);

  return Number.isNaN(numeric) ? null : numeric;
};

const normalizeModifierPriceOverrides = (
  raw: any[]
): ModifierPriceOverride[] => {
  return normalizeArray(raw)
    .filter((entry) => {
      const modifierId =
        entry?.modifierId || entry?.modifier?.id || entry?.menuModifier?.id;

      const variationId =
        entry?.variationId || entry?.variation?.id || entry?.menuVariation?.id;

      return modifierId && !variationId;
    })
    .map((entry) => ({
      modifierId: String(
        entry?.modifierId || entry?.modifier?.id || entry?.menuModifier?.id
      ),
      isRequired: entry?.isRequired === true,
      priceDelta:
        entry?.priceDelta !== undefined && entry?.priceDelta !== null
          ? String(entry.priceDelta)
          : "0",
    }));
};

const normalizeNestedModifierPriceOverrides = (
  raw: any[]
): ModifierPriceOverride[] => {
  return normalizeArray(raw)
    .filter((entry) => {
      const modifierId =
        entry?.modifierId || entry?.modifier?.id || entry?.menuModifier?.id;

      return modifierId;
    })
    .map((entry) => ({
      modifierId: String(
        entry?.modifierId || entry?.modifier?.id || entry?.menuModifier?.id
      ),
      priceDelta:
        entry?.priceDelta !== undefined && entry?.priceDelta !== null
          ? String(entry.priceDelta)
          : "0",
    }));
};

const normalizeFlatVariationModifierOverrides = (
  raw: any[]
): Array<ModifierPriceOverride & { variationId: string }> => {
  return normalizeArray(raw)
    .filter((entry) => {
      const modifierId =
        entry?.modifierId || entry?.modifier?.id || entry?.menuModifier?.id;

      const variationId =
        entry?.variationId || entry?.variation?.id || entry?.menuVariation?.id;

      return modifierId && variationId;
    })
    .map((entry) => ({
      modifierId: String(
        entry?.modifierId || entry?.modifier?.id || entry?.menuModifier?.id
      ),
      variationId: String(
        entry?.variationId || entry?.variation?.id || entry?.menuVariation?.id
      ),
      priceDelta:
        entry?.priceDelta !== undefined && entry?.priceDelta !== null
          ? String(entry.priceDelta)
          : entry?.price !== undefined && entry?.price !== null
          ? String(entry.price)
          : "0",
    }));
};

const mergeModifierOverrides = (
  fallback: ModifierPriceOverride[],
  preferred: ModifierPriceOverride[]
) => {
  const map = new Map<string, ModifierPriceOverride>();

  fallback.forEach((entry) => {
    if (!entry?.modifierId) return;
    map.set(String(entry.modifierId), entry);
  });

  preferred.forEach((entry) => {
    if (!entry?.modifierId) return;
    map.set(String(entry.modifierId), entry);
  });

  return Array.from(map.values());
};

const normalizeVariationPriceOverrides = ({
  rawVariationOverrides,
  rawFlatModifierOverrides,
  menuItemId,
}: {
  rawVariationOverrides: any[];
  rawFlatModifierOverrides: any[];
  menuItemId?: string;
}): VariationPriceOverride[] => {
  const map = new Map<string, VariationPriceOverride>();

  const getVariationId = (entry: any) =>
    entry?.variationId ||
    entry?.variation?.id ||
    entry?.menuVariation?.id ||
    entry?.id;

  const getVariationSource = (entry: any) =>
    entry?.variation || entry?.menuVariation || entry;

  const getItemSpecificVariationOverride = (
    entry: any,
    variationId: string
  ) => {
    const variationSource = getVariationSource(entry);

    const candidates = [
      ...normalizeArray(entry?.itemPriceOverrides),
      ...normalizeArray(entry?.variation?.itemPriceOverrides),
      ...normalizeArray(entry?.menuVariation?.itemPriceOverrides),
      ...normalizeArray(variationSource?.itemPriceOverrides),
    ];

    if (!candidates.length) return null;

    const matchingVariation = candidates.filter((override) => {
      const overrideVariationId =
        override?.variationId ||
        override?.variation?.id ||
        override?.menuVariation?.id;

      return String(overrideVariationId || "") === String(variationId);
    });

    if (!matchingVariation.length) return null;

    if (menuItemId) {
      const itemSpecific = matchingVariation.find(
        (override) => String(override?.menuItemId || "") === String(menuItemId)
      );

      if (itemSpecific) return itemSpecific;
    }

    return matchingVariation[0];
  };

  const getNestedModifierOverrides = (entry: any) => {
    const directNested = normalizeNestedModifierPriceOverrides(
      entry?.modifierPriceOverrides
    );

    const variationNested = normalizeNestedModifierPriceOverrides(
      entry?.variation?.modifierPriceOverrides ||
        entry?.menuVariation?.modifierPriceOverrides
    );

    const sourceNested = normalizeNestedModifierPriceOverrides(
      getVariationSource(entry)?.modifierPriceOverrides
    );

    return mergeModifierOverrides(
      mergeModifierOverrides(variationNested, sourceNested),
      directNested
    );
  };

  normalizeArray(rawVariationOverrides).forEach((entry) => {
    const variationId = getVariationId(entry);
    if (!variationId) return;

    const id = String(variationId);
    const existing = map.get(id);
    const variationSource = getVariationSource(entry);
    const itemSpecificOverride = getItemSpecificVariationOverride(entry, id);

    const isVariationOverrideEntry = Boolean(entry?.variationId);

    const price = isVariationOverrideEntry
      ? entry?.price ?? itemSpecificOverride?.price ?? variationSource?.price
      : itemSpecificOverride?.price ?? entry?.price ?? variationSource?.price;

    const pickupPrice = isVariationOverrideEntry
      ? entry?.pickupPrice ??
        itemSpecificOverride?.pickupPrice ??
        variationSource?.pickupPrice
      : itemSpecificOverride?.pickupPrice ??
        entry?.pickupPrice ??
        variationSource?.pickupPrice;

    const displayText = isVariationOverrideEntry
      ? entry?.displayText ??
        itemSpecificOverride?.displayText ??
        variationSource?.displayText
      : itemSpecificOverride?.displayText ??
        entry?.displayText ??
        variationSource?.displayText;

    map.set(id, {
      variationId: id,
      price:
        price !== undefined && price !== null
          ? String(price)
          : existing?.price || "",
      pickupPrice:
        pickupPrice !== undefined && pickupPrice !== null
          ? String(pickupPrice)
          : existing?.pickupPrice || "",
      displayText:
        displayText !== undefined && displayText !== null
          ? String(displayText)
          : existing?.displayText || "",
      modifierPriceOverrides: mergeModifierOverrides(
        existing?.modifierPriceOverrides || [],
        getNestedModifierOverrides(entry)
      ),
    });
  });

  const flatOverrides = normalizeFlatVariationModifierOverrides(
    rawFlatModifierOverrides
  );

  flatOverrides.forEach((entry) => {
    const existing = map.get(String(entry.variationId));

    const fallbackNested = [
      {
        modifierId: entry.modifierId,
        priceDelta: entry.priceDelta,
      },
    ];

    if (!existing) {
      map.set(String(entry.variationId), {
        variationId: String(entry.variationId),
        price: "",
        pickupPrice: "",
        displayText: "",
        modifierPriceOverrides: fallbackNested,
      });

      return;
    }

    map.set(String(entry.variationId), {
      ...existing,
      modifierPriceOverrides: mergeModifierOverrides(
        existing.modifierPriceOverrides,
        fallbackNested
      ),
    });
  });

  return Array.from(map.values());
};

const getRawVariationOverrideSource = (initialData?: any) => {
  const variationLinks = normalizeArray(initialData?.variationLinks).map(
    (link) => link?.variation || link
  );

  return [
    ...variationLinks,
    ...normalizeArray(initialData?.itemVariations),
    ...normalizeArray(initialData?.variations),
    ...normalizeArray(initialData?.variationPriceOverrides),
  ];
};

const getNestedModifierOverridesFromVariations = (variationOverrides: any[]) => {
  return normalizeArray(variationOverrides).flatMap(
    (entry) => entry?.modifierPriceOverrides || []
  );
};

export const getInitialForm = (restaurantId?: string, initialData?: any) => {
  const rawVariationOverrides = getRawVariationOverrideSource(initialData);
  const rawFlatModifierOverrides = normalizeArray(
    initialData?.modifierPriceOverrides
  );

  const normalizedVariationOverrides = normalizeVariationPriceOverrides({
    rawVariationOverrides,
    rawFlatModifierOverrides,
    menuItemId: initialData?.id,
  });

  const nestedModifierOverrides = getNestedModifierOverridesFromVariations(
    normalizedVariationOverrides
  );

  return {
    name: initialData?.name || "",
    categoryId: initialData?.categoryId || initialData?.category?.id || "",
    description: initialData?.description || "",
    ingredients: initialData?.ingredients || "",
    nutritionalInformation: initialData?.nutritionalInformation || "",

    allergenPdfUrl: initialData?.allergenPdfUrl || "",

    imageUrl: initialData?.imageUrl || "",
    imagePreview: initialData?.imageUrl || "",

    slug: initialData?.slug || "",
    sku: initialData?.sku || "",

    sortOrder:
      initialData?.sortOrder !== undefined && initialData?.sortOrder !== null
        ? String(initialData.sortOrder)
        : "0",

    pricingMode: initialData?.pricingMode || "SINGLE",

    basePrice:
      initialData?.basePrice !== undefined && initialData?.basePrice !== null
        ? String(initialData.basePrice)
        : initialData?.price !== undefined && initialData?.price !== null
        ? String(initialData.price)
        : "",

    deliveryPriceAdjustment:
      initialData?.deliveryPriceAdjustment !== undefined &&
      initialData?.deliveryPriceAdjustment !== null
        ? String(initialData.deliveryPriceAdjustment)
        : "",

    takeawayPriceAdjustment:
      initialData?.takeawayPriceAdjustment !== undefined &&
      initialData?.takeawayPriceAdjustment !== null
        ? String(initialData.takeawayPriceAdjustment)
        : "",

    prepTimeMinutes:
      initialData?.prepTimeMinutes !== undefined &&
      initialData?.prepTimeMinutes !== null
        ? String(initialData.prepTimeMinutes)
        : "",

    dietaryFlags: Array.isArray(initialData?.dietaryFlags)
      ? initialData.dietaryFlags.join(", ")
      : initialData?.dietaryFlags || "",

    labels: Array.isArray(initialData?.labels)
      ? initialData.labels.join(", ")
      : initialData?.labels || "",

    allergenFlags: Array.isArray(initialData?.allergenFlags)
      ? initialData.allergenFlags.join(", ")
      : initialData?.allergenFlags || "",

    allergenCodes: Array.isArray(initialData?.allergenCodes)
      ? initialData.allergenCodes.join(", ")
      : initialData?.allergenCodes || "",

    depositAmount:
      initialData?.depositAmount !== undefined &&
      initialData?.depositAmount !== null
        ? String(initialData.depositAmount)
        : "",

    isRequired:
      typeof initialData?.isRequired === "boolean"
        ? initialData.isRequired
        : false,

    minSelect:
      initialData?.minSelect !== undefined && initialData?.minSelect !== null
        ? String(initialData.minSelect)
        : "0",

    maxSelect:
      initialData?.maxSelect !== undefined && initialData?.maxSelect !== null
        ? String(initialData.maxSelect)
        : "",

    minQuantity:
      initialData?.minQuantity !== undefined &&
      initialData?.minQuantity !== null
        ? String(initialData.minQuantity)
        : "1",

    maxQuantity:
      initialData?.maxQuantity !== undefined &&
      initialData?.maxQuantity !== null
        ? String(initialData.maxQuantity)
        : "5",

    variationIds: normalizeIds(
      [
        initialData?.variationIds,
        initialData?.variations,
        initialData?.itemVariations,
        initialData?.variationLinks,
        normalizedVariationOverrides,
      ],
      "variation"
    ),

    modifierIds: normalizeIds(
      [
        initialData?.modifierIds,
        initialData?.modifiers,
        initialData?.itemModifiers,
        initialData?.modifierLinks,
        normalizeModifierPriceOverrides(rawFlatModifierOverrides),
        nestedModifierOverrides,
      ],
      "modifier"
    ),

    selectedVariationOptions: collectEntitySnapshots(
      [
        initialData?.variations,
        initialData?.itemVariations,
        initialData?.variationLinks,
        normalizedVariationOverrides,
      ],
      "variation"
    ),

    selectedModifierOptions: collectEntitySnapshots(
      [
        initialData?.modifiers,
        initialData?.itemModifiers,
        initialData?.modifierLinks,
        normalizeModifierPriceOverrides(rawFlatModifierOverrides),
        nestedModifierOverrides,
      ],
      "modifier"
    ),

    modifierPriceOverrides: normalizeModifierPriceOverrides(
      rawFlatModifierOverrides
    ),

    variationPriceOverrides: normalizedVariationOverrides,

    supportsSplitPizza:
      typeof initialData?.supportsSplitPizza === "boolean"
        ? initialData.supportsSplitPizza
        : false,

    restaurantId: restaurantId || initialData?.restaurantId || "",

    isActive:
      typeof initialData?.isActive === "boolean" ? initialData.isActive : true,
  };
};

type BuildMenuItemPayloadParams = {
  form: Record<string, unknown>;
  restaurantId?: string;
  initialDataId?: string;
};

export const buildMenuItemPayload = ({
  form,
  restaurantId,
  initialDataId,
}: BuildMenuItemPayloadParams) => {
  const generatedSlug =
    typeof form.slug === "string" && form.slug.trim()
      ? form.slug.trim()
      : buildSlug(String(form.name || ""));
  const basePrice = toNumberOrZero(form.basePrice);

  const minSelect = Math.max(0, toNumberOrZero(form.minSelect));
  const maxSelect = toOptionalNumber(form.maxSelect);

  const minQuantity = Math.max(1, toNumberOrZero(form.minQuantity || 1));
  const maxQuantity = Math.max(
    minQuantity,
    toNumberOrZero(form.maxQuantity || minQuantity)
  );

  const selectedVariationIds = normalizeIds(
    [
      form.variationIds,
      form.variations,
      form.itemVariations,
      form.variationLinks,
      form.variationPriceOverrides,
    ],
    "variation"
  );

  const nestedModifierOverrides = getNestedModifierOverridesFromVariations(
    normalizeArray(form.variationPriceOverrides)
  );
  const selectedModifierIds = normalizeIds(
    [
      form.modifierIds,
      form.modifiers,
      form.itemModifiers,
      form.modifierLinks,
      form.modifierPriceOverrides,
      nestedModifierOverrides,
    ],
    "modifier"
  );

  const selectedModifierPriceOverrides = normalizeModifierPriceOverrides(
    normalizeArray(form.modifierPriceOverrides)
  );
  const selectedVariationPriceOverrides = normalizeVariationPriceOverrides({
    rawVariationOverrides: normalizeArray(form.variationPriceOverrides),
    rawFlatModifierOverrides: [],
    menuItemId: initialDataId,
  });

  const modifierPriceOverrideMap = new Map<string, ModifierPriceOverride>();

  selectedModifierPriceOverrides.forEach((item) => {
    modifierPriceOverrideMap.set(String(item.modifierId), item);
  });

  const finalModifierPriceOverrides = selectedModifierIds.map((modifierId) => {
    const existing = modifierPriceOverrideMap.get(String(modifierId));

    return {
      modifierId: String(modifierId),
      priceDelta: toNumberOrZero(existing?.priceDelta),
      isRequired: existing?.isRequired === true,
    };
  });

  const finalModifiers = finalModifierPriceOverrides.map((item) => ({
    modifierId: item.modifierId,
    priceDelta: item.priceDelta,
    isRequired: item.isRequired === true,
  }));

  const topLevelModifierMap = new Map<string, number>();

  finalModifierPriceOverrides.forEach((item) => {
    topLevelModifierMap.set(String(item.modifierId), item.priceDelta);
  });

  const variationOverrideMap = new Map<string, VariationPriceOverride>();

  selectedVariationPriceOverrides.forEach((item) => {
    variationOverrideMap.set(String(item.variationId), item);
  });

  const finalVariationPriceOverrides = selectedVariationIds.map(
    (variationId) => {
      const existing = variationOverrideMap.get(String(variationId));

      return {
        variationId: String(variationId),

        price:
          existing?.price !== undefined &&
          existing?.price !== null &&
          existing.price !== ""
            ? toNumberOrZero(existing.price)
            : basePrice,

        pickupPrice:
          existing?.pickupPrice !== undefined &&
          existing?.pickupPrice !== null &&
          existing.pickupPrice !== ""
            ? toNumberOrZero(existing.pickupPrice)
            : 0,

        displayText: existing?.displayText || "",

        modifierPriceOverrides: selectedModifierIds.map((modifierId) => {
          const nestedExisting = existing?.modifierPriceOverrides?.find(
            (entry) => String(entry.modifierId) === String(modifierId)
          );

          return {
            modifierId: String(modifierId),
            priceDelta:
              nestedExisting?.priceDelta !== undefined &&
              nestedExisting?.priceDelta !== null &&
              nestedExisting.priceDelta !== ""
                ? toNumberOrZero(nestedExisting.priceDelta)
                : topLevelModifierMap.get(String(modifierId)) ?? 0,
          };
        }),
      };
    }
  );

  return {
    restaurantId: restaurantId || form.restaurantId || undefined,
    categoryId: form.categoryId || undefined,

    name: typeof form.name === "string" ? form.name.trim() : "",
    slug: generatedSlug,
    description: form.description || "",

    ingredients: form.ingredients || "",
    nutritionalInformation: form.nutritionalInformation || "",
    allergenPdfUrl: form.allergenPdfUrl || "",

    imageUrl: form.imageUrl || "",
    sku: form.sku || "",
    sortOrder: toNumberOrZero(form.sortOrder),

    pricingMode: form.pricingMode || "SINGLE",

    basePrice,
    deliveryPriceAdjustment: toNumberOrZero(form.deliveryPriceAdjustment),
    takeawayPriceAdjustment: toNumberOrZero(form.takeawayPriceAdjustment),
    prepTimeMinutes: toNumberOrZero(form.prepTimeMinutes),

    dietaryFlags: normalizeTextArray(form.dietaryFlags),
    labels: normalizeTextArray(form.labels),
    allergenFlags: normalizeTextArray(form.allergenFlags),
    allergenCodes: normalizeTextArray(form.allergenCodes),

    depositAmount: toNumberOrZero(form.depositAmount),

    isActive: typeof form.isActive === "boolean" ? form.isActive : true,

    isRequired:
      typeof form.isRequired === "boolean" ? form.isRequired : false,

    minSelect,
    maxSelect,

    minQuantity,
    maxQuantity,

    supportsSplitPizza:
      typeof form.supportsSplitPizza === "boolean"
        ? form.supportsSplitPizza
        : false,

    modifiers: finalModifiers,
    modifierPriceOverrides: finalModifierPriceOverrides,
    variationPriceOverrides: finalVariationPriceOverrides,
  };
};

export default function CreateMenuItemModal({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: CreateMenuItemModalProps) {
  const { token, restaurantId: authRestaurantId } = useAuth();
  const restaurantId = authRestaurantId ?? undefined;

  const isEditMode = Boolean(initialData?.id);
  const stepRef = useRef<any>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<any>(
    getInitialForm(restaurantId, initialData)
  );

  const { mutate: createMenuItem, isPending: isCreating } =
    useCreateMenuItem();

  const { mutate: updateMenuItem, isPending: isUpdating } =
    useUpdateMenuItem();

  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;

    setCurrentStep(1);
    setForm(getInitialForm(restaurantId, initialData));
  }, [open, restaurantId, initialData]);

  const buildPayload = () =>
    buildMenuItemPayload({
      form,
      restaurantId,
      initialDataId: initialData?.id,
    });

  const nextStep = () => {
    if (stepRef.current?.validateStep) {
      const valid = stepRef.current.validateStep();

      if (!valid) return;
    }

    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const resetAndClose = () => {
    setForm(getInitialForm(restaurantId, initialData));
    setCurrentStep(1);
  };

  const closeOnly = () => {
    setForm(getInitialForm(restaurantId));
    setCurrentStep(1);
    onOpenChange(false);
  };

  const validateBeforeSubmit = () => {
    if (stepRef.current?.validateStep) {
      const valid = stepRef.current.validateStep();

      if (!valid) return false;
    }

    if (!form.name?.trim() || !form.categoryId) {
      toast.error("Name and Category are required");
      return false;
    }

    if (!restaurantId && !isEditMode) {
      toast.error("Restaurant id is missing");
      return false;
    }

    const minSelect = Math.max(0, toNumberOrZero(form.minSelect));
    const maxSelect = toOptionalNumber(form.maxSelect);

    if (maxSelect !== null && maxSelect < minSelect) {
      toast.error("Maximum selection cannot be less than minimum selection");
      return false;
    }

    if (form.isRequired && minSelect < 1) {
      toast.error("Required items must have minimum selection of at least 1");
      return false;
    }

    const minQuantity = Math.max(1, toNumberOrZero(form.minQuantity || 1));
    const maxQuantity = Math.max(0, toNumberOrZero(form.maxQuantity || 0));

    if (minQuantity < 1) {
      toast.error("Minimum quantity must be at least 1");
      return false;
    }

    if (maxQuantity < minQuantity) {
      toast.error("Maximum quantity cannot be less than minimum quantity");
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateBeforeSubmit()) return;

    const payload = buildPayload();

    if (isEditMode) {
      const { restaurantId: _restaurantId, ...updatePayload } = payload;

      updateMenuItem(
        {
          id: initialData.id,
          data: updatePayload,
        },
        {
          onSuccess: () => {
            onSuccess?.();
            closeOnly();
          },
          onError: (err: any) => {
            toast.error(
              err?.response?.data?.message || "Failed to update menu item"
            );
          },
        }
      );

      return;
    }

    createMenuItem(payload as any, {
      onSuccess: () => {
        onSuccess?.();
        closeOnly();
      },
      onError: (err: any) => {
        toast.error(
          err?.response?.data?.message || "Failed to create menu item"
        );
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!isSubmitting) {
          onOpenChange(value);
        }
      }}
    >
      <DialogContent className="max-h-[95vh] w-[calc(100vw-24px)] max-w-[920px] overflow-hidden rounded-[24px] bg-[#F5F5F5] p-0">
        <div className="max-h-[95vh] overflow-y-auto overflow-x-hidden p-5 sm:p-8 [scrollbar-width:thin]">
          <DialogHeader>
            <DialogTitle className="text-[24px] font-semibold sm:text-[26px]">
              {isEditMode ? "Edit Item" : "Create Item"}
            </DialogTitle>

            <p className="text-sm text-gray-500">
              Add item details, upload media, configure variations, then assign
              modifier pricing.
            </p>

            <StepProgress currentStep={currentStep} />
          </DialogHeader>

          <div className="mt-6 min-w-0 overflow-hidden rounded-[20px] bg-white p-4 sm:p-6">
            {currentStep === 1 && (
              <StepOne
                ref={stepRef}
                form={form}
                setForm={setForm}
                token={token}
              />
            )}

            {currentStep === 2 && (
              <StepTwo ref={stepRef} form={form} setForm={setForm} />
            )}

            {currentStep === 3 && (
              <StepThree ref={stepRef} form={form} setForm={setForm} />
            )}

            {currentStep === 4 && (
              <StepFour ref={stepRef} form={form} setForm={setForm} />
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              className="h-[44px] rounded-[12px] text-[16px] text-gray-700"
              onClick={resetAndClose}
              disabled={isSubmitting}
            >
              Reset
            </Button>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className="h-[44px] rounded-[12px]"
                >
                  Previous
                </Button>
              )}

              <Button
                className="h-[44px] rounded-[12px] bg-primary px-10 text-white hover:bg-primary/90"
                onClick={currentStep < 4 ? nextStep : handleSubmit}
                disabled={isSubmitting}
              >
                {currentStep < 4
                  ? "Next"
                  : isSubmitting
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                  ? "Update"
                  : "Create"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StepProgress({ currentStep }: { currentStep: number }) {
  const steps = [
    "Basic Details",
    "Media & Extra Info",
    "Variations",
    "Modifiers",
  ];
  const totalSteps = steps.length;

  const activeWidth =
    currentStep === 1 ? 0 : ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="relative mt-6 w-full overflow-hidden">
      <div className="absolute left-0 top-2 z-0 h-[2px] w-full bg-gray-300" />

      <div
        className="absolute left-0 top-2 z-0 h-[2px] bg-primary transition-all duration-300"
        style={{ width: `${activeWidth}%` }}
      />

      <div className="relative z-10 grid grid-cols-4 gap-2">
        {steps.map((label, index) => {
          const step = index + 1;
          const isActive = currentStep >= step;

          return (
            <div
              key={label}
              className="flex min-w-0 flex-col items-center text-center"
            >
              <div
                className={`h-4 w-4 rounded-full transition ${
                  isActive ? "bg-primary" : "bg-gray-300"
                }`}
              />

              <span
                className={`mt-2 max-w-full truncate text-xs font-medium sm:text-sm ${
                  currentStep === step ? "text-primary" : "text-gray-400"
                }`}
                title={label}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
