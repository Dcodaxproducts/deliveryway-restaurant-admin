import { z } from "zod";

/**
 * ==============================
 * Shared Helpers
 * ==============================
 */

const optionalString = (max?: number) => {
  let schema = z.string().trim();

  if (max) {
    schema = schema.max(max);
  }

  return schema.optional().or(z.literal(""));
};

const requiredString = (message: string, min = 1) =>
  z.string().trim().min(min, message);

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
      .number({ invalid_type_error: "Must be a number" })
      .refine((v) => !Number.isNaN(v), "Must be a valid number")
      .superRefine((v, ctx) => {
        if (integer && !Number.isInteger(v)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Must be an integer",
          });
        }

        if (nonnegative && v < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Must be greater than or equal to 0",
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

const requiredNumberFromInput = ({
  min,
  max,
  integer = false,
  nonnegative = false,
  message = "Must be a number",
}: {
  min?: number;
  max?: number;
  integer?: boolean;
  nonnegative?: boolean;
  message?: string;
} = {}) =>
  z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "string") return Number(val);
      return val;
    },
    z
      .number({
        required_error: message,
        invalid_type_error: "Must be a number",
      })
      .refine((v) => !Number.isNaN(v), "Must be a valid number")
      .superRefine((v, ctx) => {
        if (integer && !Number.isInteger(v)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Must be an integer",
          });
        }

        if (nonnegative && v < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Must be greater than or equal to 0",
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
  );

const optionalStringArray = () =>
  z
    .union([z.array(z.string().trim()), z.string().trim()])
    .transform((val) => {
      if (Array.isArray(val)) return val.filter(Boolean);
      if (!val) return [];

      return val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    })
    .optional()
    .default([]);

const idSchema = z.string().trim().min(1, "Id is required");

const menuItemModifierSchema = z.object({
  modifierId: idSchema,
  priceDelta: optionalNumberFromInput({ min: 0 }).default(0),
  isRequired: z.boolean().optional().default(false),
});

const menuItemModifierPriceOverrideSchema = z.object({
  modifierId: idSchema,
  priceDelta: optionalNumberFromInput({ min: 0 }).default(0),
  isRequired: z.boolean().optional().default(false),
});

const variationModifierPriceOverrideSchema = z.object({
  modifierId: idSchema,
  priceDelta: optionalNumberFromInput({ min: 0 }).default(0),
});

const menuItemVariationPriceOverrideSchema = z.object({
  variationId: idSchema,
  price: optionalNumberFromInput({ min: 0 }).default(0),
  pickupPrice: optionalNumberFromInput({ min: 0 }).default(0),
  displayText: optionalString(),
  modifierPriceOverrides: z
    .array(variationModifierPriceOverrideSchema)
    .optional()
    .default([]),
});

export type MenuItemModifierInput = z.infer<typeof menuItemModifierSchema>;
export type MenuItemModifierPriceOverrideInput = z.infer<
  typeof menuItemModifierPriceOverrideSchema
>;

/**
 * Converts a base shape into:
 * - create schema (strict required/optional as defined)
 * - update schema (all fields optional)
 */
const buildCrudSchemas = <T extends z.ZodRawShape>(shape: T) => {
  const createSchema = z.object(shape);
  const updateSchema = createSchema.partial();

  return { createSchema, updateSchema };
};

/**
 * ==============================
 * Menu Item
 * ==============================
 */

const menuItemShape = {
  name: requiredString("Item name is required"),
  description: optionalString(500),

  imageUrl: optionalString(),
  slug: optionalString(150),
  sku: optionalString(100),

  categoryId: optionalString(),
  menuId: optionalString(),
  restaurantId: optionalString(),

  basePrice: optionalNumberFromInput({ min: 0 }),
  taxTypeCode: optionalString(100),
  pricingMode: z.enum(["SINGLE", "MULTIPLE"]).optional().default("SINGLE"),
  deliveryPriceAdjustment: optionalNumberFromInput({ min: 0 }).default(0),
  takeawayPriceAdjustment: optionalNumberFromInput({ min: 0 }).default(0),
  compareAtPrice: optionalNumberFromInput({ min: 0 }),
  costPrice: optionalNumberFromInput({ min: 0 }),

  ingredients: optionalString(),
  nutritionalInformation: optionalString(),

  prepTimeMinutes: optionalNumberFromInput({
    min: 0,
    integer: true,
    nonnegative: true,
  }),

  dietaryFlags: optionalStringArray(),
  allergenFlags: optionalStringArray(),
  tags: optionalStringArray(),

  isActive: optionalBoolean(true),
  isFeatured: optionalBoolean(false),
  isAvailable: optionalBoolean(true),

  variationIds: z.array(idSchema).optional().default([]),
  modifierGroupIds: z.array(idSchema).optional().default([]),

  modifiers: z.array(menuItemModifierSchema).optional().default([]),

  modifierPriceOverrides: z
    .array(menuItemModifierPriceOverrideSchema)
    .optional()
    .default([]),

  variationPriceOverrides: z
    .array(menuItemVariationPriceOverrideSchema)
    .optional()
    .default([]),
};

export const {
  createSchema: menuItemSchema,
  updateSchema: updateMenuItemSchema,
} = buildCrudSchemas(menuItemShape);

