import { api } from "@/lib/axios";
import { FaqValues } from "@/validations/faqs";

type FaqRecord = FaqValues & {
  id?: string;
  _id?: string;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export const extractFaqItems = (response: unknown): FaqRecord[] => {
  if (Array.isArray(response)) {
    return response.filter(
      (item): item is FaqRecord => asRecord(item) !== null,
    );
  }

  const root = asRecord(response);
  const data = asRecord(root?.data);
  const candidates = [data?.items, root?.items, root?.data];
  const items = candidates.find(Array.isArray);

  return Array.isArray(items)
    ? items.filter((item): item is FaqRecord => asRecord(item) !== null)
    : [];
};

/**
 * ==============================
 * CUSTOMER APP FAQ APIS
 * ==============================
 */

/**
 * Create FAQ
 */
export const createFaq = async (
  restaurantId: string,
  payload: FaqValues
) => {
  const { data } = await api.post(
    `/restaurants/${restaurantId}/customer-app-faqs`,
    payload
  );
  return data;
};

/**
 * Get FAQ list
 */
export const getFaqList = async (
  restaurantId: string,
  params?: {
    page?: number;
    search?: string;
    category?: string;
    status?: "DRAFT" | "PUBLISHED";
    visibility?: "PUBLIC" | "PRIVATE";
  }
) => {
  const { data } = await api.get(
    `/restaurants/${restaurantId}/customer-app-faqs`,
    { params }
  );
  return data;
};

/**
 * Get single FAQ
 * The API returns FAQ records under data.items.
 */
export const getFaq = async (restaurantId: string, faqId: string) => {
  const { data } = await api.get(
    `/restaurants/${restaurantId}/customer-app-faqs`
  );

  return extractFaqItems(data).find(
    (item) => item.id === faqId || item._id === faqId,
  );
};

/**
 * Update FAQ
 */
export const updateFaq = async (
  restaurantId: string,
  faqId: string,
  payload: Partial<FaqValues>
) => {
  const { data } = await api.patch(
    `/restaurants/${restaurantId}/customer-app-faqs/${faqId}`,
    payload
  );
  return data;
};

/**
 * Delete FAQ
 */
export const deleteFaq = async (restaurantId: string, faqId: string) => {
  const { data } = await api.delete(
    `/restaurants/${restaurantId}/customer-app-faqs/${faqId}`
  );
  return data?.data ?? data;
};
