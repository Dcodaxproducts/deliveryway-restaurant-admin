import api from "@/lib/axios";
import { FaqValues } from "@/validations/faqs";

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
 * Since you did not share GET /restaurants/:id/customer-app-faqs/:faqId,
 * this fetches the full list and finds one item locally.
 * Replace this later if single-get API exists.
 */
export const getFaq = async (restaurantId: string, faqId: string) => {
  const { data } = await api.get(
    `/restaurants/${restaurantId}/customer-app-faqs`
  );

  const faq =
    data?.data?.find?.((item: any) => item.id === faqId) ||
    data?.data?.find?.((item: any) => item._id === faqId) ||
    data?.find?.((item: any) => item.id === faqId) ||
    data?.find?.((item: any) => item._id === faqId);

  return faq;
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