export type MenuItemValues = z.infer<typeof menuItemSchema>;
export type UpdateMenuItemValues = z.infer<typeof updateMenuItemSchema>;

/**
 * Bulk menu items
 */

export const bulkMenuItemsSchema = z.object({
  items: z.array(menuItemSchema).min(1, "At least one item is required"),
});

export type BulkMenuItemsValues = z.infer<typeof bulkMenuItemsSchema>;

/**
 * ==============================
 * Menu Variation
 * ==============================
 *
 * Generic variation schema.
 * No category relation in create/update payload.
 * No old options/minSelect structure.
 */

const menuVariationShape = {
  name: requiredString("Variation name is required"),
  description: optionalString(300),

  restaurantId: optionalString(),

  price: requiredNumberFromInput({
    min: 0,
    nonnegative: true,
    message: "Variation price is required",
  }),

  isDefault: optionalBoolean(false),
  isActive: optionalBoolean(true),
};

export const {
  createSchema: menuVariationSchema,
  updateSchema: updateMenuVariationSchema,
} = buildCrudSchemas(menuVariationShape);

export type MenuVariationValues = z.infer<typeof menuVariationSchema>;

export type UpdateMenuVariationValues = z.infer<
  typeof updateMenuVariationSchema
>;
export type SortOrder = "ASC" | "DESC";

export type GetMenuVariationsParams = {
  page?: number;
  limit?: number;

  search?: string;
  sortBy?: string;
  sortOrder?: SortOrder | string;

  restaurantId?: string;
  categoryId?: string;
  itemId?: string;

  /**
   * Backend-supported status filters.
   *
   * active list:
   * isActive=true
   *
   * inactive list:
   * inactive=true
   *
   * all list:
   * all=true or includeInactive=true
   */
  isActive?: boolean;
  inactive?: boolean;
  includeInactive?: boolean;
  all?: boolean;
};
/**
 * ==============================
 * Modifier Group
 * ==============================
 */

const modifierGroupShape = {
  name: requiredString("Modifier group name is required"),
  description: optionalString(300),

  minSelect: optionalNumberFromInput({
    min: 0,
    integer: true,
  }).default(0),

  maxSelect: optionalNumberFromInput({
    min: 1,
    integer: true,
  }),

  isRequired: optionalBoolean(false),
  isActive: optionalBoolean(true),

  restaurantId: requiredString("Restaurant ID is required"),
};

export const {
  createSchema: modifierGroupSchema,
  updateSchema: updateModifierGroupSchema,
} = buildCrudSchemas(modifierGroupShape);

export type ModifierGroupValues = z.infer<typeof modifierGroupSchema>;

export type UpdateModifierGroupValues = z.infer<
  typeof updateModifierGroupSchema
>;

/**
 * ==============================
 * Modifier
 * ==============================
 */

const modifierShape = {
  name: requiredString("Modifier name is required"),

  priceDelta: optionalNumberFromInput({
    min: 0,
  }).default(0),

  sortOrder: optionalNumberFromInput({
    min: 0,
    integer: true,
    nonnegative: true,
  }).default(0),

  modifierGroupIds: z
    .array(idSchema)
    .min(1, "At least one modifier group is required"),

  isActive: optionalBoolean(true),
};

export const {
  createSchema: modifierSchema,
  updateSchema: updateModifierSchema,
} = buildCrudSchemas(modifierShape);

export type ModifierValues = z.infer<typeof modifierSchema>;
export type UpdateModifierValues = z.infer<typeof updateModifierSchema>;

/**
 * ==============================
 * Restaurant Menu
 * ==============================
 */

const restaurantMenuShape = {
  name: requiredString("Menu name is required"),
  description: optionalString(500),

  restaurantId: optionalString(),

  isActive: optionalBoolean(true),
  isDefault: optionalBoolean(false),

  startTime: optionalString(),
  endTime: optionalString(),

  availableDays: optionalStringArray(),
};

export const {
  createSchema: restaurantMenuSchema,
  updateSchema: updateRestaurantMenuSchema,
} = buildCrudSchemas(restaurantMenuShape);

export type RestaurantMenuValues = z.infer<typeof restaurantMenuSchema>;

export type UpdateRestaurantMenuValues = z.infer<
  typeof updateRestaurantMenuSchema
>;

/**
 * ==============================
 * Menu <-> Item Link
 * ==============================
 */

export const linkMenuItemSchema = z.object({
  itemId: idSchema,

  sortOrder: optionalNumberFromInput({
    min: 0,
    integer: true,
  }).default(0),

  isAvailable: optionalBoolean(true),
});

export const updateLinkedMenuItemSchema = z.object({
  sortOrder: optionalNumberFromInput({
    min: 0,
    integer: true,
  }),

  isAvailable: z.boolean().optional(),
});

export type LinkMenuItemValues = z.infer<typeof linkMenuItemSchema>;

export type UpdateLinkedMenuItemValues = z.infer<
  typeof updateLinkedMenuItemSchema
>;

/**
 * ==============================
 * Attach Modifier Group to Item
 * ==============================
 */

export const attachModifierGroupSchema = z.object({
  itemId: idSchema,
  groupId: idSchema,
});

export type AttachModifierGroupValues = z.infer<
  typeof attachModifierGroupSchema
>;
