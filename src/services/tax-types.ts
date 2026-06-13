import { httpClient } from "@/lib/axios";
import {
  normalizeTaxTypesResponse,
  type TaxTypesResponse,
} from "@/types/tax-types";

export const TAX_TYPES_ENDPOINT = "/admin/global-settings/tax-types";

export const getTaxTypes = async (): Promise<TaxTypesResponse> => {
  const response = await httpClient.get<unknown>(TAX_TYPES_ENDPOINT);

  return normalizeTaxTypesResponse(response);
};
