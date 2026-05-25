import { useState } from "react";

export const useMenuItemsTableState = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  return { selectedIds, setSelectedIds };
};
