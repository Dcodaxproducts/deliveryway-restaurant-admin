"use client";

import Image from "next/image";
import { Loader2, Minus, Plus, ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useHttpClient } from "@/hooks/useHttpClient";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useGetBranches } from "@/hooks/useBranches";
import AsyncSelect from "@/components/ui/AsyncSelect";
import { useTranslations } from "next-intl";

interface AddToCartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
}

type ItemPriceOverride = {
  id?: string;
  menuItemId?: string | null;
  modifierId?: string | null;
  variationId?: string | null;
  price?: string | number | null;
  priceDelta?: string | number | null;
  modifier?: Modifier;
};

type VariationPriceOverride = {
  id?: string;
  menuItemId?: string | null;
  variationId?: string | null;
  modifierId?: string | null;
  price?: string | number | null;
  pickupPrice?: string | number | null;
  displayText?: string | null;
  priceDelta?: string | number | null;
  modifier?: Modifier;
  variation?: any;
  modifierPriceOverrides?: VariationPriceOverride[];
};

type MenuVariation = {
  id: string;
  categoryId?: string;
  name: string;
  description?: string | null;
  price?: string | number;
  pickupPrice?: string | number | null;
  displayText?: string | null;
  sortOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
  modifierPriceOverrides?: VariationPriceOverride[];
  itemPriceOverrides?: VariationPriceOverride[];
};

type Modifier = {
  id: string;
  modifierGroupId?: string;
  restaurantId?: string;
  name: string;
  description?: string | null;
  priceDelta?: string | number;
  sortOrder?: number;
  isActive?: boolean;
  itemPriceOverrides?: ItemPriceOverride[];
  variationPriceOverrides?: VariationPriceOverride[];
};

type SelectedModifier = Modifier & {
  selectedQuantity: number;
};

type RawModifierLink = {
  id?: string;
  modifierGroupId?: string;
  modifierId?: string;
  sortOrder?: number;
  modifier?: Modifier;
};

type ModifierGroup = {
  id: string;
  name: string;
  description?: string;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  modifiers?: Modifier[];
  modifierLinks?: RawModifierLink[];
};

type ModifierLink = {
  id: string;
  variationId?: string | null;
  sortOrder?: number;
  modifierGroup: ModifierGroup;
};

type SelectedModifiersMap = Record<string, SelectedModifier[]>;

type VariationOption = {
  id: string;
  label: string;
  price: number;
  variation: MenuVariation | null;
  description?: string | null;
};

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMoney = (value: unknown) => `$${toNumber(value, 0).toFixed(2)}`;

const hasText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text !== "" && text.toLowerCase() !== "null";
};

const normalizeArray = (value: any): any[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [];
};

const normalizeApiList = (res: any) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res)) return res;
  return [];
};

const sortBySortOrder = <T extends { sortOrder?: number }>(items: T[]) => {
  return [...items].sort(
    (a, b) => toNumber(a?.sortOrder, 0) - toNumber(b?.sortOrder, 0),
  );
};

const getId = (value: any) => {
  if (value === undefined || value === null) return "";
  return String(value);
};

const getOverrideAmount = (
  override?: VariationPriceOverride | ItemPriceOverride | null,
) => {
  if (!override) return null;

  if (override.priceDelta !== undefined && override.priceDelta !== null) {
    return toNumber(override.priceDelta, 0);
  }

  if (override.price !== undefined && override.price !== null) {
    return toNumber(override.price, 0);
  }

  return null;
};

const getOverrideMenuItemId = (override: any) =>
  getId(override?.menuItemId || override?.menuItem?.id);

const getOverrideVariationId = (override: any) =>
  getId(override?.variationId || override?.variation?.id);

const getOverrideModifierId = (override: any) =>
  getId(override?.modifierId || override?.modifier?.id);

const isGenericMenuItemOverride = (override: any) => {
  const value = override?.menuItemId;
  return value === null || value === undefined || value === "";
};

const findBestItemPriceOverride = ({
  overrides,
  menuItemId,
  variationId,
}: {
  overrides?: any[];
  menuItemId?: string;
  variationId?: string;
}) => {
  if (!variationId || !Array.isArray(overrides)) return null;

  const matching = overrides.filter((override) => {
    return String(getOverrideVariationId(override)) === String(variationId);
  });

  if (!matching.length) return null;

  if (menuItemId) {
    const itemSpecific = matching.find(
      (override) => getOverrideMenuItemId(override) === String(menuItemId),
    );

    if (itemSpecific) return itemSpecific;
  }

  return matching.find(isGenericMenuItemOverride) || matching[0];
};

