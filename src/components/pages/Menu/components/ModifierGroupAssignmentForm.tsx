"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Check, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useAssignModifierGroupToCategory,
  useAssignModifierGroupToItem,
} from "@/hooks/useModifierGroupAssignments";
import { useModifierGroups } from "@/hooks/useModifierGroups";
import {
  blockInvalidNumberKeys,
  blockNegativeNumberPaste,
  sanitizeNonNegativeNumber,
} from "@/lib/number-input";
import { cn } from "@/lib/utils";
import type {
  MenuCategoryModifierGroupAssignment,
  MenuItemModifierGroupAssignment,
  ModifierGroupAssignmentGroup,
  ModifierGroupAssignmentRules,
  ModifierGroupSelectionType,
} from "@/types/modifier-group-assignments";
import type { ModifierGroup } from "@/types/modifier-groups";
import {
  isRequiredModifierGroupAssignment,
  modifierGroupAssignmentSchema,
} from "@/validations/modifier-group-assignments";

type AssignmentMode = "item" | "category";

type AssignmentDraft = ModifierGroupAssignmentRules & {
  groupId: string;
  group?: ModifierGroupAssignmentGroup;
};

type ModifierGroupAssignmentFormProps = {
  mode: AssignmentMode;
  targetId: string;
  restaurantId?: string;
  defaultValues?: AssignmentDraft[];
  onAssignmentsChange?: (assignments: AssignmentDraft[]) => void;
  onSuccess?: () => void;
};

type Preset = {
  label: string;
  values: Pick<AssignmentDraft, "selectionType" | "minSelect" | "maxSelect">;
};

const PRESETS: Preset[] = [
  {
    label: "Required single",
    values: { selectionType: "SINGLE", minSelect: 1, maxSelect: 1 },
  },
  {
    label: "Optional single",
    values: { selectionType: "SINGLE", minSelect: 0, maxSelect: 1 },
  },
  {
    label: "Required multiple",
    values: { selectionType: "MULTIPLE", minSelect: 1, maxSelect: 3 },
  },
  {
    label: "Optional multiple",
    values: { selectionType: "MULTIPLE", minSelect: 0, maxSelect: 3 },
  },
];

const DEFAULT_DRAFT = {
  groupId: "",
  selectionType: "MULTIPLE" as ModifierGroupSelectionType,
  minSelect: "0",
  maxSelect: "3",
  sortOrder: "0",
};

const getGroupDescription = (group?: ModifierGroup | AssignmentDraft["group"]) =>
  group?.description?.trim() || "No description";

const toAssignmentDraft = (
  assignment: MenuItemModifierGroupAssignment | MenuCategoryModifierGroupAssignment
): AssignmentDraft => ({
  groupId: assignment.groupId,
  group: assignment.group,
  selectionType: assignment.selectionType,
  minSelect: assignment.minSelect,
  maxSelect: assignment.maxSelect,
  sortOrder: assignment.sortOrder ?? 0,
});

