export type AllergenTemplateType = "allergens" | "additives";

export type OrderedAllergenTemplate = {
  code: string;
  label: string;
  type: AllergenTemplateType;
};

export const moveAllergenTemplate = (
  items: OrderedAllergenTemplate[],
  sourceKey: string,
  targetKey: string,
) => {
  const sourceIndex = items.findIndex(
    (item) => `${item.type}-${item.code}` === sourceKey,
  );
  const targetIndex = items.findIndex(
    (item) => `${item.type}-${item.code}` === targetKey,
  );

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return items;
  }

  if (items[sourceIndex].type !== items[targetIndex].type) {
    return items;
  }

  const reordered = [...items];
  const [moved] = reordered.splice(sourceIndex, 1);
  reordered.splice(targetIndex, 0, moved);

  return reordered;
};

export const moveAllergenTemplateByOffset = (
  items: OrderedAllergenTemplate[],
  itemKey: string,
  offset: -1 | 1,
) => {
  const sourceIndex = items.findIndex(
    (item) => `${item.type}-${item.code}` === itemKey,
  );

  if (sourceIndex < 0) return items;

  const source = items[sourceIndex];
  const sameTypeIndexes = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.type === source.type)
    .map(({ index }) => index);
  const typePosition = sameTypeIndexes.indexOf(sourceIndex);
  const targetIndex = sameTypeIndexes[typePosition + offset];

  if (targetIndex === undefined) return items;

  return moveAllergenTemplate(
    items,
    itemKey,
    `${items[targetIndex].type}-${items[targetIndex].code}`,
  );
};

