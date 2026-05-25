export type QueryPrimitive = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryPrimitive | QueryPrimitive[]>;

export const cleanParams = <T extends QueryParams>(params?: T): Partial<T> => {
  if (!params) return {};

  return Object.entries(params).reduce<Partial<T>>((acc, [key, value]) => {
    if (value === undefined || value === null || value === "") return acc;
    if (Array.isArray(value) && value.length === 0) return acc;

    (acc as Record<string, unknown>)[key] = value;
    return acc;
  }, {});
};

export const toSearchParams = (params?: QueryParams) => {
  const searchParams = new URLSearchParams();

  Object.entries(cleanParams(params)).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
      return;
    }

    searchParams.set(key, String(value));
  });

  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : "";
};
