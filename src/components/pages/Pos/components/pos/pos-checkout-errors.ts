type PosCheckoutErrorTranslator = (key: string) => string;

type ErrorRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ErrorRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const asRecord = (value: unknown) => (isRecord(value) ? value : null);

const readString = (record: ErrorRecord | null, key: string) => {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
};

const ERROR_KEYS: Record<string, string> = {
  GUEST_CONTACT_REQUIRED: "toast.guestContactRequired",
  GUEST_EMAIL_REQUIRED: "toast.guestContactRequired",
  GUEST_PHONE_REQUIRED: "toast.guestContactRequired",
};

const LEGACY_MESSAGE_KEYS: Array<{ pattern: RegExp; key: string }> = [
  {
    pattern: /guestContact is required for guest orders/i,
    key: "toast.guestContactRequired",
  },
  {
    pattern: /(?:email|phone) is required for guest orders/i,
    key: "toast.guestContactRequired",
  },
];

export const resolvePosCheckoutErrorMessage = (
  response: unknown,
  t: PosCheckoutErrorTranslator,
  fallback: string,
) => {
  const root = asRecord(response);
  const axiosData = asRecord(asRecord(root?.response)?.data);
  const data = asRecord(root?.data);
  const envelope = axiosData ?? root;
  const envelopeError = asRecord(envelope?.error);
  const dataError = asRecord(data?.error);
  const code =
    readString(envelopeError, "code") ||
    readString(dataError, "code") ||
    readString(envelope, "code");
  const key = ERROR_KEYS[code.toUpperCase()];
  if (key) return t(key);

  const message =
    readString(envelopeError, "message") ||
    readString(dataError, "message") ||
    readString(envelope, "message") ||
    readString(data, "message") ||
    (response instanceof Error ? response.message : "");
  const legacyKey = LEGACY_MESSAGE_KEYS.find(({ pattern }) =>
    pattern.test(message),
  )?.key;

  return legacyKey ? t(legacyKey) : fallback;
};
