import { httpClient } from "@/lib/axios";
import {
  normalizeTaxTypesResponse,
  type TaxTypesResponse,
} from "@/types/tax-types";

export const MENU_ITEM_TAX_TYPES_ENDPOINT = "/admin/global-settings/tax-types";

export const getMenuItemTaxTypes = async (): Promise<TaxTypesResponse> => {
  const response = await httpClient.get<unknown>(MENU_ITEM_TAX_TYPES_ENDPOINT);

  return normalizeTaxTypesResponse(response);
};
