"use client";

import type { Dispatch, ReactNode, SetStateAction, UIEvent } from "react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Check, Loader2, Search, Sparkles, Tags, X } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ModifierGroupAssignmentForm } from "@/components/pages/Menu/components/ModifierGroupAssignmentForm";
import { useAuth } from "@/hooks/useAuth";
import { useGetModifiers } from "@/hooks/useMenus";
import { normalizeMenuItemModifierGroupAssignments } from "@/lib/modifier-group-assignment-utils";
import {
  blockInvalidNumberKeys,
  blockNegativeNumberPaste,
  sanitizeNonNegativeNumber,
} from "@/lib/number-input";
import { useTranslations } from "next-intl";

type StepFourProps = {
  form: any;
  setForm: Dispatch<SetStateAction<any>>;
};

type SelectableEntity = {
  id: string;
  name: string;
  description?: string;
  price?: string | number;
  priceDelta?: string | number;
  isActive?: boolean;
  sortOrder?: number;
};

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

type FlatModifierVariationOverride = {
  modifierId: string;
  variationId: string;
  priceDelta: string;
};
import { extractResponseItems } from "@/lib/response";

const PAGE_LIMIT = 20;
const SHOW_LEGACY_DIRECT_MODIFIERS = false;

const normalizeArray = (value: any): any[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [];
};

