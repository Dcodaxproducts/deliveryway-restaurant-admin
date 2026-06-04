"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PaginationSection from "@/components/common/pagination";
import ModifierCategoryInfiniteSelect from "@/components/pages/Menu/modifiers/components/ModifierCategoryInfiniteSelect";
import {
  useAttachModifierToGroup,
  useDetachModifierFromGroup,
  useModifierGroup,
} from "@/hooks/useModifierGroups";
import { useModifiers } from "@/hooks/useModifiers";
import {
  blockInvalidNumberKeys,
  blockNegativeNumberPaste,
  sanitizeNonNegativeNumber,
} from "@/lib/number-input";
import { getApiErrorMessage } from "@/lib/errors";
import type {
  ModifierGroup,
  ModifierGroupModifier,
} from "@/types/modifier-groups";
import type { Modifier } from "@/types/modifiers";
import { attachModifierToGroupSchema } from "@/validations/modifier-groups";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type ManageGroupModifiersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: ModifierGroup | null;
  restaurantId?: string;
};

const SHOW_DETACH_ACTION = false;

const formatPrice = (priceDelta?: string | number | null) => {
  const numeric = Number(priceDelta ?? 0);

  if (Number.isNaN(numeric)) return "0.00";

  return numeric.toFixed(2);
};

