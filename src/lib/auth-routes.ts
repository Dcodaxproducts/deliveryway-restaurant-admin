const FALLBACK_APP_ORIGIN = "https://deliveryways.local";
const LOGIN_PATH = "/login";
const DEFAULT_REDIRECT_PATH = "/";
const MAX_REDIRECT_UNWRAP_DEPTH = 5;

const getAppOrigin = () => {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return FALLBACK_APP_ORIGIN;
};

const toInternalPath = (url: URL) => {
  const internalPath = `${url.pathname}${url.search}${url.hash}`;
  return internalPath || DEFAULT_REDIRECT_PATH;
};

const normalizeRedirectPath = (redirectPath: string, depth = 0): string => {
  if (redirectPath === LOGIN_PATH || redirectPath.startsWith(`${LOGIN_PATH}?`)) {
    if (depth >= MAX_REDIRECT_UNWRAP_DEPTH) {
      return DEFAULT_REDIRECT_PATH;
    }

    const loginUrl = new URL(redirectPath, getAppOrigin());
    const nestedRedirect = loginUrl.searchParams.get("redirect");

    if (!nestedRedirect) {
      return DEFAULT_REDIRECT_PATH;
    }

    return normalizeRedirectPath(getSafeRedirectPath(nestedRedirect), depth + 1);
  }

  return redirectPath;
};

export const getSafeRedirectPath = (redirectTo?: string | null) => {
  const rawRedirect = redirectTo?.trim();

  if (!rawRedirect || rawRedirect.startsWith("//")) {
    return DEFAULT_REDIRECT_PATH;
  }

  if (rawRedirect.startsWith("/")) {
    return normalizeRedirectPath(rawRedirect);
  }

  try {
    const appOrigin = getAppOrigin();
    const url = new URL(rawRedirect, appOrigin);

    if (url.origin !== appOrigin) {
      return DEFAULT_REDIRECT_PATH;
    }

    return normalizeRedirectPath(toInternalPath(url));
  } catch {
    return DEFAULT_REDIRECT_PATH;
  }
};

export const buildLoginRoute = (redirectTo?: string | null) => {
  const redirectPath = getSafeRedirectPath(redirectTo);

  if (redirectPath === DEFAULT_REDIRECT_PATH) {
    return LOGIN_PATH;
  }

  const params = new URLSearchParams({ redirect: redirectPath });
  return `${LOGIN_PATH}?${params.toString()}`;
};
