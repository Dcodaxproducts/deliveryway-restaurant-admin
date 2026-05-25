import { z } from "zod";

/**
 * ==============================
 * Customer App FAQ Schema
 * ==============================
 */

export const faqStatusEnum = z.enum(["DRAFT", "PUBLISHED"]);
export const faqVisibilityEnum = z.enum(["PUBLIC", "PRIVATE"]);

export const faqSchema = z.object({
  question: z.string().min(3, "Question is required"),
  category: z.string().min(1, "Category is required"),
  answer: z.string().min(3, "Answer is required"),
  status: faqStatusEnum,
  visibility: faqVisibilityEnum,
});

export type FaqValues = z.infer<typeof faqSchema>;
export type FaqStatus = z.infer<typeof faqStatusEnum>;
export type FaqVisibility = z.infer<typeof faqVisibilityEnum>;