export function ManageGroupModifiersDialog({
  open,
  onOpenChange,
  group,
  restaurantId,
}: ManageGroupModifiersDialogProps) {
  const t = useTranslations("menu.modifierGroupsTable.manage");
  const commonT = useTranslations("common");
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sortOrders, setSortOrders] = useState<Record<string, string>>({});
  const [attachingModifierId, setAttachingModifierId] = useState<string | null>(null);
  const [detachingModifierId, setDetachingModifierId] = useState<string | null>(null);
  const [localAttachedModifiers, setLocalAttachedModifiers] = useState<
    ModifierGroupModifier[]
  >([]);
  const [hasLocalAttachmentChanges, setHasLocalAttachmentChanges] =
    useState(false);

  const groupId = group?.id;
  const {
    data: groupDetail,
    isFetching: isGroupFetching,
    refetch: refetchGroup,
  } = useModifierGroup(groupId, { restaurantId });
  const activeGroup = groupDetail ?? group;
  const initialGroupModifiers = useMemo(
    () => group?.modifiers ?? [],
    [group?.modifiers]
  );

  useEffect(() => {
    if (!open || hasLocalAttachmentChanges) return;

    setLocalAttachedModifiers(initialGroupModifiers);
    setHasLocalAttachmentChanges(false);
  }, [groupId, hasLocalAttachmentChanges, initialGroupModifiers, open]);

  useEffect(() => {
    if (!open || hasLocalAttachmentChanges) return;

    setLocalAttachedModifiers(activeGroup?.modifiers ?? []);
  }, [activeGroup?.modifiers, hasLocalAttachmentChanges, open]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
      setCategoryId("");
      setPage(1);
      setSortOrders({});
      setAttachingModifierId(null);
      setDetachingModifierId(null);
      setLocalAttachedModifiers([]);
      setHasLocalAttachmentChanges(false);
    }
  }, [open]);

  const {
    data: modifiersResponse,
    isLoading,
    isFetching,
    refetch,
  } = useModifiers({
    restaurantId,
    categoryId: categoryId || undefined,
    page,
    limit,
    search: debouncedSearch || undefined,
  });
  const { mutateAsync: attachModifier, isPending: isAttaching } =
    useAttachModifierToGroup();
  const { mutateAsync: detachModifier, isPending: isDetaching } =
    useDetachModifierFromGroup();

  const modifiers = useMemo(
    () => modifiersResponse?.data ?? [],
    [modifiersResponse?.data]
  );
  const attachedModifiers = useMemo(
    () => localAttachedModifiers,
    [localAttachedModifiers]
  );
  const attachedModifierIds = useMemo(
    () => new Set(attachedModifiers.map((modifier) => modifier.id)),
    [attachedModifiers]
  );

  const pagination = useMemo(() => {
    const source = modifiersResponse?.meta;
    const currentPage = Number(source?.page ?? page);
    const pageSize = Number(source?.limit ?? limit);
    const total = Number(source?.total ?? modifiers.length);
    const totalPages = Number(source?.totalPages ?? 1);

    return {
      page: currentPage,
      totalPages: totalPages || 1,
      total,
      limit: pageSize || limit,
      hasNext: source?.hasNext ?? currentPage < (totalPages || 1),
      hasPrevious: source?.hasPrevious ?? currentPage > 1,
    };
  }, [limit, modifiers.length, modifiersResponse?.meta, page]);

  const updateSortOrder = (modifierId: string, value: string) => {
    setSortOrders((previous) => ({
      ...previous,
      [modifierId]: sanitizeNonNegativeNumber(value),
    }));
  };

  const handleAttach = async (modifier: Modifier) => {
    if (!groupId) return;

    const sortOrder = sortOrders[modifier.id] ?? String(modifier.sortOrder ?? 0);
    const parsed = attachModifierToGroupSchema.safeParse({
      modifierId: modifier.id,
      sortOrder,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || t("invalidModifier"));
      return;
    }

    try {
      setAttachingModifierId(modifier.id);
      await attachModifier({
        groupId,
        modifierId: modifier.id,
        restaurantId,
        data: {
          sortOrder: parsed.data.sortOrder,
        },
      });
      setHasLocalAttachmentChanges(true);
      setLocalAttachedModifiers((previous) => {
        const nextModifier: ModifierGroupModifier = {
          id: modifier.id,
          name: modifier.name,
          priceDelta: modifier.priceDelta ?? null,
          sortOrder: parsed.data.sortOrder,
          category: modifier.category ?? null,
        };
        const existingIndex = previous.findIndex(
          (attachedModifier) => attachedModifier.id === modifier.id
        );

        if (existingIndex === -1) return [...previous, nextModifier];

        return previous.map((attachedModifier, index) =>
          index === existingIndex ? nextModifier : attachedModifier
        );
      });
      setSortOrders((previous) => {
        const nextSortOrders = { ...previous };
        delete nextSortOrders[modifier.id];
        return nextSortOrders;
      });
      void refetchGroup();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, t("attachFailed")));
    } finally {
      setAttachingModifierId(null);
    }
  };

  const handleDetach = async (modifier: ModifierGroupModifier) => {
    if (!groupId) return;

    try {
      setDetachingModifierId(modifier.id);
      await detachModifier({
        groupId,
        modifierId: modifier.id,
        restaurantId,
      });
      setHasLocalAttachmentChanges(true);
      setLocalAttachedModifiers((previous) =>
        previous.filter(
          (attachedModifier) => attachedModifier.id !== modifier.id
        )
      );
      void refetchGroup();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, t("detachFailed")));
    } finally {
      setDetachingModifierId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-auto rounded-[20px] bg-[#F5F5F5] p-4 sm:w-full sm:max-w-[calc(100vw-2rem)] sm:p-6 xl:max-w-[1180px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {t("title")}
          </DialogTitle>
          <p className="text-sm text-gray-500">
            {activeGroup?.name
              ? t("descriptionWithName", { name: activeGroup.name })
              : t("description")}
          </p>
        </DialogHeader>

        <div className="mt-5 grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          <section className="rounded-[16px] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-900">
                {t("attachedTitle")}
              </h3>
              {isGroupFetching ? (
                <Loader2 size={15} className="animate-spin text-gray-400" />
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              {attachedModifiers.length === 0 ? (
                <p className="rounded-[12px] border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">
                  {t("noAttached")}
                </p>
              ) : (
                attachedModifiers.map((modifier) => (
                  <AttachedModifierCard
                    key={modifier.id}
                    modifier={modifier}
                    isDetaching={
                      isDetaching && detachingModifierId === modifier.id
                    }
                    onDetach={() => void handleDetach(modifier)}
                  />
                ))
              )}
            </div>
          </section>

          <section className="rounded-[16px] bg-white p-4">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative w-full">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  placeholder={t("searchPlaceholder")}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-[44px] w-full rounded-[14px] border border-gray-200 bg-[#FAFAFA] pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="w-full lg:max-w-[300px]">
                <ModifierCategoryInfiniteSelect
                  value={categoryId}
                  onChange={(value) => {
                    setCategoryId(value);
                    setPage(1);
                  }}
                  restaurantId={restaurantId}
                  placeholder={t("categoryFilterPlaceholder")}
                  disabled={!restaurantId}
                  allowClear
                />
              </div>

              <Button
                type="button"
                onClick={() => void refetch()}
                disabled={!restaurantId}
                className="h-[44px] w-full rounded-[14px] bg-primary px-5 text-white lg:w-auto"
              >
                {commonT("search")}
              </Button>
            </div>

            <div className="space-y-3">
              {isLoading || isFetching ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[78px] animate-pulse rounded-[14px] bg-gray-100"
                  />
                ))
              ) : modifiers.length === 0 ? (
                <p className="rounded-[12px] border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                  {t("noModifiersFound")}
                </p>
              ) : (
                modifiers.map((modifier) => (
                  <ModifierOption
                    key={modifier.id}
                    modifier={modifier}
                    attached={attachedModifierIds.has(modifier.id)}
                    sortOrder={
                      sortOrders[modifier.id] ?? String(modifier.sortOrder ?? 0)
                    }
                    isAttaching={
                      isAttaching && attachingModifierId === modifier.id
                    }
                    onSortOrderChange={(value) =>
                      updateSortOrder(modifier.id, value)
                    }
                    onAttach={() => void handleAttach(modifier)}
                  />
                ))
              )}
            </div>

            <div className="mt-4">
              <PaginationSection {...pagination} onPageChange={setPage} />
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AttachedModifierCard({
  modifier,
  isDetaching,
  onDetach,
}: {
  modifier: ModifierGroupModifier;
  isDetaching: boolean;
  onDetach: () => void;
}) {
  const t = useTranslations("menu.modifierGroupsTable.manage");

  return (
    <div className="rounded-[12px] border border-gray-100 bg-[#FAFAFA] p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">
            {modifier.name}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {modifier.category?.name || t("noCategory")} · $
            {formatPrice(modifier.priceDelta)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {t("sortOrder")}: {modifier.sortOrder ?? 0}
          </p>
        </div>

        {SHOW_DETACH_ACTION ? (
          <Button
            type="button"
            variant="outline"
            disabled={isDetaching}
            onClick={onDetach}
            className="h-[34px] rounded-[10px] border-gray-200 px-3 text-xs text-gray-700"
          >
            {isDetaching ? t("detaching") : t("detach")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ModifierOption({
  modifier,
  attached,
  sortOrder,
  isAttaching,
  onSortOrderChange,
  onAttach,
}: {
  modifier: Modifier;
  attached: boolean;
  sortOrder: string;
  isAttaching: boolean;
  onSortOrderChange: (value: string) => void;
  onAttach: () => void;
}) {
  const t = useTranslations("menu.modifierGroupsTable.manage");

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-gray-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900">
          {modifier.name}
        </p>
        <p className="mt-1 truncate text-xs text-gray-500">
          {modifier.category?.name || t("noCategory")} · $
          {formatPrice(modifier.priceDelta)}
        </p>
      </div>

      <div className="grid w-full grid-cols-[92px_minmax(0,1fr)] items-center gap-2 sm:flex sm:w-auto">
        <input
          type="number"
          min={0}
          value={sortOrder}
          disabled={attached || isAttaching}
          onKeyDown={blockInvalidNumberKeys}
          onPaste={blockNegativeNumberPaste}
          onChange={(event) => onSortOrderChange(event.target.value)}
          className="h-[38px] w-[92px] rounded-[10px] border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={t("sortOrder")}
        />

        <Button
          type="button"
          disabled={attached || isAttaching}
          onClick={onAttach}
          className="h-[38px] rounded-[10px] bg-primary px-4 text-white disabled:opacity-60"
        >
          {attached ? t("attached") : isAttaching ? t("attaching") : t("attach")}
        </Button>
      </div>
    </div>
  );
}
