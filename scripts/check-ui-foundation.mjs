import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const canonicalOwners = [
  "src/components/layout/AppShell.tsx",
  "src/components/common/Container.tsx",
  "src/components/common/PageHeader.tsx",
  "src/components/common/SectionCard.tsx",
  "src/components/common/stats-section.tsx",
  "src/components/cards/stats-card.tsx",
  "src/components/common/DataTable.tsx",
  "src/components/common/ResponsiveDataView.tsx",
  "src/components/common/FilterBar.tsx",
  "src/components/common/PaginationSection.tsx",
  "src/components/common/status-badge.tsx",
  "src/components/common/EmptyState.tsx",
  "src/components/common/FormField.tsx",
  "src/components/common/dialogs/delete-dialog.tsx",
];

const forbiddenDuplicatePaths = [
  "src/components/common/pagination.tsx",
  "src/components/common/page-section.tsx",
  "src/components/common/TableSkeleton.tsx",
];

for (const path of canonicalOwners) {
  await access(join(root, path));
}

for (const path of forbiddenDuplicatePaths) {
  try {
    await access(join(root, path));
    throw new Error(`Duplicate shared UI owner exists: ${path}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Duplicate")) throw error;
  }
}

const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
if (packageJson.dependencies?.["class-variance-authority"] === undefined) {
  throw new Error("Shared UI variants require the existing class-variance-authority dependency.");
}

console.log(`Shared UI ownership verified (${canonicalOwners.length} canonical paths).`);
