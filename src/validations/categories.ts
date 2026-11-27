import { getLocalizedMessage } from "@/lib/localized-message";
import { z } from "zod";

/**
 * ==============================
 * Shared Helpers
 * ==============================
 */

const requiredString = (message: string, min = 1) =>
  z.string().trim().min(min, message);

const optionalString = (max?: number) => {
  let schema = z.string().trim();
  if (max) schema = schema.max(max);
  return schema.optional().or(z.literal(""));
};

const optionalBoolean = (defaultValue?: boolean) =>
  defaultValue !== undefined
    ? z.boolean().default(defaultValue)
    : z.boolean().optional();

const optionalNumberFromInput = ({
  min,
  max,
  integer = false,
  nonnegative = false,
}: {
  min?: number;
  max?: number;
  integer?: boolean;
  nonnegative?: boolean;
} = {}) =>
  z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "string") return Number(val);
      return val;
    },
    z
      .number({ invalid_type_error: getLocalizedMessage("validation069") })
      .refine((v) => !Number.isNaN(v), getLocalizedMessage("validation070"))
      .superRefine((v, ctx) => {
        if (integer && !Number.isInteger(v)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: getLocalizedMessage("validation071"),
          });
        }
        if (nonnegative && v < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: getLocalizedMessage("validation072"),
          });
        }
        if (min !== undefined && v < min) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Must be at least ${min}`,
          });
        }
        if (max !== undefined && v > max) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Must be at most ${max}`,
          });
        }
      })
      .optional()
  );

const idSchema = z.string().trim().min(1, getLocalizedMessage("validation044"));

/**
 * ==============================
 * Utility Builder
 * ==============================
 */

const buildCrudSchemas = <T extends z.ZodRawShape>(shape: T) => {
  const createSchema = z.object(shape);
  const updateSchema = createSchema.partial();
  return { createSchema, updateSchema };
};

/**
 * ==============================
 * Menu Category Schema
 * ==============================
 */

const menuCategoryShape = {
  restaurantId: requiredString("Restaurant is required"),
  parentCategoryId: optionalString(),
  name: requiredString("Category name is required", 2),
  slug: optionalString(150),
  description: optionalString(500),
  imageUrl: optionalString(),
  sortOrder: optionalNumberFromInput({
    min: 0,
    integer: true,
    nonnegative: true,
  }).default(0),
  isActive: optionalBoolean(true),
};

export const {
  createSchema: menuCategorySchema,
  updateSchema: updateMenuCategorySchema,
} = buildCrudSchemas(menuCategoryShape);

export type MenuCategoryValues = z.infer<typeof menuCategorySchema>;
export type UpdateMenuCategoryValues = z.infer<
  typeof updateMenuCategorySchema
>;

/**
 * ==============================
 * Bulk Categories
 * ==============================
 */

export const bulkMenuCategoriesSchema = z.object({
  categories: z
    .array(menuCategorySchema)
    .min(1, getLocalizedMessage("validation005")),
});

export type BulkMenuCategoriesValues = z.infer<
  typeof bulkMenuCategoriesSchema
>;

/**
 * ==============================
 * Shared small schemas
 * ==============================
 */

export const menuCategoryIdSchema = idSchema;