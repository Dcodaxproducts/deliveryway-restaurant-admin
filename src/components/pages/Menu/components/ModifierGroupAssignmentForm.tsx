"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useModifierGroups } from "@/hooks/useModifierGroups";
import { buildModifierGroupAssignment } from "@/lib/modifier-group-assignment-utils";
import type {
  MenuCategoryModifierGroupAssignment,
  MenuItemModifierGroupAssignment,
  ModifierGroupAssignmentGroup,
  ModifierGroupAssignmentRules,
} from "@/types/modifier-group-assignments";
import type { ModifierGroup } from "@/types/modifier-groups";

type AssignmentDraft = ModifierGroupAssignmentRules & {
  groupId: string;
  group?: ModifierGroupAssignmentGroup;
};

type ModifierGroupAssignmentFormProps = {
  restaurantId?: string;
  defaultValues?: AssignmentDraft[];
  onAssignmentsChange: (assignments: AssignmentDraft[]) => void;
};

const toAssignmentDraft = (
  assignment:
    | MenuItemModifierGroupAssignment
    | MenuCategoryModifierGroupAssignment
): AssignmentDraft => ({
  groupId: assignment.groupId,
  group: assignment.group,
  selectionType: assignment.selectionType,
  minSelect: assignment.minSelect,
  maxSelect: assignment.maxSelect,
  sortOrder: assignment.sortOrder ?? assignment.group?.sortOrder ?? 0,
});

const getGroupDescription = (
  group?: ModifierGroup | AssignmentDraft["group"]
) => group?.description?.trim() || "";

export function ModifierGroupAssignmentForm({
  restaurantId,
  defaultValues = [],
  onAssignmentsChange,
}: ModifierGroupAssignmentFormProps) {
  const t = useTranslations("menu.itemModal.stepFour");
  const [assignments, setAssignments] = useState<AssignmentDraft[]>(
    defaultValues.map(toAssignmentDraft)
  );
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [groupOptions, setGroupOptions] = useState<ModifierGroup[]>([]);
  const groupListRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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
      { root, rootMargin: "80px 0px", threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isFetching, isLoading]);

  const updateAssignments = (nextAssignments: AssignmentDraft[]) => {
    setAssignments(nextAssignments);
    onAssignmentsChange(nextAssignments);
  };

  const toggleGroup = (group: ModifierGroup) => {
    if (assignedGroupIds.has(group.id)) {
      updateAssignments(
        assignments.filter((assignment) => assignment.groupId !== group.id)
      );
      return;
    }

    updateAssignments([...assignments, buildModifierGroupAssignment(group)]);
  };

  const removeAssignment = (groupId: string) => {
    updateAssignments(
      assignments.filter((assignment) => assignment.groupId !== groupId)
    );
  };

  return (
    <section className="w-full min-w-0 rounded-[18px] border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {t("assignTitle")}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t("groupRulesInherited")}
          </p>
        </div>
        <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {t("selectedCount", { count: assignments.length })}
        </span>
      </div>

      <div className="min-w-0 rounded-[16px] border border-gray-100 bg-[#FAFAFA] p-3 sm:p-4">
        <div className="relative mb-3">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-[40px] w-full rounded-[12px] border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary/40"
          />
        </div>

        <div
          ref={groupListRef}
          className="max-h-[320px] space-y-2 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin]"
        >
          {isLoading && groupOptions.length === 0 ? (
            <div className="flex items-center justify-center gap-2 rounded-[12px] bg-white p-5 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" />
              {t("loadingOptions")}
            </div>
          ) : groupOptions.length === 0 ? (
            <p className="rounded-[12px] border border-dashed border-gray-200 bg-white p-5 text-center text-sm text-gray-400">
              {t("emptyDescription")}
            </p>
          ) : (
            <>
              {groupOptions.map((group) => {
                const assigned = assignedGroupIds.has(group.id);

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleGroup(group)}
                    className={`w-full min-w-0 rounded-[12px] border p-3 text-left transition ${
                      assigned
                        ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                        : "border-gray-100 bg-white hover:border-primary/30"
                    }`}
                    aria-pressed={assigned}
                  >
                    <span className="flex min-w-0 items-start gap-3">
                      <span
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[6px] border ${
                          assigned
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
                        {getGroupDescription(group) ? (
                          <span className="mt-1 block break-words text-xs leading-5 text-gray-500">
                            {getGroupDescription(group)}
                          </span>
                        ) : null}
                        <span className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-600">
                          <span className="rounded-full bg-gray-100 px-2 py-1">
                            {t("selectionRange", {
                              min: group.minSelect,
                              max: group.maxSelect,
                            })}
                          </span>
                          <span className="rounded-full bg-gray-100 px-2 py-1">
                            {group.isRequired || group.minSelect > 0
                              ? t("required")
                              : t("optional")}
                          </span>
                          <span className="rounded-full bg-gray-100 px-2 py-1">
                            {t("modifierCount", {
                              count: group.modifiers?.length ?? 0,
                            })}
                          </span>
                        </span>
                      </span>
                    </span>
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
                      {t("loadingMore")}
                    </>
                  ) : (
                    <span className="sr-only">{t("loadMore")}</span>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {assignments.length > 0 ? (
        <div className="mt-4 min-w-0 space-y-2">
          {assignments.map((assignment) => (
            <div
              key={assignment.groupId}
              className="flex min-w-0 items-center justify-between gap-3 rounded-[12px] border border-gray-100 bg-[#FAFAFA] p-3"
            >
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold text-gray-900">
                  {assignment.group?.name || assignment.groupId}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {t("selectionRange", {
                    min: assignment.minSelect,
                    max: assignment.maxSelect,
                  })}{" "}
                  · {assignment.minSelect > 0 ? t("required") : t("optional")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeAssignment(assignment.groupId)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-white hover:text-red-500"
                aria-label={t("removeGroup")}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