const findBestModifierOverride = ({
  overrides,
  modifierId,
  menuItemId,
  variationId,
}: {
  overrides?: any[];
  modifierId?: string;
  menuItemId?: string;
  variationId?: string;
}) => {
  if (!modifierId || !Array.isArray(overrides)) return null;

  const normalizedModifierId = String(modifierId);
  const normalizedMenuItemId = menuItemId ? String(menuItemId) : "";
  const normalizedVariationId = variationId ? String(variationId) : "";

  const matching = overrides.filter((override) => {
    return getOverrideModifierId(override) === normalizedModifierId;
  });

  if (!matching.length) return null;

  const isItemSpecific = (override: any) => {
    if (!normalizedMenuItemId) return false;
    return getOverrideMenuItemId(override) === normalizedMenuItemId;
  };

  const isExactVariation = (override: any) => {
    if (!normalizedVariationId) return false;
    return getOverrideVariationId(override) === normalizedVariationId;
  };

  const hasNoVariation = (override: any) => !getOverrideVariationId(override);

  if (normalizedVariationId) {
    const exactVariationMatches = matching.filter(isExactVariation);

    if (normalizedMenuItemId) {
      const exactItemVariation = exactVariationMatches.find(isItemSpecific);
      if (exactItemVariation) return exactItemVariation;
    }

    const exactGenericVariation = exactVariationMatches.find(
      isGenericMenuItemOverride,
    );
    if (exactGenericVariation) return exactGenericVariation;

    if (exactVariationMatches[0]) return exactVariationMatches[0];

    const fallbackWithoutVariation = matching.filter(hasNoVariation);

    if (normalizedMenuItemId) {
      const itemFallback = fallbackWithoutVariation.find(isItemSpecific);
      if (itemFallback) return itemFallback;
    }

    const genericFallback = fallbackWithoutVariation.find(
      isGenericMenuItemOverride,
    );
    if (genericFallback) return genericFallback;

    return fallbackWithoutVariation[0] || null;
  }

  if (normalizedMenuItemId) {
    const itemSpecific = matching.find(isItemSpecific);
    if (itemSpecific) return itemSpecific;
  }

  const generic = matching.find(isGenericMenuItemOverride);

  return generic || matching[0];
};

const getVariationDisplayPrice = (menuItem: any, variation: any) => {
  const variationId = String(variation?.id || variation?.variationId || "");

  const itemOverride =
    findBestItemPriceOverride({
      overrides: menuItem?.variationPriceOverrides,
      menuItemId: menuItem?.id,
      variationId,
    }) ||
    findBestItemPriceOverride({
      overrides: variation?.itemPriceOverrides,
      menuItemId: menuItem?.id,
      variationId,
    });

  if (itemOverride?.price !== undefined && itemOverride?.price !== null) {
    return itemOverride.price;
  }

  return variation?.price ?? menuItem?.basePrice ?? menuItem?.price ?? 0;
};

const getVariationDisplayText = (menuItem: any, variation: any) => {
  const variationId = String(variation?.id || variation?.variationId || "");

  const itemOverride =
    findBestItemPriceOverride({
      overrides: menuItem?.variationPriceOverrides,
      menuItemId: menuItem?.id,
      variationId,
    }) ||
    findBestItemPriceOverride({
      overrides: variation?.itemPriceOverrides,
      menuItemId: menuItem?.id,
      variationId,
    });

  return itemOverride?.displayText ?? variation?.displayText ?? "";
};

const normalizeModifier = (
  raw: any,
  extra?: Partial<Modifier>,
): Modifier | null => {
  if (!raw?.id) return null;
  if (raw?.isActive === false) return null;

  return {
    id: String(raw.id),
    modifierGroupId: raw?.modifierGroupId,
    restaurantId: raw?.restaurantId,
    name: String(raw?.name || ""),
    description: raw?.description ?? "",
    priceDelta: raw?.priceDelta ?? 0,
    sortOrder: toNumber(raw?.sortOrder, 0),
    isActive: raw?.isActive !== false,
    itemPriceOverrides: Array.isArray(raw?.itemPriceOverrides)
      ? raw.itemPriceOverrides
      : [],
    variationPriceOverrides: Array.isArray(raw?.variationPriceOverrides)
      ? raw.variationPriceOverrides
      : [],
    ...extra,
  };
};

