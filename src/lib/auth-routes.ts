const FALLBACK_APP_ORIGIN = "https://deliveryways.local";
const LOGIN_PATH = "/login";
const DEFAULT_REDIRECT_PATH = "/";

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

export const getSafeRedirectPath = (redirectTo?: string | null) => {
  const rawRedirect = redirectTo?.trim();

  if (!rawRedirect || rawRedirect.startsWith("//")) {
    return DEFAULT_REDIRECT_PATH;
  }

  if (rawRedirect.startsWith("/")) {
    return rawRedirect;
  }

  try {
    const appOrigin = getAppOrigin();
    const url = new URL(rawRedirect, appOrigin);

    if (url.origin !== appOrigin) {
      return DEFAULT_REDIRECT_PATH;
    }

    return toInternalPath(url);
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
