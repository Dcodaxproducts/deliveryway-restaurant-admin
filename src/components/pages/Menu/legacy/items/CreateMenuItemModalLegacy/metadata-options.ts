export type MenuMetadataOption = {
  value?: string;
  code?: string;
  label: string;
  displayLabel?: string;
};

export const normalizeLabelOptions = (response: any): MenuMetadataOption[] => {
  const candidates = [
    response?.data?.labels,
    response?.data?.items,
    response?.data?.data?.labels,
    response?.data?.data?.items,
    response?.data?.data,
    response?.labels,
    response?.items,
    response?.data,
    response,
  ];
  const raw = candidates.find((candidate) => Array.isArray(candidate));

  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const value = String(item?.value || "").trim();
      const label = String(item?.label || item?.value || "").trim();

      return { value, label, displayLabel: label };
    })
    .filter((item) => item.value && item.label);
};

export const normalizeTemplateOptions = (
  response: any,
  templateType: "allergens" | "additives",
): MenuMetadataOption[] => {
  const candidates = [
    response?.data?.[templateType],
    response?.data?.data?.[templateType],
    response?.[templateType],
    response?.data?.templates?.[templateType],
    response?.templates?.[templateType],
  ];
  const raw = candidates.find((candidate) => Array.isArray(candidate));

  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const code = String(item?.code || "").trim();
      const label = String(item?.label || item?.code || "").trim();

      return {
        code,
        label,
        displayLabel: `${code} — ${label}`,
      };
    })
    .filter((item) => item.code && item.label);
};

