"use client";

import type { Dispatch, ReactNode, SetStateAction, UIEvent } from "react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import {
  Check,
  Loader2,
  Search,
  Sparkles,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useGetMenuVariations } from "@/hooks/useMenus";
import {
  blockInvalidNumberKeys,
  blockNegativeNumberPaste,
  sanitizeNonNegativeNumber,
} from "@/lib/number-input";
import { useTranslations } from "next-intl";

type StepThreeProps = {
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
};

type VariationPriceOverride = {
  variationId: string;
  price: string;
  pickupPrice: string;
  displayText: string;
  modifierPriceOverrides: ModifierPriceOverride[];
};
import { extractResponseItems } from "@/lib/response";

const PAGE_LIMIT = 20;

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

  const name =
    source?.name ||
    entry?.displayText ||
    entry?.name;

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

const mergeEntitySnapshots = (
  previous: any[],
  next: any[]
): SelectableEntity[] => {
  const map = new Map<string, SelectableEntity>();

  normalizeArray(previous).forEach((entry) => {
    const snapshot = getVariationSnapshot(entry);
    if (snapshot?.id) map.set(String(snapshot.id), snapshot);
  });

  normalizeArray(next).forEach((entry) => {
    const snapshot = getVariationSnapshot(entry);
    if (snapshot?.id) map.set(String(snapshot.id), snapshot);
  });

  return Array.from(map.values());
};

const filterVariationSnapshotsByIds = (
  entries: any[],
  selectedIds: string[]
): SelectableEntity[] => {
  const selectedIdSet = new Set(selectedIds.map((id) => String(id)));

  return normalizeArray(entries)
    .map(getVariationSnapshot)
    .filter(
      (variation): variation is SelectableEntity =>
        variation !== null && selectedIdSet.has(String(variation.id))
    );
};

