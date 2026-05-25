import { z } from "zod";

export const addToCartSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  modifiers: z.array(z.string()).default([]),
  variations: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export type AddToCartFormValues = z.infer<typeof addToCartSchema>;
