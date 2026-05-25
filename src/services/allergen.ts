import api from "@/lib/axios";

/**
 * ==============================
 * ALLERGEN / ADDITIVE TEMPLATE TYPES
 * ==============================
 */

export type AllergenAdditiveTemplateItem = {
  code: string;
  label: string;
};

export type AllergenAdditiveTemplatesResponse = {
  success: boolean;
  data: {
    allergens?: AllergenAdditiveTemplateItem[];
    additives?: AllergenAdditiveTemplateItem[];
  };
  message?: string;
};

export type GetAllergenAdditiveTemplatesParams = {
  restaurantId?: string;
};

export type BulkUpdateAllergenAdditiveTemplatesPayload = {
  restaurantId: string;
  allergens: AllergenAdditiveTemplateItem[];
  additives: AllergenAdditiveTemplateItem[];
};

export type CreateAllergenAdditiveTemplatePayload = {
  code: string;
  label: string;
};

export type UpdateAllergenAdditiveTemplatePayload = {
  code: string;
  label: string;
};

export type CreateAllergenAdditiveTemplateParams = {
  type: string;
  restaurantId: string;
  payload: CreateAllergenAdditiveTemplatePayload;
};

export type UpdateSingleAllergenAdditiveTemplateParams = {
  type: string;
  code: string;
  restaurantId: string;
  payload: UpdateAllergenAdditiveTemplatePayload;
};

export type DeleteAllergenAdditiveTemplateParams = {
  type: string;
  code: string;
  restaurantId: string;
};

/**
 * ==============================
 * ROUTES
 * ==============================
 */

export const ALLERGEN_ADDITIVE_TEMPLATE_ROUTES = {
  base: "/menu/items/allergen-additive-templates",

  byType: (type: string) =>
    `/menu/items/allergen-additive-templates/${encodeURIComponent(type)}`,

  byTypeAndCode: (type: string, code: string) =>
    `/menu/items/allergen-additive-templates/${encodeURIComponent(
      type
    )}/${encodeURIComponent(code)}`,
};

/**
 * ==============================
 * HELPERS
 * ==============================
 */

const cleanParams = <T extends Record<string, any>>(params?: T) => {
  if (!params) return undefined;

  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== undefined && value !== null && value !== "";
    })
  );

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
};

/**
 * ==============================
 * ALLERGEN / ADDITIVE TEMPLATE APIS
 * ==============================
 */

export const getAllergenAdditiveTemplates = async (
  params?: GetAllergenAdditiveTemplatesParams
): Promise<AllergenAdditiveTemplatesResponse> => {
  const { data } = await api.get(ALLERGEN_ADDITIVE_TEMPLATE_ROUTES.base, {
    params: cleanParams(params),
  });

  return data;
};

export const updateAllergenAdditiveTemplates = async (
  payload: BulkUpdateAllergenAdditiveTemplatesPayload
) => {
  const { data } = await api.patch(
    ALLERGEN_ADDITIVE_TEMPLATE_ROUTES.base,
    payload
  );

  return data;
};

export const createAllergenAdditiveTemplate = async ({
  type,
  restaurantId,
  payload,
}: CreateAllergenAdditiveTemplateParams) => {
  const { data } = await api.post(
    ALLERGEN_ADDITIVE_TEMPLATE_ROUTES.byType(type),
    payload,
    {
      params: {
        restaurantId,
      },
    }
  );

  return data;
};

export const updateSingleAllergenAdditiveTemplate = async ({
  type,
  code,
  restaurantId,
  payload,
}: UpdateSingleAllergenAdditiveTemplateParams) => {
  const { data } = await api.patch(
    ALLERGEN_ADDITIVE_TEMPLATE_ROUTES.byTypeAndCode(type, code),
    payload,
    {
      params: {
        restaurantId,
      },
    }
  );

  return data;
};

export const deleteAllergenAdditiveTemplate = async ({
  type,
  code,
  restaurantId,
}: DeleteAllergenAdditiveTemplateParams) => {
  const { data } = await api.delete(
    ALLERGEN_ADDITIVE_TEMPLATE_ROUTES.byTypeAndCode(type, code),
    {
      params: {
        restaurantId,
      },
    }
  );

  return data;
};