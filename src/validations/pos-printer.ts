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

/**
 * The API stores a synthetic email alias for username-only accounts so the shared staff
 * email uniqueness and the email-based login DTO keep working. Keep in sync with
 * `PosPrinterService.create` in the platform API.
 */
export const POS_PRINTER_LOGIN_EMAIL_DOMAIN = "pos-printer.feastflow.local";

export const normalizePosPrinterUsername = (value: string) => value.trim().toLowerCase();

export const normalizePosPrinterDisplayName = (value: string) =>
  value.trim().split(/\s+/).filter(Boolean).join(" ");

export const buildPosPrinterLoginEmail = (username: string) =>
  `${normalizePosPrinterUsername(username)}@${POS_PRINTER_LOGIN_EMAIL_DOMAIN}`;

/** Returns the username encoded in a synthetic login email, or null for real emails. */
export const getPosPrinterUsernameFromEmail = (email: string | null | undefined) => {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  const suffix = `@${POS_PRINTER_LOGIN_EMAIL_DOMAIN}`;
  if (!normalized.endsWith(suffix)) return null;
  const username = normalized.slice(0, -suffix.length);
  return POS_PRINTER_USERNAME_PATTERN.test(username) ? username : null;
};

export const isEmailLikeIdentifier = (identifier: string) => identifier.includes("@");

/**
 * The dedicated `/auth/pos-printer/login` endpoint accepts an email. Usernames map to the
 * synthetic alias the API assigns at creation, so both legacy email accounts and
 * username accounts sign in through the same field.
 */
export const resolvePosPrinterLoginEmail = (identifier: string) => {
  const trimmed = identifier.trim();
  return isEmailLikeIdentifier(trimmed)
    ? trimmed.toLowerCase()
    : buildPosPrinterLoginEmail(trimmed);
};

/**
 * Legacy `firstName`/`lastName` derivation identical to the API fallback so accounts created
 * against an older API version display the same way as accounts created against the new one.
 */
export const splitPosPrinterDisplayName = (displayName: string) => {
  const parts = normalizePosPrinterDisplayName(displayName).split(" ").filter(Boolean);
  return {
    firstName: parts[0] ?? displayName.trim(),
    lastName: parts.slice(1).join(" ") || "Printer",
  };
};

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

export const posPrinterLoginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, { message: POS_PRINTER_ERROR_CODES.identifierRequired })
    .refine(
      (value) =>
        !isEmailLikeIdentifier(value) || z.string().email().safeParse(value).success,
      { message: POS_PRINTER_ERROR_CODES.identifierEmailInvalid }
    ),
  password: z.string().min(1, { message: POS_PRINTER_ERROR_CODES.passwordRequired }),
});

export type PosPrinterLoginValues = z.infer<typeof posPrinterLoginSchema>;
