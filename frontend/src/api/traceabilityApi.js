export function getApiUrl() {
  // Support both names so existing deployments using VITE_API_BASE_URL keep
  // working. API paths below already include /api, so remove it if the
  // configured base URL includes it.
  const configuredUrl =
    import.meta.env?.VITE_API_URL ||
    import.meta.env?.VITE_API_BASE_URL ||
    (import.meta.env?.DEV ? "http://localhost:3000" : "");

  return configuredUrl.replace(/\/+$/, "").replace(/\/api$/i, "");
}

const AUTH_TOKEN_KEY = "traceconnect_auth_token";
const AUTH_USER_KEY = "traceconnect_auth_user";
const AUTH_REFRESH_TOKEN_KEY = "traceconnect_refresh_token";

function getPersistableUser(user) {
  const persisted = { ...(user || {}) };
  ["profile_image", "company_logo"].forEach((key) => {
    if (typeof persisted[key] === "string" && (persisted[key].startsWith("data:") || persisted[key].length > 200000)) {
      delete persisted[key];
    }
  });
  return persisted;
}

export function getStoredAuth() {
  try {
    const persistent = Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
    const storage = persistent ? localStorage : sessionStorage;
    const token = storage.getItem(AUTH_TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY) || "null");
    const refreshToken = storage.getItem(AUTH_REFRESH_TOKEN_KEY);
    return token && user ? { token, user, refreshToken, remember: persistent } : null;
  } catch {
    return null;
  }
}

