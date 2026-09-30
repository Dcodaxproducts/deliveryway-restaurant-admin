import { z } from "zod";

/**
 * POS printer credential rules mirror `CreatePosPrinterAccountDto` in the platform API
 * (`src/modules/pos-printer/dto.ts`): usernames are lowercased, 3–32 characters, start with a
 * letter or digit, and may contain `.`, `_`, or `-`; display names are 2–100 characters;
 * passwords need at least 12 characters.
 *
 * Validation messages are message codes resolved through `posPrinter.errors.*` so English and
 * German stay in parity at the presentation layer.
 */
export const POS_PRINTER_ERROR_CODES = {
  displayNameLength: "displayNameLength",
  usernameLength: "usernameLength",
  usernameFormat: "usernameFormat",
  passwordMin: "passwordMin",
  branchRequired: "branchRequired",
  identifierRequired: "identifierRequired",
  identifierEmailInvalid: "identifierEmailInvalid",
  passwordRequired: "passwordRequired",
} as const;

export type PosPrinterErrorCode =
  (typeof POS_PRINTER_ERROR_CODES)[keyof typeof POS_PRINTER_ERROR_CODES];

export const isPosPrinterErrorCode = (value: unknown): value is PosPrinterErrorCode =>
  typeof value === "string" &&
  Object.values(POS_PRINTER_ERROR_CODES).includes(value as PosPrinterErrorCode);

export const POS_PRINTER_USERNAME_MIN = 3;
export const POS_PRINTER_USERNAME_MAX = 32;
export const POS_PRINTER_USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;
export const POS_PRINTER_DISPLAY_NAME_MIN = 2;
export const POS_PRINTER_DISPLAY_NAME_MAX = 100;
export const POS_PRINTER_PASSWORD_MIN = 12;
/** `PosPrinterLoginDto.identifier` bounds (username or legacy account email). */
export const POS_PRINTER_IDENTIFIER_MIN = 3;
export const POS_PRINTER_IDENTIFIER_MAX = 254;

export const normalizePosPrinterUsername = (value: string) => value.trim().toLowerCase();

export const normalizePosPrinterDisplayName = (value: string) =>
  value.trim().split(/\s+/).filter(Boolean).join(" ");

/**
 * Login identifiers are compared case-insensitively by the API; normalizing here keeps the
 * request byte-identical to what the API stores for both usernames and legacy emails.
 */
export const normalizePosPrinterIdentifier = (value: string) => value.trim().toLowerCase();

export const isEmailLikeIdentifier = (identifier: string) => identifier.includes("@");

export const posPrinterDisplayNameSchema = z
  .string()
  .transform(normalizePosPrinterDisplayName)
  .refine(
    (value) =>
      value.length >= POS_PRINTER_DISPLAY_NAME_MIN &&
      value.length <= POS_PRINTER_DISPLAY_NAME_MAX,
    { message: POS_PRINTER_ERROR_CODES.displayNameLength }
  );

export const posPrinterUsernameSchema = z
  .string()
  .transform(normalizePosPrinterUsername)
  .superRefine((value, ctx) => {
    if (value.length < POS_PRINTER_USERNAME_MIN || value.length > POS_PRINTER_USERNAME_MAX) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: POS_PRINTER_ERROR_CODES.usernameLength });
      return;
    }
    if (!POS_PRINTER_USERNAME_PATTERN.test(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: POS_PRINTER_ERROR_CODES.usernameFormat });
    }
  });

export const posPrinterPasswordSchema = z
  .string()
  .min(POS_PRINTER_PASSWORD_MIN, { message: POS_PRINTER_ERROR_CODES.passwordMin });

export const buildPosPrinterAccountCreateSchema = ({
  requireBranch,
}: {
  requireBranch: boolean;
}) =>
  z.object({
    displayName: posPrinterDisplayNameSchema,
    username: posPrinterUsernameSchema,
    password: posPrinterPasswordSchema,
    branchId: requireBranch
      ? z.string().trim().min(1, { message: POS_PRINTER_ERROR_CODES.branchRequired })
      : z.string().trim(),
  });

export type PosPrinterAccountCreateValues = z.infer<
  ReturnType<typeof buildPosPrinterAccountCreateSchema>
>;

/**
 * Mirrors `PosPrinterLoginDto`: one `identifier` (username or legacy email) and a password.
 * Emails are only validated for shape; the API decides which account they belong to.
 */
export const posPrinterLoginSchema = z.object({
  identifier: z
    .string()
    .transform(normalizePosPrinterIdentifier)
    .superRefine((value, ctx) => {
      if (!value) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: POS_PRINTER_ERROR_CODES.identifierRequired });
        return;
      }
      if (isEmailLikeIdentifier(value) && !z.string().email().safeParse(value).success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: POS_PRINTER_ERROR_CODES.identifierEmailInvalid });
        return;
      }
      if (value.length < POS_PRINTER_IDENTIFIER_MIN || value.length > POS_PRINTER_IDENTIFIER_MAX) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: POS_PRINTER_ERROR_CODES.identifierRequired });
      }
    }),
  password: z.string().min(1, { message: POS_PRINTER_ERROR_CODES.passwordRequired }),
});

export type PosPrinterLoginValues = z.infer<typeof posPrinterLoginSchema>;