const filterVariationOverridesByIds = (
  entries: any[],
  selectedIds: string[]
): VariationPriceOverride[] => {
  const selectedIdSet = new Set(selectedIds.map((id) => String(id)));

  return normalizeVariationPriceOverrides(entries).filter((entry) =>
    selectedIdSet.has(String(entry.variationId))
  );
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

const isEmptyValue = (value: any) => {
  return value === "" || value === null || value === undefined;
};

const isValidNonNegativeNumber = (value: any) => {
  if (isEmptyValue(value)) return false;

  const numeric = Number(value);

  return !Number.isNaN(numeric) && numeric >= 0;
};

const isValidOptionalNonNegativeNumber = (value: any) => {
  if (isEmptyValue(value)) return true;

  return isValidNonNegativeNumber(value);
};

const getItemBasePrice = (form: any) => {
  if (isEmptyValue(form?.basePrice)) return "";

  return sanitizeNonNegativeNumber(String(form?.basePrice));
};

const getFallbackVariationPrice = ({
  form,
  variation,
}: {
  form: any;
  variation?: SelectableEntity;
}) => {
  if (!isEmptyValue(variation?.price)) {
    const variationPrice = sanitizeNonNegativeNumber(String(variation?.price));

    if (variationPrice !== "") return variationPrice;
  }

  const basePrice = getItemBasePrice(form);

  if (basePrice !== "") return basePrice;

  return "0";
};

const normalizeTopLevelModifierOverrides = (
  raw: any[]
): ModifierPriceOverride[] => {
  return normalizeArray(raw)
    .filter((entry) => entry?.modifierId && !entry?.variationId)
    .map((entry) => ({
      modifierId: String(entry.modifierId),
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

const resolveModifierIdsFromForm = (form: any) => {
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
};

const StepThree = forwardRef(({ form, setForm }: StepThreeProps, ref: any) => {
  const t = useTranslations("menu.itemModal.stepThree");
  const { restaurantId: authRestaurantId } = useAuth();
  const restaurantId = authRestaurantId ?? undefined;
  const canFetchOptions = Boolean(restaurantId);

  const [variationSearch, setVariationSearch] = useState("");
  const [debouncedVariationSearch, setDebouncedVariationSearch] = useState("");
  const [variationPage, setVariationPage] = useState(1);
  const [variationOptions, setVariationOptions] = useState<SelectableEntity[]>(
    []
  );
  const [variationHasMore, setVariationHasMore] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextSearch = variationSearch.trim();

      setVariationPage(1);
      setVariationHasMore(true);
      setDebouncedVariationSearch(nextSearch);
    }, 350);

    return () => clearTimeout(timer);
  }, [variationSearch]);

  useEffect(() => {
    if (!restaurantId) return;

    setVariationPage(1);
    setVariationOptions([]);
    setVariationHasMore(true);
  }, [restaurantId]);

  const selectedVariationIds = useMemo(() => {
    const invalidVariationIds =
      getInvalidVariationIdsFromModifierOverrideRecords(form);

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
  }, [form]);

  const {
    data: variationsResponse,
    isLoading: loadingVariations,
    isFetching: fetchingVariations,
  } = useGetMenuVariations({
    page: variationPage,
    limit: PAGE_LIMIT,
    restaurantId,
    search: debouncedVariationSearch || undefined,
  });

  useEffect(() => {
    if (!canFetchOptions || !variationsResponse) return;

    const nextItems = extractResponseItems<SelectableEntity>(variationsResponse, "variations");

    setVariationOptions((prev) =>
      variationPage === 1 ? nextItems : mergeUniqueById(prev, nextItems)
    );

    setVariationHasMore(
      getPaginationHasMore({
        response: variationsResponse,
        page: variationPage,
        limit: PAGE_LIMIT,
        receivedCount: nextItems.length,
      })
    );
  }, [variationsResponse, variationPage, canFetchOptions]);

  const variationMap = useMemo(() => {
    const map = new Map<string, SelectableEntity>();

    normalizeArray(form?.selectedVariationOptions).forEach((item: any) => {
      setVariationSnapshot(map, item);
    });

    variationOptions.forEach((item: any) => {
      setVariationSnapshot(map, item, { overwrite: true });
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
    variationOptions,
    form?.selectedVariationOptions,
    form?.variations,
    form?.itemVariations,
    form?.variationLinks,
    form?.variationPriceOverrides,
  ]);

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

  const variationPriceOverrides = useMemo(
    () => normalizeVariationPriceOverrides(form?.variationPriceOverrides),
    [form?.variationPriceOverrides]
  );
  const selectedVariationKey = selectedVariationIds.join("|");

  useEffect(() => {
    setForm((prev: any) => {
      const modifierIds = resolveModifierIdsFromForm(prev);
      const topLevelModifierOverrides = normalizeTopLevelModifierOverrides(
        prev?.modifierPriceOverrides
      );
      const currentVariationOverrides = normalizeVariationPriceOverrides(
        prev?.variationPriceOverrides
      );

      const nextVariationOverrides: VariationPriceOverride[] =
        selectedVariationIds.map((variationId) => {
          const existing = currentVariationOverrides.find(
            (entry) => String(entry.variationId) === String(variationId)
          );

          const variation = variationMap.get(String(variationId));
          const fallbackPrice = getFallbackVariationPrice({
            form: prev,
            variation,
          });

          const nestedModifierOverrides = modifierIds.map((modifierId) => {
            const existingNested = existing?.modifierPriceOverrides?.find(
              (entry) => String(entry.modifierId) === String(modifierId)
            );

            const topLevel = topLevelModifierOverrides.find(
              (entry) => String(entry.modifierId) === String(modifierId)
            );

            return {
              modifierId: String(modifierId),
              priceDelta:
                existingNested?.priceDelta !== undefined &&
                existingNested?.priceDelta !== null &&
                existingNested.priceDelta !== ""
                  ? existingNested.priceDelta
                  : topLevel?.priceDelta || "0",
            };
          });

          return {
            variationId: String(variationId),
            price:
              existing?.price !== undefined &&
              existing?.price !== null &&
              existing.price !== ""
                ? existing.price
                : fallbackPrice,
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
        variationIds: selectedVariationIds,
        variationPriceOverrides: nextVariationOverrides,
      };

      const didChange =
        JSON.stringify(prev?.variationIds || []) !==
          JSON.stringify(nextState.variationIds) ||
        JSON.stringify(
          normalizeVariationPriceOverrides(prev?.variationPriceOverrides)
        ) !== JSON.stringify(nextState.variationPriceOverrides);

      return didChange ? nextState : prev;
    });
  }, [
    selectedVariationKey,
    selectedVariationIds,
    variationMap,
    form?.basePrice,
    setForm,
  ]);

  const validateStep = () => {
    if (!restaurantId) {
      toast.error(t("restaurantMissing"));
      return false;
    }

    if (!isValidOptionalNonNegativeNumber(form?.basePrice)) {
      toast.error(t("basePriceInvalid"));
      return false;
    }

    const normalizedTopModifierOverrides = normalizeTopLevelModifierOverrides(
      form?.modifierPriceOverrides
    );
    const normalizedVariationOverrides = normalizeVariationPriceOverrides(
      form?.variationPriceOverrides
    );
    const modifierIds = resolveModifierIdsFromForm(form);

    for (const variationId of selectedVariationIds) {
      const override = normalizedVariationOverrides.find(
        (entry) => String(entry.variationId) === String(variationId)
      );

      const variation = variationMap.get(String(variationId));
      const fallbackPrice = getFallbackVariationPrice({
        form,
        variation,
      });

      const variationPrice =
        override?.price !== undefined &&
        override?.price !== null &&
        override.price !== ""
          ? override.price
          : fallbackPrice;

      if (!isValidNonNegativeNumber(variationPrice)) {
        toast.error(t("variationPriceInvalid"));
        return false;
      }

      if (
        override?.pickupPrice !== "" &&
        override?.pickupPrice !== undefined &&
        override?.pickupPrice !== null &&
        !isValidNonNegativeNumber(override.pickupPrice)
      ) {
        toast.error(t("variationPickupPriceInvalid"));
        return false;
      }
    }

    const finalVariationOverrides = selectedVariationIds.map((variationId) => {
      const existing = normalizedVariationOverrides.find(
        (entry) => String(entry.variationId) === String(variationId)
      );

      const variation = variationMap.get(String(variationId));
      const fallbackPrice = getFallbackVariationPrice({
        form,
        variation,
      });

      return {
        variationId: String(variationId),
        price:
          existing?.price !== undefined &&
          existing?.price !== null &&
          existing.price !== ""
            ? existing.price
            : fallbackPrice,
        pickupPrice: existing?.pickupPrice || "",
        displayText: resolveVariationDisplayText({
          existingDisplayText: existing?.displayText,
          variationName: variation?.name,
          variationId: String(variationId),
        }),
        modifierPriceOverrides: modifierIds.map((modifierId) => {
          const nestedExisting = existing?.modifierPriceOverrides?.find(
            (entry) => String(entry.modifierId) === String(modifierId)
          );

          const topLevel = normalizedTopModifierOverrides.find(
            (entry) => String(entry.modifierId) === String(modifierId)
          );

          return {
            modifierId: String(modifierId),
            priceDelta:
              nestedExisting?.priceDelta || topLevel?.priceDelta || "0",
          };
        }),
      };
    });

    setForm((prev: any) => ({
      ...prev,
      variationIds: selectedVariationIds,
      variationPriceOverrides: finalVariationOverrides,
    }));

    return true;
  };

  useImperativeHandle(ref, () => ({
    validateStep,
  }));

  const getVariationOverride = (variationId: string) => {
    return variationPriceOverrides.find(
      (entry) => String(entry.variationId) === String(variationId)
    );
  };

  const getVariationPrice = (variationId: string) => {
    const override = getVariationOverride(variationId);

    if (
      override?.price !== undefined &&
      override?.price !== null &&
      override.price !== ""
    ) {
      return override.price;
    }

    return getFallbackVariationPrice({
      form,
      variation: variationMap.get(String(variationId)),
    });
  };

  const getVariationPickupPrice = (variationId: string) => {
    const override = getVariationOverride(variationId);

    return override?.pickupPrice || "";
  };

  const getVariationDisplayText = (variationId: string) => {
    const override = getVariationOverride(variationId);
    const variation = variationMap.get(String(variationId));

    return resolveVariationDisplayText({
      existingDisplayText: override?.displayText,
      variationName: variation?.name,
      variationId,
    });
  };

  const upsertVariationOverride = ({
    variationId,
    patch,
  }: {
    variationId: string;
    patch: Partial<VariationPriceOverride>;
  }) => {
    setForm((prev: any) => {
      const current = normalizeVariationPriceOverrides(
        prev?.variationPriceOverrides
      );

      const variation = variationMap.get(String(variationId));
      const fallbackPrice = getFallbackVariationPrice({
        form: prev,
        variation,
      });

      const existing = current.find(
        (entry) => String(entry.variationId) === String(variationId)
      );

      const defaultOverride: VariationPriceOverride = {
        variationId,
        price: fallbackPrice,
        pickupPrice: "",
        displayText: resolveVariationDisplayText({
          existingDisplayText: "",
          variationName: variation?.name,
          variationId,
        }),
        modifierPriceOverrides: [],
      };

      const next = existing
        ? current.map((entry) =>
            String(entry.variationId) === String(variationId)
              ? {
                  ...entry,
                  ...patch,
                }
              : entry
          )
        : [
            ...current,
            {
              ...defaultOverride,
              ...patch,
            },
          ];

      return {
        ...prev,
        variationPriceOverrides: next,
      };
    });
  };

  const toggleVariation = (id: string) => {
    setForm((prev: any) => {
      const currentIds = normalizeIds([prev?.variationIds], "variation");
      const exists = currentIds.includes(id);

      const nextIds = exists
        ? currentIds.filter((entry) => entry !== id)
        : [...currentIds, id];

      const selectedVariation =
        variationMap.get(String(id)) ||
        variationOptions.find((item) => String(item?.id || "") === String(id));

      const mergedSelectedVariationOptions = selectedVariation
        ? mergeEntitySnapshots(prev?.selectedVariationOptions, [
            selectedVariation,
          ])
        : normalizeArray(prev?.selectedVariationOptions);

      return {
        ...prev,
        variationIds: nextIds,
        selectedVariationOptions: filterVariationSnapshotsByIds(
          mergedSelectedVariationOptions,
          nextIds
        ),
        variationPriceOverrides: filterVariationOverridesByIds(
          prev?.variationPriceOverrides,
          nextIds
        ),
      };
    });
  };

  const clearVariations = () => {
    setForm((prev: any) => ({
      ...prev,
      variationIds: [],
      selectedVariationOptions: [],
      variationPriceOverrides: [],
    }));
  };

  const handleVariationPriceChange = ({
    variationId,
    value,
  }: {
    variationId: string;
    value: string;
  }) => {
    upsertVariationOverride({
      variationId,
      patch: {
        price: sanitizeNonNegativeNumber(value),
      },
    });
  };

  const handleVariationPickupPriceChange = ({
    variationId,
    value,
  }: {
    variationId: string;
    value: string;
  }) => {
    upsertVariationOverride({
      variationId,
      patch: {
        pickupPrice: sanitizeNonNegativeNumber(value),
      },
    });
  };

  const handleVariationDisplayTextChange = ({
    variationId,
    value,
  }: {
    variationId: string;
    value: string;
  }) => {
    upsertVariationOverride({
      variationId,
      patch: {
        displayText: value,
      },
    });
  };

  const loadMoreVariations = () => {
    if (!variationHasMore || fetchingVariations || loadingVariations) return;
    setVariationPage((prev) => prev + 1);
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

      <VariationSelectionSection
        title={t("assignTitle")}
        description={t("assignDescription")}
        icon={<SlidersHorizontal size={18} />}
        searchValue={variationSearch}
        onSearchChange={setVariationSearch}
        searchPlaceholder={t("searchPlaceholder")}
        loading={
          (loadingVariations || fetchingVariations) &&
          variationOptions.length === 0
        }
        loadingMore={variationPage > 1 && fetchingVariations}
        hasMore={variationHasMore}
        onLoadMore={loadMoreVariations}
        items={variationOptions}
        selectedIds={selectedVariationIds}
        selectedVariations={selectedVariations}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
        onToggle={toggleVariation}
        onClear={clearVariations}
        getPriceValue={getVariationPrice}
        getPickupPriceValue={getVariationPickupPrice}
        getDisplayTextValue={getVariationDisplayText}
        onPriceChange={handleVariationPriceChange}
        onPickupPriceChange={handleVariationPickupPriceChange}
        onDisplayTextChange={handleVariationDisplayTextChange}
      />
    </div>
  );
});

StepThree.displayName = "StepThree";

export default StepThree;

type VariationSelectionSectionProps = {
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
  selectedVariations: SelectableEntity[];
  emptyTitle: string;
  emptyDescription: string;
  onToggle: (id: string) => void;
  onClear: () => void;
  getPriceValue: (variationId: string) => string;
  getPickupPriceValue: (variationId: string) => string;
  getDisplayTextValue: (variationId: string) => string;
  onPriceChange: (payload: { variationId: string; value: string }) => void;
  onPickupPriceChange: (payload: { variationId: string; value: string }) => void;
  onDisplayTextChange: (payload: { variationId: string; value: string }) => void;
};

function VariationSelectionSection({
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
  selectedVariations,
  emptyTitle,
  emptyDescription,
  onToggle,
  onClear,
  getPriceValue,
  getPickupPriceValue,
  getDisplayTextValue,
  onPriceChange,
  onPickupPriceChange,
  onDisplayTextChange,
}: VariationSelectionSectionProps) {
  const t = useTranslations("menu.itemModal.stepThree");
  const commonT = useTranslations("common");
  const selectedMap = useMemo(() => {
    const map = new Map<string, SelectableEntity>();

    selectedVariations.forEach((item) => {
      if (item?.id) map.set(String(item.id), item);
    });

    return map;
  }, [selectedVariations]);

  const renderItems = useMemo(() => {
    const selectedIdSet = new Set(selectedIds.map((id) => String(id)));
    const itemMap = new Map<string, SelectableEntity>();

    items.forEach((item) => {
      const id = String(item?.id || "");
      if (!id) return;
      itemMap.set(id, item);
    });

    const pinnedSelectedItems = selectedIds
      .map((id) => {
        const key = String(id);
        const selectedSnapshot = selectedMap.get(key);
        const liveItem = itemMap.get(key);

        if (!selectedSnapshot && !liveItem) return null;

        return {
          ...selectedSnapshot,
          ...liveItem,
          id: key,
          name: liveItem?.name || selectedSnapshot?.name || t("selectedFallback", { id: key }),
        } as SelectableEntity;
      })
      .filter(Boolean) as SelectableEntity[];

    const unselectedItems = items.filter((item) => {
      const id = String(item?.id || "");
      return id && !selectedIdSet.has(id);
    });

    return [...pinnedSelectedItems, ...unselectedItems];
  }, [items, selectedIds, selectedMap, t]);

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
            const displayText = getDisplayTextValue(String(id));

            return (
              <button
                key={id}
                type="button"
                onClick={() => onToggle(String(id))}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10"
              >
                <span className="max-w-[220px] truncate">
                  {displayText || item?.name || t("selectedFallback", { id })}
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
        ) : renderItems.length === 0 ? (
          <div className="flex min-h-[170px] flex-col items-center justify-center rounded-[14px] border border-dashed border-gray-200 bg-white p-6 text-center">
            <p className="text-sm font-semibold text-gray-900">{emptyTitle}</p>
            <p className="mt-1 max-w-[320px] text-sm text-gray-500">
              {emptyDescription}
            </p>
          </div>
        ) : (
          <div
            className="grid max-h-[520px] gap-3 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin]"
            onScroll={handleScroll}
          >
            {renderItems.map((item) => {
              const id = String(item?.id || "");
              const selected = selectedIds.includes(id);

              if (!id) return null;

              return (
                <div
                  key={id}
                  className={`w-full min-w-0 rounded-[16px] border bg-white p-4 transition ${
                    selected
                      ? "border-primary shadow-sm ring-2 ring-primary/10"
                      : "border-gray-100 hover:border-primary/30 hover:shadow-sm"
                  }`}
                >
                  <div className="flex min-w-0 flex-col gap-4">
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start">
                      <button
                        type="button"
                        onClick={() => onToggle(id)}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      >
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

                            {!selected ? (
                              item?.isActive === false ? (
                                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                                  {commonT("inactive")}
                                </span>
                              ) : (
                                <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                  {commonT("active")}
                                </span>
                              )
                            ) : (
                              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                {t("configured")}
                              </span>
                            )}
                          </div>

                          {item?.description ? (
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                      </button>
                    </div>

               {selected ? (
  <div className="mt-4 rounded-[16px] border border-gray-100 bg-[#FAFAFA] p-4">
    <div className="mb-4">
      <p className="text-sm font-semibold text-gray-900">
        {t("pricingDisplay")}
      </p>

      <p className="mt-1 text-xs leading-5 text-gray-500">
        {t("pricingDisplayDescription")}
      </p>
    </div>

    <div className="space-y-4">
      {/* DISPLAY TEXT FULL WIDTH */}
      <div className="min-w-0 space-y-1.5">
        <label className="block text-xs font-medium text-gray-600">
          {t("displayText")}
        </label>

        <Input
          value={getDisplayTextValue(id)}
          onChange={(event) =>
            onDisplayTextChange({
              variationId: id,
              value: event.target.value,
            })
          }
          onClick={(event) => event.stopPropagation()}
          placeholder={t("displayTextPlaceholder")}
          className="h-[42px] w-full rounded-[12px] border-gray-200 bg-white text-sm focus:border-primary focus:ring-primary/15"
        />
      </div>

      {/* PRICE FIELDS RESPONSIVE */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0 space-y-1.5">
          <label className="block text-xs font-medium text-gray-600">
            {commonT("price")}
          </label>

          <Input
            type="number"
            min={0}
            value={getPriceValue(id)}
            onKeyDown={blockInvalidNumberKeys}
            onPaste={blockNegativeNumberPaste}
            onChange={(event) =>
              onPriceChange({
                variationId: id,
                value: event.target.value,
              })
            }
            onClick={(event) => event.stopPropagation()}
            placeholder="0"
            className="h-[42px] w-full rounded-[12px] border-gray-200 bg-white text-sm focus:border-primary focus:ring-primary/15"
          />
        </div>

        <div className="min-w-0 space-y-1.5">
          <label className="block text-xs font-medium text-gray-600">
            {t("pickupPrice")}
          </label>

          <Input
            type="number"
            min={0}
            value={getPickupPriceValue(id)}
            onKeyDown={blockInvalidNumberKeys}
            onPaste={blockNegativeNumberPaste}
            onChange={(event) =>
              onPickupPriceChange({
                variationId: id,
                value: event.target.value,
              })
            }
            onClick={(event) => event.stopPropagation()}
            placeholder={commonT("optional")}
            className="h-[42px] w-full rounded-[12px] border-gray-200 bg-white text-sm focus:border-primary focus:ring-primary/15"
          />

          <p className="text-[11px] leading-4 text-gray-500">
            {t("pickupPriceHelp")}
          </p>
        </div>
      </div>
    </div>
  </div>
) : null}
                  </div>
                </div>
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