export function storeAuth({ access_token, refresh_token, user, remember = true }) {
  const primary = remember ? localStorage : sessionStorage;
  const secondary = remember ? sessionStorage : localStorage;
  secondary.removeItem(AUTH_TOKEN_KEY);
  secondary.removeItem(AUTH_USER_KEY);
  secondary.removeItem(AUTH_REFRESH_TOKEN_KEY);
  primary.setItem(AUTH_TOKEN_KEY, access_token);
  if (refresh_token) primary.setItem(AUTH_REFRESH_TOKEN_KEY, refresh_token);
  const persistedUser = getPersistableUser(user);
  try {
    primary.setItem(AUTH_USER_KEY, JSON.stringify(persistedUser));
  } catch (error) {
    if (error?.name !== "QuotaExceededError") throw error;
    primary.removeItem(AUTH_USER_KEY);
    primary.setItem(AUTH_USER_KEY, JSON.stringify({
      id: persistedUser.id,
      name: persistedUser.name,
      email: persistedUser.email,
      phone: persistedUser.phone,
      role: persistedUser.role,
      rawRole: persistedUser.rawRole,
      account_type: persistedUser.account_type,
      village_area: persistedUser.village_area,
      district: persistedUser.district,
      state: persistedUser.state,
      country: persistedUser.country,
      profile_location: persistedUser.profile_location,
      pincode: persistedUser.pincode,
    }));
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
}

let onUnauthorizedCallback = null;

export function setUnauthorizedCallback(callback) {
  onUnauthorizedCallback = callback;
}

function getAuthToken() {
  const stored = getStoredAuth();
  return stored?.token || null;
}

async function apiRequest(path, options = {}) {
  const performRequest = (token) => fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  let response = await performRequest(getAuthToken());
  let data = await response.json().catch(() => ({}));
  if (response.status === 401 && path !== "/api/auth/refresh") {
    const stored = getStoredAuth();
    if (stored?.refreshToken) {
      try {
        const refreshResponse = await fetch(`${getApiUrl()}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: stored.refreshToken }),
        });
        const refreshed = await refreshResponse.json().catch(() => ({}));
        if (refreshResponse.ok && refreshed.access_token) {
          storeAuth({ ...refreshed, user: stored.user, remember: stored.remember });
          response = await performRequest(refreshed.access_token);
          data = await response.json().catch(() => ({}));
        }
      } catch {
        // Keep the original request error if renewal is unavailable.
      }
    }
  }
  if (!response.ok) {
    const error = new Error(data.detail || data.error || "Request failed");
    error.status = response.status;
    if (response.status === 401) {
      clearAuth();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    throw error;
  }
  return data;
}

export const authApi = {
  login: ({ identifier, password }) => apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  }),
  signup: (payload) => apiRequest("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  sendSignupEmailOtp: (email) => apiRequest("/api/auth/signup/send-email-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  }),
  verifySignupEmailOtp: ({ email, code }) => apiRequest("/api/auth/signup/verify-email-otp", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  }),
  sendSignupPhoneOtp: ({ phone, purpose }) => apiRequest("/api/auth/signup/send-phone-otp", {
    method: "POST",
    body: JSON.stringify({ phone, purpose }),
  }),
  verifySignupPhoneOtp: ({ phone, purpose, code }) => apiRequest("/api/auth/signup/verify-phone-otp", {
    method: "POST",
    body: JSON.stringify({ phone, purpose, code }),
  }),
  forgotPassword: (identifier) => apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ identifier }),
  }),
  resetPassword: ({ email, password, confirm_password }) => apiRequest("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, password, confirm_password }),
  }),
  logout: () => apiRequest("/api/auth/logout", { method: "POST" }),
  updateProfile: (payload) => apiRequest("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  }),
  listAdminUsers: () => apiRequest("/api/auth/admin/users"),
  getAdminGiRegistryDocument: (id) => apiRequest(`/api/auth/admin/users/${encodeURIComponent(id)}/gi-registry-document`),
  updateAdminUserStatus: (id, status) => apiRequest(`/api/auth/admin/users/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }),
};

export const traceabilityApi = {
  uploadTraceabilityImage: (payload) => apiRequest("/api/traceability/media/upload", {
    method: "POST",
    body: JSON.stringify(payload),
  }),

  getTrace: (patchId) => apiRequest(`/api/traceability/trace/${encodeURIComponent(patchId)}?expand=all`),

  listFarms: () => apiRequest("/api/traceability/farms"),
  listPlantations: () => apiRequest("/api/traceability/plantations"),
  listCrops: () => apiRequest("/api/traceability/crops"),
  listMonitoringRecords: () => apiRequest("/api/traceability/monitoring-records"),
  listVerifications: () => apiRequest("/api/traceability/verifications"),
  listHarvests: () => apiRequest("/api/traceability/harvests"),
  listPackings: () => apiRequest("/api/traceability/packings"),
  listPatches: () => apiRequest("/api/traceability/patches"),
  listProcessImages: () => apiRequest("/api/traceability/process-images"),

  createPlantation: (payload) => apiRequest("/api/traceability/plantations", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  deletePlantation: (id) => apiRequest(`/api/traceability/plantations/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }),

  createCrop: (payload) => apiRequest("/api/traceability/crops", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  createSambalpuriBandhaProduct: (payload) => apiRequest("/api/traceability/sambalpuri-bandha-products", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  deleteCrop: (id) => apiRequest(`/api/traceability/crops/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }),
  updateCrop: (id, payload) => apiRequest(`/api/traceability/crops/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),

  createMonitoringRecord: (payload) => apiRequest("/api/traceability/monitoring-records", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  deleteMonitoringRecord: (id) => apiRequest(`/api/traceability/monitoring-records/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }),

  createVerification: (payload) => apiRequest("/api/traceability/verifications", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  deleteVerification: (id) => apiRequest(`/api/traceability/verifications/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }),

  createHarvest: (payload) => apiRequest("/api/traceability/harvests", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  deleteHarvest: (id) => apiRequest(`/api/traceability/harvests/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }),

  createPacking: (payload) => apiRequest("/api/traceability/packings", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  deletePacking: (id) => apiRequest(`/api/traceability/packings/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }),

  createPatch: (payload) => apiRequest("/api/traceability/patches", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  deletePatchByDbId: (id) => apiRequest(`/api/traceability/patches/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }),

  createProcessImage: (payload) => apiRequest("/api/traceability/process-images", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  updateProcessImage: (id, payload) => apiRequest(`/api/traceability/process-images/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),
  deleteProcessImage: (id) => apiRequest(`/api/traceability/process-images/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }),

  listSupplierFarmTraces: () => apiRequest("/api/traceability/supplier-traces"),
  getSupplierGrowerRecords: (growerId) => apiRequest(`/api/traceability/supplier-traces/grower/${encodeURIComponent(growerId)}`),
};
