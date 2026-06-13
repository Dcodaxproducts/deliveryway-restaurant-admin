export type TaxType = {
  code: string;
  label: string;
  percentage: number;
  isActive: boolean;
  isDefault: boolean;
};

export type TaxTypesResponse = {
  taxTypes: TaxType[];
  message?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getResponseData = (response: unknown): unknown[] => {
  if (!isRecord(response)) return [];

  const data = response.data;

  if (Array.isArray(data)) return data;

  if (isRecord(data)) {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.taxTypes)) return data.taxTypes;
  }

  if (Array.isArray(response.taxTypes)) return response.taxTypes;
  if (Array.isArray(response.items)) return response.items;

  return [];
};

const normalizeTaxType = (value: unknown): TaxType | null => {
  if (!isRecord(value)) return null;

  const code = value.code;
  const label = value.label;
  const percentage = Number(value.percentage);
  const isActive = value.isActive;
  const isDefault = value.isDefault;

  if (
    typeof code !== "string" ||
    !code.trim() ||
    typeof label !== "string" ||
    !label.trim() ||
    Number.isNaN(percentage)
  ) {
    return null;
  }

  return {
    code: code.trim().toUpperCase(),
    label: label.trim(),
    percentage,
    isActive: typeof isActive === "boolean" ? isActive : false,
    isDefault: typeof isDefault === "boolean" ? isDefault : false,
  };
};

export const normalizeTaxTypesResponse = (
  response: unknown
): TaxTypesResponse => {
  const record = isRecord(response) ? response : {};
  const taxTypes = getResponseData(response)
    .map(normalizeTaxType)
    .filter((taxType): taxType is TaxType => Boolean(taxType));

  return {
    taxTypes,
    message: typeof record.message === "string" ? record.message : undefined,
  };
};
