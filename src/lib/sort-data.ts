type SortDirection = "asc" | "desc";

export function sortData<T extends object>(
  data: T[],
  key: keyof T,
  direction: SortDirection
): T[] {
  return [...data].sort((first, second) => {
    const firstValue = first[key] ?? "";
    const secondValue = second[key] ?? "";

    if (firstValue === secondValue) {
      return 0;
    }

    const result =
      String(firstValue).toLowerCase() < String(secondValue).toLowerCase()
        ? -1
        : 1;

    return direction === "asc" ? result : -result;
  });
}
