export type CreatedBranch = { id: string; name: string };
export type RestaurantMenuOption = {
  id: string;
  name: string;
  isDefault: boolean;
};

export const extractCreatedBranch = (
  response: unknown,
): CreatedBranch | null => {
  if (!response || typeof response !== "object") return null;
  const responseRecord = response as Record<string, unknown>;
  const envelope = responseRecord.data;
  const data =
    envelope && typeof envelope === "object"
      ? (envelope as Record<string, unknown>)
      : responseRecord;
  const candidate =
    data.branch && typeof data.branch === "object"
      ? (data.branch as Record<string, unknown>)
      : data;
  return typeof candidate.id === "string"
    ? {
        id: candidate.id,
        name: typeof candidate.name === "string" ? candidate.name : "",
      }
    : null;
};

export const extractRestaurantMenus = (
  response: unknown,
): RestaurantMenuOption[] => {
  if (!response || typeof response !== "object") return [];
  const root = response as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;
  const rows = [data.items, data.menus, data.data, root.items, root.menus].find(
    Array.isArray,
  );
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const menu = row as Record<string, unknown>;
    return typeof menu.id === "string"
      ? [
          {
            id: menu.id,
            name: typeof menu.name === "string" ? menu.name : menu.id,
            isDefault: menu.isDefault === true,
          },
        ]
      : [];
  });
};

export type BranchSetupWorkflowStage = "assignment" | "status";

export class BranchSetupWorkflowError extends Error {
  constructor(
    readonly stage: BranchSetupWorkflowStage,
    readonly cause: unknown,
  ) {
    super(
      stage === "assignment"
        ? "Menu assignment failed"
        : "Branch status update failed",
    );
  }
}

export const assignMenusBeforeOptionalSuspend = async ({
  assignMenus,
  suspendBranch,
  shouldSuspend,
  onAssignmentSaved,
}: {
  assignMenus: () => Promise<unknown>;
  suspendBranch: () => Promise<unknown>;
  shouldSuspend: boolean;
  onAssignmentSaved: () => void;
}) => {
  try {
    await assignMenus();
    onAssignmentSaved();
  } catch (error) {
    throw new BranchSetupWorkflowError("assignment", error);
  }

  if (!shouldSuspend) return;

  try {
    await suspendBranch();
  } catch (error) {
    throw new BranchSetupWorkflowError("status", error);
  }
};
