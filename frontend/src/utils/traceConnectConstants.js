import { getApiUrl } from "../api/traceabilityApi";

export const API_URL = getApiUrl();
export const TRACE_CONNECT_LOGO_SRC = "/Traceconnect Logo.svg";
export const TRACE_CONNECT_LOGO_TEXT_SRC = "/Traceconnect Logo Text.svg";

export function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
