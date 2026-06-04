import { ModifierGroupsTableLegacy } from "@/components/pages/Menu/legacy/modifier-groups/ModifierGroupsTableLegacy";

type ModifierGroupsTableProps = Record<string, never>;

export function ModifierGroupsTable(props: ModifierGroupsTableProps) {
  return <ModifierGroupsTableLegacy {...props} />;
}
