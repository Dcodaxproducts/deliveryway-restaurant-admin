export const slugifyCuisineName = (value: string) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const formatCuisineDescription = (value?: string | null) =>
  value?.trim() ? value : "-";

export const formatCuisineSortOrder = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value) ? String(value) : "0";

export const formatCuisineStatus = (isActive?: boolean) =>
  isActive === false ? "Inactive" : "Active";
