import { httpClient } from "@/lib/axios";
import type { AssignModifierGroupPayload } from "@/types/modifier-group-assignments";

export const assignModifierGroupToItem = (
  itemId: string,
  groupId: string,
  payload: AssignModifierGroupPayload
) =>
  httpClient.post<unknown, AssignModifierGroupPayload>(
    `/menu/items/${itemId}/modifier-groups/${groupId}`,
    payload
  );

export const detachModifierGroupFromItem = (itemId: string, groupId: string) =>
  httpClient.delete<unknown>(
    `/menu/items/${itemId}/modifier-groups/${groupId}`
  );

export const assignModifierGroupToCategory = (
  categoryId: string,
  groupId: string,
  payload: AssignModifierGroupPayload
) =>
  httpClient.post<unknown, AssignModifierGroupPayload>(
    `/menu/categories/${categoryId}/modifier-groups/${groupId}`,
    payload
  );