const getAllRawVariationSources = (menuItem: any) => {
  const fromVariationPriceOverrides = normalizeArray(
    menuItem?.variationPriceOverrides,
  )
    .map((override) => ({
      ...(override?.variation || {}),
      id: override?.variationId || override?.variation?.id,
      price: override?.price ?? override?.variation?.price,
      pickupPrice: override?.pickupPrice ?? override?.variation?.pickupPrice,
      displayText: override?.displayText ?? override?.variation?.displayText,
      itemPriceOverrides: [
        ...normalizeArray(override?.variation?.itemPriceOverrides),
        override,
      ],
      modifierPriceOverrides: [
        ...normalizeArray(override?.variation?.modifierPriceOverrides),
        ...normalizeArray(override?.modifierPriceOverrides),
      ],
    }))
    .filter((variation) => variation?.id);

  const fromCategoryVariationLinks = normalizeArray(
    menuItem?.category?.variationLinks,
  )
    .map((link) => link?.variation)
    .filter(Boolean);

  return [
    ...normalizeArray(menuItem?.variations),
    ...fromVariationPriceOverrides,
    ...normalizeArray(menuItem?.category?.variations),
    ...fromCategoryVariationLinks,
  ];
};

const getItemVariations = (menuItem: any): MenuVariation[] => {
  if (!menuItem) return [];

  const rawVariations = getAllRawVariationSources(menuItem);
  const deduped = new Map<string, MenuVariation>();

  for (const raw of rawVariations) {
    if (!raw?.id) continue;
    if (raw?.isActive === false) continue;

    const id = String(raw.id);

    if (deduped.has(id)) continue;

    deduped.set(id, {
      id,
      categoryId: raw?.categoryId,
      name: String(raw?.name || ""),
      description: raw?.description ?? "",
      price: getVariationDisplayPrice(menuItem, raw),
      pickupPrice: raw?.pickupPrice ?? null,
      displayText: getVariationDisplayText(menuItem, raw),
      sortOrder: toNumber(raw?.sortOrder, 0),
      isDefault: Boolean(raw?.isDefault),
      isActive: raw?.isActive !== false,
      modifierPriceOverrides: Array.isArray(raw?.modifierPriceOverrides)
        ? raw.modifierPriceOverrides
        : [],
      itemPriceOverrides: Array.isArray(raw?.itemPriceOverrides)
        ? raw.itemPriceOverrides
        : [],
    });
  }

  return sortBySortOrder(Array.from(deduped.values()));
};

const getNormalizedModifiersFromGroup = (group: any): Modifier[] => {
  const directModifiers = Array.isArray(group?.modifiers)
    ? group.modifiers
    : [];

  const modifiersFromLinks = Array.isArray(group?.modifierLinks)
    ? group.modifierLinks.map((link: any) => link?.modifier).filter(Boolean)
    : [];

  const rawModifiers = [...directModifiers, ...modifiersFromLinks];
  const deduped = new Map<string, Modifier>();

  for (const raw of rawModifiers) {
    const normalized = normalizeModifier(raw);
    if (!normalized) continue;

    if (!deduped.has(normalized.id)) {
      deduped.set(normalized.id, normalized);
    }
  }

  return sortBySortOrder(Array.from(deduped.values()));
};

const normalizeGroup = (group: any): ModifierGroup | null => {
  if (!group?.id) return null;
  if (group?.isActive === false) return null;

  return {
    id: String(group.id),
    name: String(group?.name || ""),
    description: group?.description || "",
    minSelect: group?.minSelect,
    maxSelect: group?.maxSelect,
    isRequired: Boolean(group?.isRequired),
    sortOrder: toNumber(group?.sortOrder, 0),
    isActive: group?.isActive !== false,
    modifiers: getNormalizedModifiersFromGroup(group),
    modifierLinks: Array.isArray(group?.modifierLinks)
      ? group.modifierLinks
      : [],
  };
};

const getStandaloneItemModifiers = (
  menuItem: any,
  linkedModifierIds: Set<string>,
) => {
  const rawOverrides = normalizeArray(menuItem?.modifierPriceOverrides);

  const modifiersFromOverrides = rawOverrides
    .map((override) => {
      const rawModifier = override?.modifier || {
        id: override?.modifierId,
        name: override?.name || "Modifier",
        priceDelta: override?.priceDelta ?? 0,
      };

      return normalizeModifier(rawModifier, {
        itemPriceOverrides: [
          ...normalizeArray(rawModifier?.itemPriceOverrides),
          {
            id: override?.id,
            menuItemId: override?.menuItemId ?? menuItem?.id,
            modifierId: override?.modifierId ?? rawModifier?.id,
            price: override?.price,
            priceDelta: override?.priceDelta,
          },
        ],
        variationPriceOverrides: Array.isArray(rawModifier?.variationPriceOverrides)
          ? rawModifier.variationPriceOverrides
          : [],
      });
    })
    .filter(Boolean) as Modifier[];

  const rawDirectModifiers = normalizeArray(menuItem?.modifiers)
    .map((modifier) => normalizeModifier(modifier))
    .filter(Boolean) as Modifier[];

  const deduped = new Map<string, Modifier>();

  [...modifiersFromOverrides, ...rawDirectModifiers].forEach((modifier) => {
    if (!modifier?.id) return;
    if (linkedModifierIds.has(String(modifier.id))) return;
    deduped.set(String(modifier.id), modifier);
  });

  return sortBySortOrder(Array.from(deduped.values()));
};