export function ModifierGroupAssignmentForm({
  mode,
  targetId,
  restaurantId,
  defaultValues = [],
  onAssignmentsChange,
  onSuccess,
}: ModifierGroupAssignmentFormProps) {
  const [assignments, setAssignments] = useState<AssignmentDraft[]>(
    defaultValues.map(toAssignmentDraft)
  );
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [groupOptions, setGroupOptions] = useState<ModifierGroup[]>([]);
  const [draft, setDraft] = useState(DEFAULT_DRAFT);
  const groupListRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const { mutateAsync: assignItemGroup, isPending: isAssigningItem } =
    useAssignModifierGroupToItem();
  const { mutateAsync: assignCategoryGroup, isPending: isAssigningCategory } =
    useAssignModifierGroupToCategory();
  const isAssigning = isAssigningItem || isAssigningCategory;

  useEffect(() => {
    setAssignments(defaultValues.map(toAssignmentDraft));
  }, [defaultValues]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const { data: groupsResponse, isLoading, isFetching } = useModifierGroups({
    restaurantId,
    search: debouncedSearch || undefined,
    page,
    limit: 10,
  });

  useEffect(() => {
    const nextGroups = groupsResponse?.data ?? [];

    setGroupOptions((previous) => {
      const map = new Map<string, ModifierGroup>();
      if (page > 1) {
        previous.forEach((group) => map.set(group.id, group));
      }
      nextGroups.forEach((group) => map.set(group.id, group));
      return Array.from(map.values());
    });
  }, [groupsResponse?.data, page]);

  const selectedGroup = useMemo(
    () => groupOptions.find((group) => group.id === draft.groupId),
    [draft.groupId, groupOptions]
  );

  const assignedGroupIds = useMemo(
    () => new Set(assignments.map((assignment) => assignment.groupId)),
    [assignments]
  );

  const pagination = groupsResponse?.meta;
  const hasMore =
    pagination?.hasNext ??
    Number(pagination?.page ?? page) < Number(pagination?.totalPages ?? 1);

  useEffect(() => {
    const root = groupListRef.current;
    const sentinel = loadMoreRef.current;

    if (!root || !sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || isLoading || isFetching) return;

        setPage((current) => current + 1);
      },
      {
        root,
        rootMargin: "80px 0px",
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, isFetching, isLoading]);

  const updateAssignments = (nextAssignments: AssignmentDraft[]) => {
    setAssignments(nextAssignments);
    onAssignmentsChange?.(nextAssignments);
  };

  const updateDraft = (key: keyof typeof DEFAULT_DRAFT, value: string) => {
    setDraft((current) => ({
      ...current,
      [key]:
        key === "minSelect" || key === "maxSelect" || key === "sortOrder"
          ? sanitizeNonNegativeNumber(value)
          : value,
    }));
  };

  const applyPreset = (preset: Preset) => {
    setDraft((current) => ({
      ...current,
      selectionType: preset.values.selectionType,
      minSelect: String(preset.values.minSelect),
      maxSelect: String(preset.values.maxSelect),
    }));
  };

  const isPresetSelected = (preset: Preset) =>
    draft.selectionType === preset.values.selectionType &&
    Number(draft.minSelect || 0) === preset.values.minSelect &&
    Number(draft.maxSelect || 0) === preset.values.maxSelect;

  const resetDraft = () => {
    setDraft(DEFAULT_DRAFT);
  };

  const handleAdd = async () => {
    const parsed = modifierGroupAssignmentSchema.safeParse({
      groupId: draft.groupId,
      selectionType: draft.selectionType,
      minSelect: draft.minSelect,
      maxSelect: draft.maxSelect,
      sortOrder: draft.sortOrder,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Invalid assignment");
      return;
    }

    const nextAssignment: AssignmentDraft = {
      groupId: parsed.data.groupId,
      group: selectedGroup
        ? {
            id: selectedGroup.id,
            name: selectedGroup.name,
            description: selectedGroup.description,
            modifiers: selectedGroup.modifiers,
          }
        : undefined,
      selectionType: parsed.data.selectionType,
      minSelect: parsed.data.minSelect,
      maxSelect: parsed.data.maxSelect,
      sortOrder: parsed.data.sortOrder,
    };

    if (onAssignmentsChange || !targetId) {
      updateAssignments([
        ...assignments.filter(
          (assignment) => assignment.groupId !== nextAssignment.groupId
        ),
        nextAssignment,
      ]);
      resetDraft();
      return;
    }

    if (mode === "item") {
      await assignItemGroup({
        itemId: targetId,
        groupId: nextAssignment.groupId,
        data: {
          selectionType: nextAssignment.selectionType,
          minSelect: nextAssignment.minSelect,
          maxSelect: nextAssignment.maxSelect,
          sortOrder: nextAssignment.sortOrder,
        },
      });
    } else {
      await assignCategoryGroup({
        categoryId: targetId,
        groupId: nextAssignment.groupId,
        data: {
          selectionType: nextAssignment.selectionType,
          minSelect: nextAssignment.minSelect,
          maxSelect: nextAssignment.maxSelect,
          sortOrder: nextAssignment.sortOrder,
        },
      });
    }

    updateAssignments([
      ...assignments.filter(
        (assignment) => assignment.groupId !== nextAssignment.groupId
      ),
      nextAssignment,
    ]);
    resetDraft();
    onSuccess?.();
  };

  const removeDraftAssignment = (groupId: string) => {
    updateAssignments(
      assignments.filter((assignment) => assignment.groupId !== groupId)
    );
  };

  return (
    <section className="w-full min-w-0 rounded-[18px] border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Modifier Groups
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Assign customer-facing modifier sets such as Choose Bread or Choose
          Sauces.
        </p>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(520px,1.25fr)_minmax(320px,0.75fr)]">
        <div className="min-w-0 rounded-[16px] border border-gray-100 bg-[#FAFAFA] p-3 sm:p-4">
          <div className="relative mb-3">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search modifier groups..."
              className="h-[40px] w-full rounded-[12px] border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary/40"
            />
          </div>

          <div
            ref={groupListRef}
            className="max-h-[260px] space-y-2 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin]"
          >
            {isLoading && groupOptions.length === 0 ? (
              <div className="flex items-center justify-center gap-2 rounded-[12px] bg-white p-5 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin" />
                Loading groups...
              </div>
            ) : groupOptions.length === 0 ? (
              <p className="rounded-[12px] border border-dashed border-gray-200 bg-white p-5 text-center text-sm text-gray-400">
                No modifier groups found.
              </p>
            ) : (
              <>
                {groupOptions.map((group) => {
                  const selected = group.id === draft.groupId;
                  const assigned = assignedGroupIds.has(group.id);

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => updateDraft("groupId", group.id)}
                      className={`w-full min-w-0 rounded-[12px] border bg-white p-3 text-left transition ${
                        selected
                          ? "border-primary ring-2 ring-primary/10"
                          : "border-gray-100 hover:border-primary/30"
                      }`}
                    >
                      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                        <span
                          className={`mt-0.5 hidden h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border sm:flex ${
                            selected
                              ? "border-primary bg-primary text-white"
                              : "border-gray-300 text-transparent"
                          }`}
                        >
                          <Check size={14} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block break-words text-sm font-semibold text-gray-900">
                            {group.name}
                          </span>
                          <span className="mt-1 block break-words text-xs leading-5 text-gray-500">
                            {getGroupDescription(group)}
                          </span>
                        </span>
                        {assigned ? (
                          <span className="w-fit shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                            Added
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}

                {hasMore ? (
                  <div
                    ref={loadMoreRef}
                    className="flex min-h-10 items-center justify-center gap-2 py-2 text-xs text-gray-500"
                  >
                    {isFetching ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Loading more groups...
                      </>
                    ) : (
                      <span className="sr-only">Load more groups</span>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-4 rounded-[16px] border border-gray-100 bg-white p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PRESETS.map((preset) => {
              const selected = isPresetSelected(preset);

              return (
                <Button
                  key={preset.label}
                  type="button"
                  variant={selected ? "default" : "outline"}
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "h-auto min-h-[38px] whitespace-normal rounded-[10px] px-3 py-2 text-center text-xs leading-4",
                    selected
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "bg-white text-gray-700 hover:border-primary/30 hover:bg-primary/5"
                  )}
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>

          <FieldLabel label="Selection type">
            <select
              value={draft.selectionType}
              onChange={(event) =>
                updateDraft("selectionType", event.target.value)
              }
              className="h-[40px] w-full rounded-[10px] border border-gray-200 px-3 text-sm outline-none focus:border-primary/40"
            >
              <option value="SINGLE">Single</option>
              <option value="MULTIPLE">Multiple</option>
            </select>
          </FieldLabel>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FieldLabel label="Min select">
              <NumberInput
                value={draft.minSelect}
                onChange={(value) => updateDraft("minSelect", value)}
              />
            </FieldLabel>
            <FieldLabel label="Max select">
              <NumberInput
                value={draft.maxSelect}
                onChange={(value) => updateDraft("maxSelect", value)}
              />
            </FieldLabel>
            <FieldLabel label="Sort order">
              <NumberInput
                value={draft.sortOrder}
                onChange={(value) => updateDraft("sortOrder", value)}
              />
            </FieldLabel>
          </div>

          <Button
            type="button"
            onClick={() => void handleAdd()}
            disabled={isAssigning || !draft.groupId}
            className="h-[42px] w-full rounded-[12px] bg-primary text-white"
          >
            {isAssigning ? "Assigning..." : "Add modifier group"}
          </Button>
        </div>
      </div>

      {assignments.length > 0 ? (
        <div className="mt-4 min-w-0 space-y-2">
          {assignments.map((assignment) => (
            <div
              key={assignment.groupId}
              className="flex min-w-0 flex-col gap-3 rounded-[12px] border border-gray-100 bg-[#FAFAFA] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold text-gray-900">
                  {assignment.group?.name || assignment.groupId}
                </p>
                <p className="mt-1 break-words text-xs leading-5 text-gray-500">
                  {assignment.selectionType} · {assignment.minSelect}/
                  {assignment.maxSelect} · Sort {assignment.sortOrder ?? 0} ·{" "}
                  {isRequiredModifierGroupAssignment(assignment)
                    ? "Required"
                    : "Optional"}
                </p>
              </div>

              {onAssignmentsChange ? (
                <button
                  type="button"
                  onClick={() => removeDraftAssignment(assignment.groupId)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-white hover:text-red-500"
                  aria-label="Remove draft modifier group assignment"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0 space-y-1">
      <span className="block text-sm text-gray-600">{label}</span>
      {children}
    </label>
  );
}

function NumberInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onKeyDown={blockInvalidNumberKeys}
      onPaste={blockNegativeNumberPaste}
      onChange={(event) => onChange(event.target.value)}
      className="h-[40px] w-full min-w-0 rounded-[10px] border border-gray-200 px-3 text-sm outline-none focus:border-primary/40"
    />
  );
}