const normalizeIds = (
  sources: any[],
  type: "variation" | "modifier"
): string[] => {
  const ids = new Set<string>();

  sources.forEach((source) => {
    normalizeArray(source).forEach((entry) => {
      if (entry === null || entry === undefined) return;

      if (typeof entry === "string" || typeof entry === "number") {
        ids.add(String(entry));
        return;
      }

      if (type === "variation") {
        const modifierId = entry?.modifierId || entry?.modifier?.id;
        const variationId = entry?.variationId || entry?.variation?.id;

        if (modifierId && !variationId) return;

        const id =
          variationId ||
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

      const id =
        entry?.modifierId ||
        entry?.modifier?.id ||
        (entry?.name !== undefined ||
        entry?.priceDelta !== undefined ||
        entry?.restaurantId !== undefined ||
        entry?.isActive !== undefined
          ? entry?.id
          : undefined);

      if (id) ids.add(String(id));
    });
  });

  return Array.from(ids);
};


const getPaginationHasMore = ({
  response,
  page,
  limit,
  receivedCount,
}: {
  response: any;
  page: number;
  limit: number;
  receivedCount: number;
}) => {
  const source =
    response?.data?.pagination ||
    response?.data?.meta ||
    response?.pagination ||
    response?.meta ||
    {};

  if (typeof source?.hasNext === "boolean") return source.hasNext;
  if (typeof source?.hasMore === "boolean") return source.hasMore;

  const currentPage = Number(source?.page ?? page);
  const totalPages = Number(source?.totalPages ?? source?.pages ?? 0);
  const total = Number(source?.total ?? 0);

  if (totalPages > 0) return currentPage < totalPages;
  if (total > 0) return page * limit < total;

  return receivedCount >= limit;
};

const mergeUniqueById = <T extends { id?: string }>(prev: T[], next: T[]) => {
  const map = new Map<string, T>();

  [...prev, ...next].forEach((item) => {
    const id = String(item?.id || "");
    if (!id) return;
    map.set(id, item);
  });

  return Array.from(map.values());
};

const hasUsableName = (value: any) => {
  return typeof value === "string" && value.trim().length > 0;
};

const getVariationSnapshot = (entry: any): SelectableEntity | null => {
  if (!entry) return null;

  const source = entry?.variation || entry?.menuVariation || entry;
  const id =
    entry?.variationId ||
    entry?.variation?.id ||
    entry?.menuVariation?.id ||
    source?.id;
  const name = source?.name || entry?.displayText || entry?.name;

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

const getModifierSnapshot = (entry: any): SelectableEntity | null => {
  if (!entry) return null;

  const source = entry?.modifier || entry?.menuModifier || entry;
  const id =
    entry?.modifierId ||
    entry?.modifier?.id ||
    entry?.menuModifier?.id ||
    source?.id;
  const name = source?.name || entry?.name;

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

const mergeModifierSnapshots = (
  previous: any[],
  next: any[]
): SelectableEntity[] => {
  const map = new Map<string, SelectableEntity>();

  normalizeArray(previous).forEach((entry) => {
    const snapshot = getModifierSnapshot(entry);
    if (snapshot?.id) map.set(String(snapshot.id), snapshot);
  });

  normalizeArray(next).forEach((entry) => {
    const snapshot = getModifierSnapshot(entry);
    if (snapshot?.id) map.set(String(snapshot.id), snapshot);
  });

  return Array.from(map.values());
};

const setVariationSnapshot = (
  map: Map<string, SelectableEntity>,
  entry: any,
  options?: { overwrite?: boolean }
) => {
  const snapshot = getVariationSnapshot(entry);
  if (!snapshot?.id) return;

  const id = String(snapshot.id);
  const existing = map.get(id);

  if (!existing || options?.overwrite) {
    map.set(id, snapshot);
    return;
  }

  map.set(id, {
    ...snapshot,
    ...existing,
    name: existing.name || snapshot.name,
  });
};

const setModifierSnapshot = (
  map: Map<string, SelectableEntity>,
  entry: any,
  options?: { overwrite?: boolean }
) => {
  const snapshot = getModifierSnapshot(entry);
  if (!snapshot?.id) return;

  const id = String(snapshot.id);
  const existing = map.get(id);

  if (!existing || options?.overwrite) {
    map.set(id, snapshot);
    return;
  }

  map.set(id, {
    ...snapshot,
    ...existing,
    name: existing.name || snapshot.name,
  });
};

const resolveVariationDisplayText = ({
  existingDisplayText,
  variationName,
  variationId,
}: {
  existingDisplayText?: string;
  variationName?: string;
  variationId: string;
}) => {
  const existing = String(existingDisplayText || "").trim();
  const generatedFallback = `Variation ${variationId}`;

  if (existing && existing !== generatedFallback) return existing;

  return variationName || existing || "";
};

const isValidNonNegativeNumber = (value: any) => {
  if (value === "" || value === null || value === undefined) return false;

  const numeric = Number(value);

  return !Number.isNaN(numeric) && numeric >= 0;
};

const getModifierBasePrice = (modifier?: SelectableEntity) => {
  return sanitizeNonNegativeNumber(String(modifier?.priceDelta ?? 0));
};

const getItemBasePrice = (form: any) => {
  return sanitizeNonNegativeNumber(String(form?.basePrice ?? "0")) || "0";
};

const normalizeTopLevelModifierOverrides = (
  raw: any[]
): ModifierPriceOverride[] => {
  return normalizeArray(raw)
    .filter((entry) => entry?.modifierId && !entry?.variationId)
    .map((entry) => ({
      modifierId: String(entry.modifierId),
      isRequired: entry?.isRequired === true,
      priceDelta: sanitizeNonNegativeNumber(String(entry.priceDelta ?? "")),
    }));
};

const normalizeFlatModifierVariationOverrides = (
  raw: any[]
): FlatModifierVariationOverride[] => {
  return normalizeArray(raw)
    .filter((entry) => entry?.modifierId && entry?.variationId)
    .map((entry) => ({
      modifierId: String(entry.modifierId),
      variationId: String(entry.variationId),
      priceDelta: sanitizeNonNegativeNumber(String(entry.priceDelta ?? "")),
    }));
};

const normalizeNestedModifierOverrides = (
  raw: any[]
): ModifierPriceOverride[] => {
  return normalizeArray(raw)
    .filter((entry) => entry?.modifierId)
    .map((entry) => ({
      modifierId: String(entry.modifierId),
      priceDelta: sanitizeNonNegativeNumber(String(entry.priceDelta ?? "")),
    }));
};

const normalizeVariationPriceOverrides = (
  raw: any[]
): VariationPriceOverride[] => {
  return normalizeArray(raw)
    .filter((entry) => entry?.variationId)
    .map((entry) => ({
      variationId: String(entry.variationId),
      price:
        entry?.price !== undefined && entry?.price !== null
          ? sanitizeNonNegativeNumber(String(entry.price))
          : "",
      pickupPrice:
        entry?.pickupPrice !== undefined && entry?.pickupPrice !== null
          ? sanitizeNonNegativeNumber(String(entry.pickupPrice))
          : "",
      displayText:
        entry?.displayText !== undefined && entry?.displayText !== null
          ? String(entry.displayText)
          : "",
      modifierPriceOverrides: normalizeNestedModifierOverrides(
        entry?.modifierPriceOverrides
      ),
    }));
};

const getInvalidVariationIdsFromModifierOverrideRecords = (form: any) => {
  const invalidIds = new Set<string>();

  normalizeArray(form?.modifierPriceOverrides).forEach((entry) => {
    const isTopLevelModifierOverride =
      entry?.id && entry?.modifierId && !entry?.variationId;

    if (isTopLevelModifierOverride) {
      invalidIds.add(String(entry.id));
    }
  });

  normalizeArray(form?.variationPriceOverrides).forEach((variationOverride) => {
    normalizeArray(variationOverride?.modifierPriceOverrides).forEach(
      (modifierOverride) => {
        const isNestedModifierOverride =
          modifierOverride?.id && modifierOverride?.modifierId;

        if (isNestedModifierOverride) {
          invalidIds.add(String(modifierOverride.id));
        }
      }
    );
  });

  return invalidIds;
};

const resolveVariationIdsFromForm = (form: any) => {
  const invalidVariationIds = getInvalidVariationIdsFromModifierOverrideRecords(form);

  const rawIds = Array.isArray(form?.variationIds)
    ? normalizeIds([form.variationIds], "variation")
    : normalizeIds(
        [
          form?.variations,
          form?.itemVariations,
          form?.variationLinks,
          form?.variationPriceOverrides,
        ],
        "variation"
      );

  return rawIds.filter((id) => !invalidVariationIds.has(String(id)));
};

const StepFour = forwardRef(({ form, setForm }: StepFourProps, ref: any) => {
  const t = useTranslations("menu.itemModal.stepFour");
  const { restaurantId: authRestaurantId } = useAuth();
  const restaurantId = authRestaurantId ?? undefined;
  const canFetchOptions = Boolean(restaurantId);

  const [modifierSearch, setModifierSearch] = useState("");
  const [debouncedModifierSearch, setDebouncedModifierSearch] = useState("");
  const [modifierPage, setModifierPage] = useState(1);
  const [modifierOptions, setModifierOptions] = useState<SelectableEntity[]>(
    []
  );
  const [modifierHasMore, setModifierHasMore] = useState(true);

  const selectedVariationIds = useMemo(
    () => resolveVariationIdsFromForm(form),
    [
      form?.variationIds,
      form?.variations,
      form?.itemVariations,
      form?.variationLinks,
      form?.variationPriceOverrides,
      form?.modifierPriceOverrides,
    ]
  );

  const selectedModifierIds = useMemo(() => {
    if (Array.isArray(form?.modifierIds)) {
      return normalizeIds([form.modifierIds], "modifier");
    }

    const nestedModifierOverrides = normalizeArray(
      form?.variationPriceOverrides
    ).flatMap((entry) => entry?.modifierPriceOverrides || []);

    return normalizeIds(
      [
        form?.modifiers,
        form?.itemModifiers,
        form?.modifierPriceOverrides,
        nestedModifierOverrides,
      ],
      "modifier"
    );
  }, [
    form?.modifierIds,
    form?.modifiers,
    form?.itemModifiers,
    form?.modifierPriceOverrides,
    form?.variationPriceOverrides,
  ]);

  const modifierGroupAssignments = useMemo(
    () =>
      normalizeMenuItemModifierGroupAssignments(
        form?.modifierGroupAssignments || form?.modifierGroups
      ),
    [form?.modifierGroupAssignments, form?.modifierGroups]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextSearch = modifierSearch.trim();

      setModifierPage(1);
      setModifierHasMore(true);
      setDebouncedModifierSearch(nextSearch);
    }, 350);

    return () => clearTimeout(timer);
  }, [modifierSearch]);

  useEffect(() => {
    if (!restaurantId) return;

    setModifierPage(1);
    setModifierOptions([]);
    setModifierHasMore(true);
  }, [restaurantId]);

  const {
    data: modifiersResponse,
    isLoading: loadingModifiers,
    isFetching: fetchingModifiers,
  } = useGetModifiers({
    page: modifierPage,
    limit: PAGE_LIMIT,
    restaurantId,
    search: debouncedModifierSearch || undefined,
  });

  useEffect(() => {
    if (!canFetchOptions || !modifiersResponse) return;

    const nextItems = extractResponseItems<SelectableEntity>(modifiersResponse, "modifiers");

    setModifierOptions((prev) =>
      modifierPage === 1 ? nextItems : mergeUniqueById(prev, nextItems)
    );

    setModifierHasMore(
      getPaginationHasMore({
        response: modifiersResponse,
        page: modifierPage,
        limit: PAGE_LIMIT,
        receivedCount: nextItems.length,
      })
    );
  }, [modifiersResponse, modifierPage, canFetchOptions]);

  const modifierMap = useMemo(() => {
    const map = new Map<string, SelectableEntity>();

    normalizeArray(form?.selectedModifierOptions).forEach((item: any) => {
      setModifierSnapshot(map, item);
    });

    modifierOptions.forEach((item: any) => {
      setModifierSnapshot(map, item, { overwrite: true });
    });

    normalizeArray(form?.modifiers).forEach((item: any) => {
      setModifierSnapshot(map, item);

      if (item?.modifier?.id) {
        setModifierSnapshot(map, item.modifier);
      }
    });

    normalizeArray(form?.itemModifiers).forEach((item: any) => {
      setModifierSnapshot(map, item);

      if (item?.modifier?.id) {
        setModifierSnapshot(map, item.modifier);
      }
    });

    normalizeArray(form?.modifierLinks).forEach((item: any) => {
      setModifierSnapshot(map, item);

      if (item?.modifier?.id) {
        setModifierSnapshot(map, item.modifier);
      }
    });

    normalizeArray(form?.modifierPriceOverrides).forEach((entry: any) => {
      setModifierSnapshot(map, entry);

      if (entry?.modifier?.id) {
        setModifierSnapshot(map, entry.modifier);
      }
    });

    normalizeArray(form?.variationPriceOverrides).forEach((variation: any) => {
      normalizeArray(variation?.modifierPriceOverrides).forEach(
        (modifierOverride: any) => {
          setModifierSnapshot(map, modifierOverride);

          if (modifierOverride?.modifier?.id) {
            setModifierSnapshot(map, modifierOverride.modifier);
          }
        }
      );
    });

    return map;
  }, [
    modifierOptions,
    form?.selectedModifierOptions,
    form?.modifiers,
    form?.itemModifiers,
    form?.modifierLinks,
    form?.modifierPriceOverrides,
    form?.variationPriceOverrides,
  ]);

  const variationMap = useMemo(() => {
    const map = new Map<string, SelectableEntity>();

    normalizeArray(form?.selectedVariationOptions).forEach((item: any) => {
      setVariationSnapshot(map, item);
    });

    normalizeArray(form?.variations).forEach((item: any) => {
      setVariationSnapshot(map, item);

      if (item?.variation?.id) {
        setVariationSnapshot(map, item.variation);
      }
    });

    normalizeArray(form?.itemVariations).forEach((item: any) => {
      setVariationSnapshot(map, item);

      if (item?.variation?.id) {
        setVariationSnapshot(map, item.variation);
      }
    });

    normalizeArray(form?.variationLinks).forEach((item: any) => {
      setVariationSnapshot(map, item);

      if (item?.variation?.id) {
        setVariationSnapshot(map, item.variation);
      }
    });

    normalizeArray(form?.variationPriceOverrides).forEach((entry: any) => {
      setVariationSnapshot(map, entry);

      if (entry?.variation?.id) {
        setVariationSnapshot(map, entry.variation);
      }
    });

    return map;
  }, [
    form?.selectedVariationOptions,
    form?.variations,
    form?.itemVariations,
    form?.variationLinks,
    form?.variationPriceOverrides,
  ]);

  const selectedModifiers = useMemo(
    () =>
      selectedModifierIds.map((id) => {
        const modifier = modifierMap.get(String(id));

        return {
          ...modifier,
          id: String(id),
          name: modifier?.name || `Modifier ${id}`,
        };
      }),
    [selectedModifierIds, modifierMap]
  );

  const selectedVariations = useMemo(
    () =>
      selectedVariationIds.map((id) => {
        const variation = variationMap.get(String(id));

        return {
          ...variation,
          id: String(id),
          name: variation?.name || `Variation ${id}`,
        };
      }),
    [selectedVariationIds, variationMap]
  );

  const topLevelModifierOverrides = useMemo(
    () => normalizeTopLevelModifierOverrides(form?.modifierPriceOverrides),
    [form?.modifierPriceOverrides]
  );

  const variationPriceOverrides = useMemo(
    () => normalizeVariationPriceOverrides(form?.variationPriceOverrides),
    [form?.variationPriceOverrides]
  );

  useEffect(() => {
    setForm((prev: any) => {
      const basePrice = getItemBasePrice(prev);
      const currentTopOverrides = normalizeTopLevelModifierOverrides(
        prev?.modifierPriceOverrides
      );
      const oldFlatVariationModifierOverrides =
        normalizeFlatModifierVariationOverrides(prev?.modifierPriceOverrides);
      const currentVariationOverrides = normalizeVariationPriceOverrides(
        prev?.variationPriceOverrides
      );

      const nextTopModifierOverrides: ModifierPriceOverride[] =
        selectedModifierIds.map((modifierId) => {
          const existing = currentTopOverrides.find(
            (entry) => String(entry.modifierId) === String(modifierId)
          );

          const modifier = modifierMap.get(String(modifierId));
          const defaultPrice = getModifierBasePrice(modifier);

          return {
            modifierId: String(modifierId),
            isRequired: existing?.isRequired === true,
            priceDelta:
              existing?.priceDelta !== undefined &&
              existing?.priceDelta !== null &&
              existing.priceDelta !== ""
                ? existing.priceDelta
                : defaultPrice,
          };
        });

      const nextVariationOverrides: VariationPriceOverride[] =
        selectedVariationIds.map((variationId) => {
          const existing = currentVariationOverrides.find(
            (entry) => String(entry.variationId) === String(variationId)
          );

          const variation = variationMap.get(String(variationId));

          const nestedModifierOverrides = selectedModifierIds.map(
            (modifierId) => {
              const existingNested = existing?.modifierPriceOverrides?.find(
                (entry) => String(entry.modifierId) === String(modifierId)
              );

              const oldFlat = oldFlatVariationModifierOverrides.find(
                (entry) =>
                  String(entry.variationId) === String(variationId) &&
                  String(entry.modifierId) === String(modifierId)
              );

              const topLevel = nextTopModifierOverrides.find(
                (entry) => String(entry.modifierId) === String(modifierId)
              );

              const fallbackPrice = topLevel?.priceDelta || "0";

              return {
                modifierId: String(modifierId),
                priceDelta:
                  existingNested?.priceDelta !== undefined &&
                  existingNested?.priceDelta !== null &&
                  existingNested.priceDelta !== ""
                    ? existingNested.priceDelta
                    : oldFlat?.priceDelta !== undefined &&
                      oldFlat?.priceDelta !== null &&
                      oldFlat.priceDelta !== ""
                    ? oldFlat.priceDelta
                    : fallbackPrice,
              };
            }
          );

          return {
            variationId: String(variationId),
            price:
              existing?.price !== undefined &&
              existing?.price !== null &&
              existing.price !== ""
                ? existing.price
                : basePrice,
            pickupPrice:
              existing?.pickupPrice !== undefined &&
              existing?.pickupPrice !== null
                ? existing.pickupPrice
                : "",
            displayText: resolveVariationDisplayText({
              existingDisplayText: existing?.displayText,
              variationName: variation?.name,
              variationId: String(variationId),
            }),
            modifierPriceOverrides: nestedModifierOverrides,
          };
        });

      const nextState = {
        ...prev,
        modifierIds: selectedModifierIds,
        modifierPriceOverrides: nextTopModifierOverrides,
        variationPriceOverrides: nextVariationOverrides,
      };

      const didChange =
        JSON.stringify(prev?.modifierIds || []) !==
          JSON.stringify(nextState.modifierIds) ||
        JSON.stringify(
          normalizeTopLevelModifierOverrides(prev?.modifierPriceOverrides)
        ) !== JSON.stringify(nextState.modifierPriceOverrides) ||
        JSON.stringify(
          normalizeVariationPriceOverrides(prev?.variationPriceOverrides)
        ) !== JSON.stringify(nextState.variationPriceOverrides);

      return didChange ? nextState : prev;
    });
  }, [
    selectedModifierIds.join("|"),
    selectedVariationIds.join("|"),
    modifierMap,
    variationMap,
    form?.basePrice,
    setForm,
  ]);

  const validateStep = () => {
    if (!restaurantId) {
      toast.error(t("restaurantMissing"));
      return false;
    }

    const basePrice = getItemBasePrice(form);
    const normalizedTopModifierOverrides = normalizeTopLevelModifierOverrides(
      form?.modifierPriceOverrides
    );
    const normalizedVariationOverrides = normalizeVariationPriceOverrides(
      form?.variationPriceOverrides
    );

    for (const modifierId of selectedModifierIds) {
      const override = normalizedTopModifierOverrides.find(
        (entry) => String(entry.modifierId) === String(modifierId)
      );

      const priceDelta = override?.priceDelta ?? "0";

      if (!isValidNonNegativeNumber(priceDelta)) {
        toast.error(t("modifierPriceInvalid"));
        return false;
      }
    }

    for (const variationId of selectedVariationIds) {
      const override = normalizedVariationOverrides.find(
        (entry) => String(entry.variationId) === String(variationId)
      );

      for (const modifierId of selectedModifierIds) {
        const nestedOverride = override?.modifierPriceOverrides?.find(
          (entry) => String(entry.modifierId) === String(modifierId)
        );

        const topLevel = normalizedTopModifierOverrides.find(
          (entry) => String(entry.modifierId) === String(modifierId)
        );

        const priceDelta = nestedOverride?.priceDelta || topLevel?.priceDelta || "0";

        if (!isValidNonNegativeNumber(priceDelta)) {
          toast.error(t("modifierVariationPriceInvalid"));
          return false;
        }
      }
    }

    const finalTopOverrides = selectedModifierIds.map((modifierId) => {
      const existing = normalizedTopModifierOverrides.find(
        (entry) => String(entry.modifierId) === String(modifierId)
      );

      const modifier = modifierMap.get(String(modifierId));

      return {
        modifierId: String(modifierId),
        isRequired: existing?.isRequired === true,
        priceDelta: existing?.priceDelta || getModifierBasePrice(modifier),
      };
    });

    const finalVariationOverrides = selectedVariationIds.map((variationId) => {
      const existing = normalizedVariationOverrides.find(
        (entry) => String(entry.variationId) === String(variationId)
      );

      const variation = variationMap.get(String(variationId));

      return {
        variationId: String(variationId),
        price: existing?.price || basePrice,
        pickupPrice: existing?.pickupPrice || "",
        displayText: resolveVariationDisplayText({
          existingDisplayText: existing?.displayText,
          variationName: variation?.name,
          variationId: String(variationId),
        }),
        modifierPriceOverrides: selectedModifierIds.map((modifierId) => {
          const nestedExisting = existing?.modifierPriceOverrides?.find(
            (entry) => String(entry.modifierId) === String(modifierId)
          );

          const topLevel = finalTopOverrides.find(
            (entry) => String(entry.modifierId) === String(modifierId)
          );

          return {
            modifierId: String(modifierId),
            priceDelta: nestedExisting?.priceDelta || topLevel?.priceDelta || "0",
          };
        }),
      };
    });

    setForm((prev: any) => ({
      ...prev,
      modifierIds: selectedModifierIds,
      modifierPriceOverrides: finalTopOverrides,
      variationPriceOverrides: finalVariationOverrides,
    }));

    return true;
  };

  useImperativeHandle(ref, () => ({
    validateStep,
  }));

  const getTopLevelModifierValue = (modifier: SelectableEntity) => {
    const existing = topLevelModifierOverrides.find(
      (entry) => String(entry.modifierId) === String(modifier.id)
    );

    if (existing) return existing.priceDelta;

    return getModifierBasePrice(modifier);
  };

  const getTopLevelModifierRequiredValue = (modifier: SelectableEntity) => {
    const existing = topLevelModifierOverrides.find(
      (entry) => String(entry.modifierId) === String(modifier.id)
    );

    return existing?.isRequired === true;
  };

  const getNestedModifierValue = (
    variationId: string,
    modifier: SelectableEntity
  ) => {
    const variationOverride = variationPriceOverrides.find(
      (entry) => String(entry.variationId) === String(variationId)
    );

    const nested = variationOverride?.modifierPriceOverrides?.find(
      (entry) => String(entry.modifierId) === String(modifier.id)
    );

    if (nested) return nested.priceDelta;

    return getTopLevelModifierValue(modifier);
  };

  const toggleModifier = (id: string) => {
    setForm((prev: any) => {
      const currentIds = normalizeIds([prev?.modifierIds], "modifier");
      const exists = currentIds.includes(id);

      const nextIds = exists
        ? currentIds.filter((entry) => entry !== id)
        : [...currentIds, id];

      const selectedModifier =
        modifierMap.get(String(id)) ||
        modifierOptions.find((item) => String(item?.id || "") === String(id));

      return {
        ...prev,
        modifierIds: nextIds,
        selectedModifierOptions: selectedModifier
          ? mergeModifierSnapshots(prev?.selectedModifierOptions, [
              selectedModifier,
            ])
          : normalizeArray(prev?.selectedModifierOptions),
      };
    });
  };

  const clearModifiers = () => {
    setForm((prev: any) => {
      const currentVariations = normalizeVariationPriceOverrides(
        prev?.variationPriceOverrides
      );

      return {
        ...prev,
        modifierIds: [],
        modifierPriceOverrides: [],
        variationPriceOverrides: currentVariations.map((variation) => ({
          ...variation,
          modifierPriceOverrides: [],
        })),
      };
    });
  };

  const handleTopLevelModifierChange = ({
    modifierId,
    priceDelta,
  }: {
    modifierId: string;
    priceDelta: string;
  }) => {
    const sanitized = sanitizeNonNegativeNumber(priceDelta);

    setForm((prev: any) => {
      const current = normalizeTopLevelModifierOverrides(
        prev?.modifierPriceOverrides
      );
      const currentVariationOverrides = normalizeVariationPriceOverrides(
        prev?.variationPriceOverrides
      );

      const exists = current.some(
        (entry) => String(entry.modifierId) === String(modifierId)
      );

      const next = exists
        ? current.map((entry) =>
            String(entry.modifierId) === String(modifierId)
              ? {
                  ...entry,
                  priceDelta: sanitized,
                }
              : entry
          )
        : [
            ...current,
            {
              modifierId,
              isRequired: false,
              priceDelta: sanitized,
            },
          ];

      return {
        ...prev,
        modifierPriceOverrides: next,
        variationPriceOverrides: currentVariationOverrides.map((variation) => {
          const nested = normalizeNestedModifierOverrides(
            variation.modifierPriceOverrides
          );

          const hasNested = nested.some(
            (entry) => String(entry.modifierId) === String(modifierId)
          );

          return {
            ...variation,
            modifierPriceOverrides: hasNested
              ? nested.map((entry) =>
                  String(entry.modifierId) === String(modifierId)
                    ? {
                        ...entry,
                        priceDelta: sanitized,
                      }
                    : entry
                )
              : [
                  ...nested,
                  {
                    modifierId,
                    priceDelta: sanitized,
                  },
                ],
          };
        }),
      };
    });
  };

  const handleTopLevelRequiredChange = ({
    modifierId,
    isRequired,
  }: {
    modifierId: string;
    isRequired: boolean;
  }) => {
    setForm((prev: any) => {
      const current = normalizeTopLevelModifierOverrides(
        prev?.modifierPriceOverrides
      );

      const exists = current.some(
        (entry) => String(entry.modifierId) === String(modifierId)
      );

      const next = exists
        ? current.map((entry) =>
            String(entry.modifierId) === String(modifierId)
              ? {
                  ...entry,
                  isRequired,
                }
              : entry
          )
        : [
            ...current,
            {
              modifierId,
              isRequired,
              priceDelta: "0",
            },
          ];

      return {
        ...prev,
        modifierPriceOverrides: next,
      };
    });
  };

  const handleNestedModifierChange = ({
    variationId,
    modifierId,
    priceDelta,
  }: {
    variationId: string;
    modifierId: string;
    priceDelta: string;
  }) => {
    const sanitized = sanitizeNonNegativeNumber(priceDelta);

    setForm((prev: any) => {
      const current = normalizeVariationPriceOverrides(
        prev?.variationPriceOverrides
      );
      const basePrice = getItemBasePrice(prev);

      const variationExists = current.some(
        (entry) => String(entry.variationId) === String(variationId)
      );

      const next = variationExists
        ? current.map((variation) => {
            if (String(variation.variationId) !== String(variationId)) {
              return variation;
            }

            const nested = normalizeNestedModifierOverrides(
              variation.modifierPriceOverrides
            );

            const modifierExists = nested.some(
              (entry) => String(entry.modifierId) === String(modifierId)
            );

            const nextNested = modifierExists
              ? nested.map((entry) =>
                  String(entry.modifierId) === String(modifierId)
                    ? {
                        ...entry,
                        priceDelta: sanitized,
                      }
                    : entry
                )
              : [
                  ...nested,
                  {
                    modifierId,
                    priceDelta: sanitized,
                  },
                ];

            return {
              ...variation,
              modifierPriceOverrides: nextNested,
            };
          })
        : [
            ...current,
            {
              variationId,
              price: basePrice,
              pickupPrice: "",
              displayText: variationMap.get(String(variationId))?.name || "",
              modifierPriceOverrides: [
                {
                  modifierId,
                  priceDelta: sanitized,
                },
              ],
            },
          ];

      return {
        ...prev,
        variationPriceOverrides: next,
      };
    });
  };

  const loadMoreModifiers = () => {
    if (!modifierHasMore || fetchingModifiers || loadingModifiers) return;
    setModifierPage((prev) => prev + 1);
  };

  return (
    <div className="w-full min-w-0 space-y-6 overflow-hidden">
      <div className="rounded-[18px] border border-primary/10 bg-primary/5 p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary text-white">
            <Sparkles size={18} />
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900">
              {t("title")}
            </h3>

            <p className="mt-1 text-sm text-gray-600">
              {t("description")}
            </p>
          </div>
        </div>
      </div>

      <ModifierGroupAssignmentForm
        mode="item"
        targetId={form?.id || ""}
        restaurantId={restaurantId}
        defaultValues={modifierGroupAssignments}
        onAssignmentsChange={(assignments) => {
          setForm((prev: Record<string, unknown>) => ({
            ...prev,
            modifierGroupAssignments: assignments,
            modifierGroupIds: assignments.map((assignment) => assignment.groupId),
          }));
        }}
      />

      {SHOW_LEGACY_DIRECT_MODIFIERS ? (
        <>
          <ModifierSelectionSection
            title={t("legacyAssignTitle")}
            description={t("legacyAssignDescription")}
            icon={<Tags size={18} />}
            searchValue={modifierSearch}
            onSearchChange={setModifierSearch}
            searchPlaceholder={t("searchPlaceholder")}
            loading={
              (loadingModifiers || fetchingModifiers) &&
              modifierOptions.length === 0
            }
            loadingMore={modifierPage > 1 && fetchingModifiers}
            hasMore={modifierHasMore}
            onLoadMore={loadMoreModifiers}
            items={modifierOptions}
            selectedIds={selectedModifierIds}
            selectedModifiers={selectedModifiers}
            emptyTitle={t("emptyTitle")}
            emptyDescription={t("emptyDescription")}
            onToggle={toggleModifier}
            onClear={clearModifiers}
          />

          <ModifierPricingByVariationSection
            selectedModifiers={selectedModifiers}
            selectedVariations={selectedVariations}
            getTopLevelPriceValue={getTopLevelModifierValue}
            getTopLevelRequiredValue={getTopLevelModifierRequiredValue}
            getNestedPriceValue={getNestedModifierValue}
            onTopLevelPriceChange={handleTopLevelModifierChange}
            onTopLevelRequiredChange={handleTopLevelRequiredChange}
            onNestedPriceChange={handleNestedModifierChange}
          />
        </>
      ) : null}
    </div>
  );
});