const getItemModifierLinks = (menuItem: any): ModifierLink[] => {
  if (!menuItem) return [];

  const rawDirectLinks = [
    ...normalizeArray(menuItem?.modifierLinks),
    ...normalizeArray(menuItem?.category?.modifierLinks),
  ];

  const rawModifierGroups = [
    ...normalizeArray(menuItem?.modifierGroups),
    ...normalizeArray(menuItem?.categoryModifierGroups).map(
      (entry) => entry?.modifierGroup || entry,
    ),
    ...normalizeArray(menuItem?.category?.modifierGroups),
    ...normalizeArray(menuItem?.category?.categoryModifierGroups).map(
      (entry) => entry?.modifierGroup || entry,
    ),
  ];

  const normalizedDirectLinks: ModifierLink[] = rawDirectLinks
    .map((link: any, index: number) => {
      const normalizedGroup = normalizeGroup(link?.modifierGroup);
      if (!normalizedGroup) return null;

      return {
        id:
          String(link?.id || "") ||
          `modifier-link-${normalizedGroup.id}-${index}`,
        variationId: link?.variationId ? String(link.variationId) : null,
        sortOrder: toNumber(
          link?.sortOrder ?? normalizedGroup?.sortOrder ?? 0,
          0,
        ),
        modifierGroup: normalizedGroup,
      };
    })
    .filter(Boolean) as ModifierLink[];

  const normalizedModifierGroups: ModifierLink[] = rawModifierGroups
    .map((group: any, index: number) => {
      const normalizedGroup = normalizeGroup(group);
      if (!normalizedGroup) return null;

      return {
        id: `group-${normalizedGroup.id}-${index}`,
        variationId: null,
        sortOrder: toNumber(normalizedGroup?.sortOrder, 0),
        modifierGroup: normalizedGroup,
      };
    })
    .filter(Boolean) as ModifierLink[];

  const linkedModifierIds = new Set<string>();

  [...normalizedDirectLinks, ...normalizedModifierGroups].forEach((link) => {
    normalizeArray(link?.modifierGroup?.modifiers).forEach((modifier) => {
      if (modifier?.id) linkedModifierIds.add(String(modifier.id));
    });
  });

  const standaloneModifiers = getStandaloneItemModifiers(
    menuItem,
    linkedModifierIds,
  );

  const standaloneLink: ModifierLink | null = standaloneModifiers.length
    ? {
        id: `standalone-modifiers-${menuItem.id}`,
        variationId: null,
        sortOrder: 999,
        modifierGroup: {
          id: `standalone-modifiers-${menuItem.id}`,
          name: "Add-ons",
          description: "Available add-ons for this item.",
          minSelect: 0,
          maxSelect: undefined,
          isRequired: false,
          sortOrder: 999,
          isActive: true,
          modifiers: standaloneModifiers,
          modifierLinks: [],
        },
      }
    : null;

  const deduped = new Map<string, ModifierLink>();

  for (const link of [
    ...normalizedDirectLinks,
    ...normalizedModifierGroups,
    ...(standaloneLink ? [standaloneLink] : []),
  ]) {
    const groupId = String(link?.modifierGroup?.id || "");
    if (!groupId) continue;

    const key = `${String(link?.variationId || "common")}::${groupId}`;

    if (!deduped.has(key)) {
      deduped.set(key, link);
    }
  }

  return sortBySortOrder(Array.from(deduped.values()));
};

const getVisibleModifierLinks = (
  menuItem: any,
  variation?: MenuVariation | null,
) => {
  const links = getItemModifierLinks(menuItem);
  const hasVariations = getItemVariations(menuItem).length > 0;

  return links.filter((link) => {
    const groupName = String(link?.modifierGroup?.name || "")
      .trim()
      .toLowerCase();

    if (hasVariations && groupName === "size") {
      return false;
    }

    if (link?.variationId) {
      return String(link.variationId) === String(variation?.id || "");
    }

    return true;
  });
};

const getVariationScopedModifierOverrides = (
  menuItem: any,
  variation?: MenuVariation | null,
) => {
  if (!menuItem || !variation?.id) return [];

  const menuItemId = String(menuItem.id || "");
  const variationId = String(variation.id || "");
  const overrides: any[] = [];

  normalizeArray(menuItem?.variationPriceOverrides)
    .filter((entry) => getOverrideVariationId(entry) === variationId)
    .forEach((entry) => {
      normalizeArray(entry?.modifierPriceOverrides).forEach(
        (modifierOverride) => {
          overrides.push({
            ...modifierOverride,
            menuItemId: entry?.menuItemId ?? menuItemId,
            variationId,
          });
        },
      );

      normalizeArray(entry?.variation?.modifierPriceOverrides).forEach(
        (modifierOverride) => {
          overrides.push({
            ...modifierOverride,
            variationId:
              getOverrideVariationId(modifierOverride) || variationId,
          });
        },
      );
    });

  normalizeArray(variation?.modifierPriceOverrides).forEach(
    (modifierOverride) => {
      overrides.push({
        ...modifierOverride,
        variationId: getOverrideVariationId(modifierOverride) || variationId,
      });
    },
  );

  return overrides;
};

