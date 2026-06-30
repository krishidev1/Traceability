export function getApiUrl() {
  //return "http://localhost:5000";
   return import.meta.env.VITE_API_URL;
}

const AUTH_TOKEN_KEY = "traceconnect_auth_token";
const AUTH_USER_KEY = "traceconnect_auth_user";

export function getStoredAuth() {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY) || "null");
    return token && user ? { token, user } : null;
  } catch {
    return null;
  }
}

export function storeAuth({ access_token, user, remember = true }) {
  const primary = remember ? localStorage : sessionStorage;
  const secondary = remember ? sessionStorage : localStorage;
  secondary.removeItem(AUTH_TOKEN_KEY);
  secondary.removeItem(AUTH_USER_KEY);
  primary.setItem(AUTH_TOKEN_KEY, access_token);
  primary.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
}

function getAuthToken() {
  const stored = getStoredAuth();
  return stored?.token || null;
}

async function apiRequest(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || data.error || "Request failed");
    error.status = response.status;
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
  forgotPassword: (identifier) => apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ identifier }),
  }),
  logout: () => apiRequest("/api/auth/logout", { method: "POST" }),
};

export const traceabilityApi = {
  uploadTraceabilityImage: (payload) => apiRequest("/api/traceability/media/upload", {
    method: "POST",
    body: JSON.stringify(payload),
  }),

  getTrace: (patchId) => apiRequest(`/api/traceability/trace/${encodeURIComponent(patchId)}`),

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
  deleteProcessImage: (id) => apiRequest(`/api/traceability/process-images/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }),

  listSupplierFarmTraces: () => apiRequest("/api/traceability/supplier-traces"),
  getSupplierGrowerRecords: (growerId) => apiRequest(`/api/traceability/supplier-traces/grower/${encodeURIComponent(growerId)}`),
};