StepFour.displayName = "StepFour";

export default StepFour;

type ModifierSelectionSectionProps = {
  title: string;
  description: string;
  icon: ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  items: SelectableEntity[];
  selectedIds: string[];
  selectedModifiers: SelectableEntity[];
  emptyTitle: string;
  emptyDescription: string;
  onToggle: (id: string) => void;
  onClear: () => void;
};

function ModifierSelectionSection({
  title,
  description,
  icon,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  items,
  selectedIds,
  selectedModifiers,
  emptyTitle,
  emptyDescription,
  onToggle,
  onClear,
}: ModifierSelectionSectionProps) {
  const t = useTranslations("menu.itemModal.stepFour");
  const commonT = useTranslations("common");
  const selectedMap = useMemo(() => {
    const map = new Map<string, SelectableEntity>();

    selectedModifiers.forEach((item) => {
      if (item?.id) map.set(String(item.id), item);
    });

    return map;
  }, [selectedModifiers]);

  const renderedItems = useMemo(() => {
    const selectedIdSet = new Set(selectedIds.map((id) => String(id)));
    const map = new Map<string, SelectableEntity>();

    selectedIds.forEach((id) => {
      const item = selectedMap.get(String(id));

      if (item?.id) {
        map.set(String(item.id), item);
      }
    });

    items.forEach((item) => {
      const id = String(item?.id || "");

      if (!id || selectedIdSet.has(id)) return;

      map.set(id, item);
    });

    return Array.from(map.values());
  }, [items, selectedIds, selectedMap]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;

    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 32) {
      if (hasMore && !loading && !loadingMore) {
        onLoadMore();
      }
    }
  };

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-[20px] border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gray-100 text-gray-700">
            {icon}
          </div>

          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">
                {title}
              </h3>

              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {t("selectedCount", { count: selectedIds.length })}
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
        </div>

        {selectedIds.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={onClear}
            className="h-[38px] shrink-0 rounded-[12px] border-gray-200 text-sm"
          >
            {commonT("clear")}
          </Button>
        ) : null}
      </div>

      {selectedIds.length > 0 ? (
        <div className="mb-4 flex max-h-[92px] flex-wrap gap-2 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin]">
          {selectedIds.map((id) => {
            const item = selectedMap.get(String(id));

            return (
              <button
                key={id}
                type="button"
                onClick={() => onToggle(String(id))}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10"
              >
                <span className="max-w-[180px] truncate">
                  {item?.name || t("selectedFallback", { id })}
                </span>
                <X size={14} className="shrink-0" />
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-[44px] rounded-[14px] border-gray-200 bg-[#FAFAFA] pl-11 text-sm focus:border-primary focus:ring-primary/15"
        />
      </div>

      <div className="w-full min-w-0 overflow-hidden rounded-[16px] border border-gray-100 bg-[#FAFAFA] p-3">
        {loading ? (
          <div className="flex min-h-[170px] items-center justify-center text-gray-500">
            <Loader2 className="mr-2 animate-spin" size={20} />
            {t("loadingOptions")}
          </div>
        ) : renderedItems.length === 0 ? (
          <div className="flex min-h-[170px] flex-col items-center justify-center rounded-[14px] border border-dashed border-gray-200 bg-white p-6 text-center">
            <p className="text-sm font-semibold text-gray-900">{emptyTitle}</p>
            <p className="mt-1 max-w-[320px] text-sm text-gray-500">
              {emptyDescription}
            </p>
          </div>
        ) : (
          <div
            className="grid max-h-[360px] gap-3 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin]"
            onScroll={handleScroll}
          >
            {renderedItems.map((item) => {
              const id = String(item?.id || "");
              const selected = selectedIds.includes(id);

              if (!id) return null;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onToggle(id)}
                  className={`w-full min-w-0 rounded-[14px] border bg-white p-4 text-left transition ${
                    selected
                      ? "border-primary shadow-sm ring-2 ring-primary/10"
                      : "border-gray-100 hover:border-primary/30 hover:shadow-sm"
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border ${
                        selected
                          ? "border-primary bg-primary text-white"
                          : "border-gray-300 bg-white text-transparent"
                      }`}
                    >
                      <Check size={14} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="max-w-full truncate text-sm font-semibold text-gray-900">
                          {item?.name || t("unnamed")}
                        </p>

                        {item?.isActive === false ? (
                          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                            {commonT("inactive")}
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            {commonT("active")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {loadingMore ? (
              <div className="flex items-center justify-center py-3 text-sm text-gray-500">
                <Loader2 className="mr-2 animate-spin" size={16} />
                {t("loadingMore")}
              </div>
            ) : null}

            {!loadingMore && hasMore ? (
              <button
                type="button"
                onClick={onLoadMore}
                className="rounded-[12px] border border-dashed border-gray-200 bg-white py-2 text-center text-xs font-medium text-gray-500 transition hover:border-primary/30 hover:text-primary"
              >
                {t("loadMore")}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

type ModifierPricingByVariationSectionProps = {
  selectedModifiers: SelectableEntity[];
  selectedVariations: SelectableEntity[];
  getTopLevelPriceValue: (modifier: SelectableEntity) => string;
  getTopLevelRequiredValue: (modifier: SelectableEntity) => boolean;
  getNestedPriceValue: (
    variationId: string,
    modifier: SelectableEntity
  ) => string;
  onTopLevelPriceChange: (payload: {
    modifierId: string;
    priceDelta: string;
  }) => void;
  onTopLevelRequiredChange: (payload: {
    modifierId: string;
    isRequired: boolean;
  }) => void;
  onNestedPriceChange: (payload: {
    variationId: string;
    modifierId: string;
    priceDelta: string;
  }) => void;
};

function ModifierPricingByVariationSection({
  selectedModifiers,
  selectedVariations,
  getTopLevelPriceValue,
  getTopLevelRequiredValue,
  getNestedPriceValue,
  onTopLevelPriceChange,
  onTopLevelRequiredChange,
  onNestedPriceChange,
}: ModifierPricingByVariationSectionProps) {
  const t = useTranslations("menu.itemModal.stepFour");
  if (!selectedModifiers.length) {
    return (
      <section className="rounded-[20px] border border-dashed border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold text-gray-900">
          {t("noModifierPricingTitle")}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          {t("noModifierPricingDescription")}
        </p>
      </section>
    );
  }

  if (!selectedVariations.length) {
    return (
      <section className="w-full min-w-0 overflow-hidden rounded-[20px] border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">
              {t("modifierPrices")}
            </h3>

            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {t("modifierCount", { count: selectedModifiers.length })}
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            {t("itemLevelPricesDescription")}
          </p>
        </div>

        <div className="grid gap-3">
          {selectedModifiers.map((modifier) => (
            <div
              key={modifier.id}
              className="grid w-full min-w-0 gap-3 rounded-[14px] border border-gray-100 bg-[#FAFAFA] p-3 sm:grid-cols-[minmax(0,1fr)_160px_132px]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {modifier.name}
                </p>
              </div>

              <Input
                type="number"
                min={0}
                value={getTopLevelPriceValue(modifier)}
                onKeyDown={blockInvalidNumberKeys}
                onPaste={blockNegativeNumberPaste}
                onChange={(event) =>
                  onTopLevelPriceChange({
                    modifierId: String(modifier.id),
                    priceDelta: event.target.value,
                  })
                }
                placeholder="0"
                className="h-[40px] min-w-0 rounded-[12px] border-gray-200 bg-white text-sm focus:border-primary focus:ring-primary/15"
              />

              <RequiredSwitch
                checked={getTopLevelRequiredValue(modifier)}
                onCheckedChange={(checked) =>
                  onTopLevelRequiredChange({
                    modifierId: String(modifier.id),
                    isRequired: checked,
                  })
                }
              />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-[20px] border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">
            {t("modifierPricesByVariation")}
          </h3>

          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {t("variationCount", { count: selectedVariations.length })}
          </span>

          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
            {t("modifierCount", { count: selectedModifiers.length })}
          </span>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          {t("modifierPricesByVariationDescription")}
        </p>
      </div>

      <div className="mb-5 grid gap-3 rounded-[16px] border border-gray-100 bg-[#FAFAFA] p-3">
        {selectedModifiers.map((modifier) => (
          <div
            key={`required-${modifier.id}`}
            className="grid min-w-0 gap-3 rounded-[12px] border border-gray-100 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_132px]"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {modifier.name}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {t("customerMustSelectModifier")}
              </p>
            </div>

            <RequiredSwitch
              checked={getTopLevelRequiredValue(modifier)}
              onCheckedChange={(checked) =>
                onTopLevelRequiredChange({
                  modifierId: String(modifier.id),
                  isRequired: checked,
                })
              }
            />
          </div>
        ))}
      </div>

      <div className="max-h-[620px] space-y-4 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin]">
        {selectedVariations.map((variation) => (
          <div
            key={variation.id}
            className="w-full min-w-0 rounded-[18px] border border-gray-100 bg-[#FAFAFA] p-4"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h4 className="truncate text-sm font-semibold text-gray-900">
                  {variation.name}
                </h4>

                <p className="mt-0.5 text-xs text-gray-500">
                  {t("specifyVariationModifierPrices")}
                </p>
              </div>

            </div>

            <div className="grid gap-3">
              {selectedModifiers.map((modifier) => (
                <div
                  key={`${variation.id}-${modifier.id}`}
                  className="grid w-full min-w-0 gap-3 rounded-[12px] border border-gray-100 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_160px]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {modifier.name}
                    </p>
                  </div>

                  <Input
                    type="number"
                    min={0}
                    value={getNestedPriceValue(String(variation.id), modifier)}
                    onKeyDown={blockInvalidNumberKeys}
                    onPaste={blockNegativeNumberPaste}
                    onChange={(event) =>
                      onNestedPriceChange({
                        variationId: String(variation.id),
                        modifierId: String(modifier.id),
                        priceDelta: event.target.value,
                      })
                    }
                    placeholder="0"
                    className="h-[40px] min-w-0 rounded-[12px] border-gray-200 bg-white text-sm focus:border-primary focus:ring-primary/15"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RequiredSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const t = useTranslations("menu.itemModal.stepFour");

  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-[12px] border border-gray-100 bg-white px-3 py-2 text-sm font-medium text-gray-700 sm:justify-center">
      <span>{t("required")}</span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={t("required")}
      />
    </div>
  );
}