const getModifierEffectivePrice = (
  modifier: Modifier,
  menuItem: any,
  variation?: MenuVariation | null,
) => {
  const menuItemId = String(menuItem?.id || "");
  const variationId = String(variation?.id || "");
  const modifierId = String(modifier?.id || "");

  if (variationId) {
    const variationScopedOverride = findBestModifierOverride({
      overrides: getVariationScopedModifierOverrides(menuItem, variation),
      modifierId,
      menuItemId,
      variationId,
    });

    const variationScopedAmount = getOverrideAmount(variationScopedOverride);

    if (variationScopedAmount !== null) {
      return variationScopedAmount;
    }

    const modifierSideOverride = findBestModifierOverride({
      overrides: modifier?.variationPriceOverrides,
      modifierId,
      menuItemId,
      variationId,
    });

    const modifierSideAmount = getOverrideAmount(modifierSideOverride);

    if (modifierSideAmount !== null) {
      return modifierSideAmount;
    }
  }

  const topLevelItemOverride = findBestModifierOverride({
    overrides: menuItem?.modifierPriceOverrides,
    modifierId,
    menuItemId,
  });

  const topLevelItemAmount = getOverrideAmount(topLevelItemOverride);

  if (topLevelItemAmount !== null) {
    return topLevelItemAmount;
  }

  const modifierItemOverride = findBestModifierOverride({
    overrides: modifier?.itemPriceOverrides,
    modifierId,
    menuItemId,
  });

  const modifierItemAmount = getOverrideAmount(modifierItemOverride);

  if (modifierItemAmount !== null) {
    return modifierItemAmount;
  }

  return toNumber(modifier?.priceDelta, 0);
};

const getGroupValidation = (group: ModifierGroup) => {
  const rawMin = toNumber(group?.minSelect, 0);
  const rawMax =
    group?.maxSelect !== undefined && group?.maxSelect !== null
      ? toNumber(group.maxSelect, 0)
      : undefined;

  const isRequired = Boolean(group?.isRequired);

  return {
    minSelect: Math.max(isRequired ? 1 : 0, rawMin),
    maxSelect: rawMax && rawMax > 0 ? rawMax : undefined,
    isRequired,
  };
};

const getApiErrorMessage = (res: any, fallback = "Failed to add to cart") => {
  if (!res) return fallback;

  const candidates = [
    res?.message,
    res?.error?.message,
    typeof res?.error === "string" ? res.error : "",
    res?.data?.message,
    res?.data?.error?.message,
    typeof res?.data?.error === "string" ? res.data.error : "",
  ];

  const message = candidates.find((entry) => {
    return typeof entry === "string" && entry.trim();
  });

  return message || fallback;
};

const isBranchCartConflictError = (res: any) => {
  const message = getApiErrorMessage(res, "").toLowerCase();

  return (
    message.includes("cart already contains items from another branch") ||
    message.includes("cart contain") ||
    message.includes("another branch")
  );
};

