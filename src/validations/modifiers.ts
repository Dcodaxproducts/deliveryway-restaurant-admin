import { z } from "zod";

const requiredString = (message: string) => z.string().trim().min(1, message);

const optionalNumberFromInput = ({
  min,
  integer = false,
}: {
  min?: number;
  integer?: boolean;
} = {}) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) return undefined;
      if (typeof value === "string") return Number(value);
      return value;
    },
    z
      .number({ invalid_type_error: "Must be a number" })
      .refine((value) => !Number.isNaN(value), "Must be a valid number")
      .superRefine((value, context) => {
        if (integer && !Number.isInteger(value)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Must be an integer",
          });
        }

        if (min !== undefined && value < min) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Must be at least ${min}`,
          });
        }
      })
      .optional()
  );

export const modifierSchema = z.object({
  restaurantId: requiredString("Restaurant ID is required"),
  categoryId: requiredString("Modifier category is required"),
  name: requiredString("Modifier name is required"),
  priceDelta: optionalNumberFromInput({ min: 0 }).default(0),
  sortOrder: optionalNumberFromInput({ min: 0, integer: true }).default(0),
  isActive: z.boolean().optional(),
});

export const updateModifierSchema = modifierSchema
  .omit({ restaurantId: true })
  .partial()
  .extend({
    categoryId: requiredString("Modifier category is required").optional(),
  });

export type ModifierValues = z.infer<typeof modifierSchema>;
export type UpdateModifierValues = z.infer<typeof updateModifierSchema>;
