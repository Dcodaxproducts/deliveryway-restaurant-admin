export type SelectOption = {
  id: string;
  name: string;
  value?: string;
  label?: string;
  title?: string;
  categoryId?: string;
};

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const getString = (source: Record<string, unknown> | undefined, key: string) => {
  const value = source?.[key];
  return typeof value === "string" ? value : undefined;
};

export const getApiMessage = (response: unknown, fallback: string) => {
  if (!isRecord(response)) return fallback;

  const error = response.error;
  const data = response.data;

  if (typeof error === "string") return error;
  if (isRecord(error) && typeof error.message === "string") return error.message;
  if (typeof response.message === "string") return response.message;
  if (isRecord(data) && typeof data.message === "string") return data.message;

  return fallback;
};

export const isApiErrorResponse = (response: unknown) => {
  if (!isRecord(response)) return true;
  return Boolean(response.error) || response.success === false;
};

export const normalizeDetail = (response: unknown): Record<string, unknown> | null => {
  if (!isRecord(response)) return null;

  const data = response.data;
  if (isRecord(data) && isRecord(data.data)) return data.data;
  if (isRecord(data)) return data;

  return response;
};

export const getOptionId = (option: unknown) => {
  if (!isRecord(option)) return "";
  return String(option.id ?? option.value ?? option._id ?? "").trim();
};

const normalizeRows = (response: unknown): unknown[] => {
  const getArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
  const source = isRecord(response) ? response : undefined;
  const data = source?.data;
  const nestedData = isRecord(data) ? data.data : undefined;
  const items = source?.items;

  return getArray(data).length
    ? getArray(data)
    : getArray(nestedData).length
      ? getArray(nestedData)
      : getArray(items);
};

export const normalizeApiRecords = (response: unknown) => {
  return normalizeRows(response).filter(isRecord);
};

export const normalizeApiArray = (response: unknown): SelectOption[] => {
  return normalizeRows(response).reduce<SelectOption[]>((acc, row) => {
    if (!isRecord(row)) return acc;
    const id = getOptionId(row);
    if (!id) return acc;
    acc.push({
      id,
      value: getString(row, "value"),
      label: getString(row, "label"),
      title: getString(row, "title"),
      name: getString(row, "name") ?? getString(row, "title") ?? getString(row, "label") ?? id,
      categoryId: getString(row, "categoryId"),
    });
    return acc;
  }, []);
};

export const getIds = (options: SelectOption[]) => {
  return Array.from(new Set(options.map((option) => getOptionId(option)).filter(Boolean)));
};

export const normalizeSelectedOptions = ({
  records,
  ids,
  singleRecord,
  singleId,
  fallbackLabel,
}: {
  records?: unknown;
  ids?: unknown;
  singleRecord?: unknown;
  singleId?: string | null;
  fallbackLabel: string;
}) => {
  const map = new Map<string, SelectOption>();

  const pushOption = (option: unknown, fallbackId?: string) => {
    const record = isRecord(option) ? option : undefined;
    const id = record ? getOptionId(record) || fallbackId || "" : fallbackId || "";
    if (!id) return;

    map.set(id, {
      id,
      name:
        getString(record, "name") ??
        getString(record, "title") ??
        getString(record, "label") ??
        `${fallbackLabel} ${map.size + 1}`,
      value: getString(record, "value"),
      label: getString(record, "label"),
      title: getString(record, "title"),
      categoryId: getString(record, "categoryId"),
    });
  };

  if (Array.isArray(records)) records.forEach((record) => pushOption(record));
  if (Array.isArray(ids)) ids.forEach((id) => pushOption({ id: String(id) }));
  if (singleRecord) pushOption(singleRecord, singleId || undefined);
  else if (singleId) pushOption({ id: singleId, name: `Selected ${fallbackLabel}` });

  return Array.from(map.values());
};

export const cleanPayload = <T extends Record<string, unknown>>(payload: T) => {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ) as Partial<T>;
};
