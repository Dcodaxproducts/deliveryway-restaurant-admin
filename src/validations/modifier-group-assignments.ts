import { getLocalizedMessage } from "@/lib/localized-message";
import { z } from "zod";

const requiredString = (message: string) => z.string().trim().min(1, message);

const numberFromInput = ({
  min,
  integer = true,
  defaultValue,
}: {
  min?: number;
  integer?: boolean;
  defaultValue?: number;
} = {}) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return defaultValue;
      }
      if (typeof value === "string") return Number(value);
      return value;
    },
    z
      .number({ invalid_type_error: getLocalizedMessage("validation069") })
      .refine((value) => !Number.isNaN(value), getLocalizedMessage("validation070"))
      .superRefine((value, context) => {
        if (integer && !Number.isInteger(value)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: getLocalizedMessage("validation071"),
          });
        }

        if (min !== undefined && value < min) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Must be at least ${min}`,
          });
        }
      })
  );

export const modifierGroupAssignmentSchema = z
  .object({
    groupId: requiredString("Modifier group is required"),
    selectionType: z.enum(["SINGLE", "MULTIPLE"], {
      required_error: getLocalizedMessage("validation107"),
    }),
    minSelect: numberFromInput({
      min: 0,
      defaultValue: 0,
    }),
    maxSelect: numberFromInput({
      min: 0,
      defaultValue: 1,
    }),
    sortOrder: numberFromInput({
      min: 0,
      defaultValue: 0,
    }),
  })
  .superRefine((value, context) => {
    if (value.maxSelect < value.minSelect) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: getLocalizedMessage("validation066"),
        path: ["maxSelect"],
      });
    }

    if (value.selectionType === "SINGLE" && value.maxSelect !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: getLocalizedMessage("validation109"),
        path: ["maxSelect"],
      });
    }
  });

export type ModifierGroupAssignmentValues = z.infer<
  typeof modifierGroupAssignmentSchema
>;

export const isRequiredModifierGroupAssignment = ({
  minSelect,
}: {
  minSelect: number;
}) => minSelect > 0;
