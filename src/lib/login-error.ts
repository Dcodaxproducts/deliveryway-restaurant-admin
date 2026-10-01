import axios from "axios";

export type LoginErrorKey =
  | "invalidCredentials"
  | "loginRateLimited"
  | "loginNetworkError"
  | "genericError";

export function getLoginErrorKey(error: unknown): LoginErrorKey {
  if (!axios.isAxiosError(error)) return "genericError";

  if (error.response?.status === 401) return "invalidCredentials";
  if (error.response?.status === 429) return "loginRateLimited";
  if (!error.response) return "loginNetworkError";

  return "genericError";
}
