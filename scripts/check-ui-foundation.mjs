import { access, readFile, readdir } from "node:fs/promises";
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
  "src/components/common/FormLayout.tsx",
  "src/components/common/DetailLayout.tsx",
  "src/components/common/SettingsLayout.tsx",
  "src/components/common/ResponsiveDialog.tsx",
  "src/components/common/dialogs/delete-dialog.tsx",
  "src/components/ui/form-select.tsx",
  "src/components/ui/file-upload-control.tsx",
];

const forbiddenDuplicatePaths = [
  "src/components/common/pagination.tsx",
  "src/components/common/page-section.tsx",
  "src/components/common/TableSkeleton.tsx",
  "src/components/common/FormActions.tsx",
  "src/components/common/FormSection.tsx",
  "src/components/common/DetailPanel.tsx",
  "src/components/common/InfoList.tsx",
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

async function collectTsxFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return collectTsxFiles(path);
      return entry.name.endsWith(".tsx") && !entry.name.includes(".test.")
        ? [path]
        : [];
    }),
  );

  return files.flat();
}

for (const path of await collectTsxFiles(join(root, "src"))) {
  const source = await readFile(path, "utf8");
  if (/<select(?:\s|>)/.test(source)) {
    throw new Error(
      `Browser-native select found in ${path.replace(`${root}/`, "")}; use FormSelect.`,
    );
  }
}

console.log(`Shared UI ownership verified (${canonicalOwners.length} canonical paths).`);