export default function AddToCartModal({
  open,
  onOpenChange,
  item,
}: AddToCartModalProps) {
  const t = useTranslations("pos.addToCart");
  const { token, user } = useAuth();
  const restaurantId = user?.restaurantId ?? undefined;
  const { post, get, del } = useHttpClient(token);

  const [quantity, setQuantity] = useState(1);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("base");
  const [selectedModifiers, setSelectedModifiers] =
    useState<SelectedModifiersMap>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: branchesData } = useGetBranches({
    restaurantId,
  });

  const variations = useMemo(() => getItemVariations(item), [item]);

  const options = useMemo<VariationOption[]>(() => {
    const baseOption: VariationOption = {
      id: "base",
      label: t("base"),
      price: toNumber(item?.basePrice ?? item?.unitPrice ?? item?.price, 0),
      variation: null,
      description: item?.description || null,
    };

    const variationOptions = variations.map((variation) => ({
      id: variation.id,
      label: variation.displayText || variation.name,
      price: toNumber(variation.price, 0),
      variation,
      description: variation.description || null,
    }));

    return [baseOption, ...variationOptions];
  }, [item, t, variations]);

  const selectedOption = useMemo(() => {
    return (
      options.find((option) => option.id === selectedOptionId) || options[0]
    );
  }, [options, selectedOptionId]);

  const selectedVariation = selectedOption?.variation || null;

  const visibleModifierLinks = useMemo(() => {
    return getVisibleModifierLinks(item, selectedVariation);
  }, [item, selectedVariation]);

  const image =
    item?.imageUrl && item.imageUrl.startsWith("http")
      ? item.imageUrl
      : "/burgerTwo.jpg";

  const modifiersTotal = useMemo(() => {
    return Object.values(selectedModifiers)
      .flat()
      .reduce((acc, modifier) => {
        return acc + getModifierEffectivePrice(modifier, item, selectedVariation);
      }, 0);
  }, [selectedModifiers, item, selectedVariation]);

  const unitPrice = toNumber(selectedOption?.price, 0) + modifiersTotal;
  const total = unitPrice * quantity;

  useEffect(() => {
    if (!open) return;

    setQuantity(1);
    setSelectedOptionId("base");
    setSelectedModifiers({});
    setSelectedCustomer(null);
  }, [open, item?.id]);

  useEffect(() => {
    if (!options.length) return;

    const selectedStillExists = options.some(
      (option) => option.id === selectedOptionId,
    );

    if (!selectedStillExists) {
      setSelectedOptionId(options[0].id);
    }
  }, [options, selectedOptionId]);

  useEffect(() => {
    const visibleGroupIds = new Set(
      visibleModifierLinks.map((link) => String(link?.modifierGroup?.id || "")),
    );

    setSelectedModifiers((prev) => {
      const next: SelectedModifiersMap = {};

      for (const [groupId, modifiers] of Object.entries(prev || {})) {
        if (visibleGroupIds.has(String(groupId))) {
          next[groupId] = modifiers;
        }
      }

      return next;
    });
  }, [visibleModifierLinks]);

  const fetchBranches = async ({ search }: any) => {
    if (!restaurantId) return { data: [] };

    const list = normalizeApiList(branchesData);
    const normalizedSearch = String(search || "").toLowerCase();

    return {
      data: list.filter((branch: any) =>
        String(branch?.name || "")
          .toLowerCase()
          .includes(normalizedSearch),
      ),
    };
  };

  const fetchCustomers = async ({ search, page }: any) => {
    if (!restaurantId) return { data: [], meta: {} };

    const params = new URLSearchParams({
      restaurantId: String(restaurantId),
      page: String(page || 1),
    });

    if (search) {
      params.set("search", String(search));
    }

    const res = await get(`/v1/admin/users/customers?${params.toString()}`);
    const raw = normalizeApiList(res);

    return {
      data: raw.map((customer: any) => ({
        ...customer,
        fullName:
          `${customer?.profile?.firstName || ""} ${customer?.profile?.lastName || ""}`.trim() ||
          customer?.email ||
          t("customer"),
      })),
      meta: res?.data?.meta || res?.meta,
    };
  };

  const handleModifierToggle = (group: ModifierGroup, modifier: Modifier) => {
    const groupId = String(group.id);
    const { minSelect, maxSelect, isRequired } = getGroupValidation(group);

    setSelectedModifiers((prev) => {
      const current = prev[groupId] || [];
      const alreadySelected = current.some(
        (selected) => selected.id === modifier.id,
      );

      if (maxSelect === 1) {
        if (alreadySelected && !isRequired) {
          const next = { ...prev };
          delete next[groupId];
          return next;
        }

        return {
          ...prev,
          [groupId]: [{ ...modifier, selectedQuantity: 1 }],
        };
      }

      if (alreadySelected) {
        if (minSelect > 0 && current.length <= minSelect) {
          toast.error(
            t("toast.requiresAtLeast", {
              group: group?.name || t("thisGroup"),
              count: minSelect,
            }),
          );
          return prev;
        }

        const remaining = current.filter(
          (selected) => selected.id !== modifier.id,
        );
        const next = { ...prev };

        if (remaining.length) {
          next[groupId] = remaining;
        } else {
          delete next[groupId];
        }

        return next;
      }

      if (maxSelect && current.length >= maxSelect) {
        toast.error(
          t("toast.selectUpTo", {
            count: maxSelect,
            group: group?.name || t("thisGroup"),
          }),
        );
        return prev;
      }

      return {
        ...prev,
        [groupId]: [...current, { ...modifier, selectedQuantity: 1 }],
      };
    });
  };

  const validateSelections = () => {
    for (const link of visibleModifierLinks) {
      const group = link?.modifierGroup;
      const groupId = String(group?.id || "");
      const selected = selectedModifiers[groupId] || [];
      const { minSelect, maxSelect } = getGroupValidation(group);

      if (minSelect > 0 && selected.length < minSelect) {
        toast.error(
          t("toast.requiresAtLeast", {
            group: group?.name || t("thisGroup"),
            count: minSelect,
          }),
        );
        return false;
      }

      if (maxSelect && selected.length > maxSelect) {
        toast.error(
          t("toast.allowsAtMost", {
            group: group?.name || t("thisGroup"),
            count: maxSelect,
          }),
        );
        return false;
      }
    }

    return true;
  };

  const buildModifiersPayload = () => {
    return Object.values(selectedModifiers)
      .flat()
      .map((modifier) => ({
        modifierId: modifier.id,
        quantity: 1,
      }));
  };

  const buildPayload = () => {
    const payload: any = {
      menuItemId: item.id,
      quantity,
      branchId: selectedBranch?.id,
      note: "",
      modifiers: buildModifiersPayload(),
    };

    if (selectedVariation?.id) {
      payload.variationId = selectedVariation.id;
    }

    return payload;
  };

  const postCartItem = async () => {
    return post(
      `/v1/cart/items?customerId=${selectedCustomer?.id}`,
      buildPayload(),
    );
  };

  const handleAddToCart = async () => {
    if (!selectedCustomer?.id) {
      toast.error(t("toast.selectCustomer"));
      return;
    }

    if (!selectedBranch?.id) {
      toast.error(t("toast.selectBranch"));
      return;
    }

    if (!validateSelections()) {
      return;
    }

    try {
      setIsSubmitting(true);

      let res: any = await postCartItem();

      if (!res || res?.error) {
        if (isBranchCartConflictError(res)) {
          const clearRes = await del(
            `/v1/cart?customerId=${selectedCustomer.id}`,
          );

          if (!clearRes || clearRes?.error) {
            toast.error(
              getApiErrorMessage(
                clearRes,
                t("toast.failedClearBeforeAdd"),
              ),
            );
            return;
          }

          res = await postCartItem();
        }
      }

      if (!res || res?.error) {
        toast.error(getApiErrorMessage(res, t("toast.failedAddToCart")));
        return;
      }

      toast.success(t("toast.addedToCart"));

      localStorage.setItem("activeCustomerId", selectedCustomer.id);

      setQuantity(1);
      setSelectedCustomer(null);
      setSelectedModifiers({});
      onOpenChange(false);
      window.location.reload();
    } catch (err: any) {
      void err;
      toast.error(err?.message || t("toast.failedAddToCart"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderModifierGroups = () => {
    if (!visibleModifierLinks.length) return null;

    return (
      <div className="mt-6 space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {t("addOns")}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {t("addOnsDescription")}
          </p>
        </div>

        {visibleModifierLinks.map((link) => {
          const group = link.modifierGroup;
          const groupId = String(group?.id || "");
          const selectedInGroup = selectedModifiers[groupId] || [];
          const { minSelect, maxSelect, isRequired } = getGroupValidation(group);

          const groupModifiers = normalizeArray(group?.modifiers).filter(
            (modifier) => modifier?.isActive !== false,
          );

          if (!groupModifiers.length) return null;

          return (
            <div
              key={`${String(link?.variationId || "common")}-${groupId}`}
              className="rounded-2xl border border-gray-100 bg-white p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {String(group?.id || "").startsWith(
                      "standalone-modifiers-",
                    )
                      ? t("addOns")
                      : group?.name || t("options")}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {maxSelect === 1
                      ? isRequired || minSelect > 0
                        ? t("selectOneRequired")
                        : t("optionalSelectOne")
                      : maxSelect
                        ? minSelect > 0
                          ? t("selectRange", {
                              min: minSelect,
                              max: maxSelect,
                            })
                          : t("selectUpTo", { count: maxSelect })
                        : minSelect > 0
                          ? t("selectAtLeast", { count: minSelect })
                          : t("optional")}
                  </p>
                </div>

                <span className="shrink-0 text-xs font-medium text-gray-500">
                  {selectedInGroup.length}
                  {maxSelect ? ` / ${maxSelect}` : ""}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {groupModifiers.map((modifier: Modifier) => {
                  const checked = selectedInGroup.some(
                    (selected) => selected.id === modifier.id,
                  );

                  const disableBecauseMaxReached =
                    maxSelect !== 1 &&
                    !checked &&
                    !!maxSelect &&
                    selectedInGroup.length >= maxSelect;

                  const effectivePrice = getModifierEffectivePrice(
                    modifier,
                    item,
                    selectedVariation,
                  );

                  const inputType = maxSelect === 1 ? "radio" : "checkbox";

                  return (
                    <label
                      key={`${groupId}-${modifier.id}`}
                      className={`flex cursor-pointer items-start justify-between gap-3 rounded-xl px-3 py-3 text-sm transition ${
                        disableBecauseMaxReached
                          ? "bg-gray-100 opacity-70"
                          : checked
                            ? "bg-primary/5 ring-1 ring-primary/20"
                            : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-2">
                        <input
                          type={inputType}
                          name={`modifier-group-${groupId}`}
                          checked={checked}
                          disabled={disableBecauseMaxReached || isSubmitting}
                          onClick={(event) => {
                            if (
                              inputType === "radio" &&
                              checked &&
                              !isRequired
                            ) {
                              event.preventDefault();
                              handleModifierToggle(group, modifier);
                            }
                          }}
                          onChange={() => handleModifierToggle(group, modifier)}
                          className="mt-1 accent-[var(--primary)]"
                        />

                        <span className="min-w-0">
                          <span className="block truncate font-medium text-gray-900">
                            {modifier.name}
                          </span>

                          {modifier.description ? (
                            <span className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                              {modifier.description}
                            </span>
                          ) : null}
                        </span>
                      </div>

                      {effectivePrice > 0 ? (
                        <span className="shrink-0 font-semibold text-primary">
                          +{formatMoney(effectivePrice)}
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-[560px] overflow-auto rounded-2xl p-0">
        <div className="relative h-[190px] overflow-hidden bg-gray-100">
          <Image
            src={image}
            alt={item?.name || t("menuItem")}
            fill
            className="object-cover"
            unoptimized
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

          <div className="absolute bottom-4 left-5 right-5">
            <DialogHeader>
              <DialogTitle className="line-clamp-2 text-left text-2xl font-bold text-white">
                {item?.name}
              </DialogTitle>
            </DialogHeader>

            {hasText(item?.category?.name) ? (
              <span className="mt-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                {item.category.name}
              </span>
            ) : null}
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">{t("selectBranch")}</p>

              <AsyncSelect
                value={selectedBranch}
                onChange={setSelectedBranch}
                fetchOptions={fetchBranches}
                labelKey="name"
                valueKey="id"
                placeholder={t("selectBranchPlaceholder")}
                searchPlaceholder={t("searchPlaceholder")}
                noResultsText={t("noResultsFound")}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">{t("selectCustomer")}</p>

              <AsyncSelect
                value={selectedCustomer}
                onChange={setSelectedCustomer}
                fetchOptions={fetchCustomers}
                labelKey="fullName"
                valueKey="id"
                placeholder={t("selectCustomerPlaceholder")}
                searchPlaceholder={t("searchPlaceholder")}
                noResultsText={t("noResultsFound")}
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {t("variation")}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {t("variationDescription")}
                </p>
              </div>

              <span className="text-sm font-semibold text-primary">
                {formatMoney(toNumber(selectedOption?.price, 0))}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {options.map((option) => {
                const checked = option.id === selectedOptionId;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedOptionId(option.id)}
                    disabled={isSubmitting}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      checked
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-gray-200 bg-white hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            checked
                              ? "border-primary"
                              : "border-gray-300"
                          }`}
                        >
                          {checked ? (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          ) : null}
                        </span>

                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-gray-900">
                            {option.label}
                          </span>

                          {option.description ? (
                            <span className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                              {option.description}
                            </span>
                          ) : null}
                        </span>
                      </div>

                      <span className="shrink-0 text-sm font-semibold text-primary">
                        {formatMoney(option.price)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {renderModifierGroups()}

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-gray-50 p-4">
            <span className="text-sm font-semibold text-gray-900">
              {t("quantity")}
            </span>

            <div className="flex items-center rounded-full bg-white shadow-sm ring-1 ring-gray-100">
              <button
                type="button"
                onClick={() =>
                  setQuantity((current) => Math.max(1, current - 1))
                }
                disabled={isSubmitting}
                className="flex h-9 w-9 items-center justify-center text-gray-700 disabled:opacity-50"
              >
                <Minus size={15} />
              </button>

              <span className="min-w-8 px-2 text-center text-sm font-semibold text-gray-900">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => setQuantity((current) => current + 1)}
                disabled={isSubmitting}
                className="flex h-9 w-9 items-center justify-center text-gray-700 disabled:opacity-50"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
            <div>
              <p className="text-sm font-medium text-gray-500">{t("total")}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatMoney(total)}
              </p>

              {modifiersTotal > 0 ? (
                <p className="mt-1 text-xs text-gray-500">
                  {t("includesAddOns", {
                    amount: formatMoney(modifiersTotal),
                  })}
                </p>
              ) : null}
            </div>

            <Button
              className="h-12 rounded-full bg-primary px-6 text-white hover:bg-primary/90"
              onClick={handleAddToCart}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  {t("adding")}
                </>
              ) : (
                <>
                  <ShoppingCart size={16} className="mr-2" />
                  {t("addToCart")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
