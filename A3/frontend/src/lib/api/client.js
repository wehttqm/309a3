import { createApiClient } from "@/lib/api/generated-client"

export const TOKEN_KEY = "token"
const DEFAULT_BACKEND_URL = "http://localhost:3000"

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || DEFAULT_BACKEND_URL

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function resolveApiUrl(value) {
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return `${BACKEND_URL}${value.startsWith("/") ? value : `/${value}`}`
}

export const apiClient = createApiClient({
  baseUrl: BACKEND_URL,
  getToken: getStoredToken,
})

export const authApi = {
  login: ({ email, password }) =>
    apiClient.postAuthTokens({
      body: { email, password },
    }),
  getRegularMe: (token) => apiClient.getUsersMe({ token }),
  getBusinessMe: (token) => apiClient.getBusinessesMe({ token }),
  registerRegular: (payload) =>
    apiClient.postUsers({
      body: payload,
    }),
  registerBusiness: (payload) =>
    apiClient.postBusinesses({
      body: payload,
    }),
}

export const adminApi = {
  getRegularUsers: (query) => apiClient.getUsers({ query }),
  setUserSuspended: (userId, suspended) =>
    apiClient.patchUsersUserIdSuspended({
      pathParams: { userId },
      body: { suspended },
    }),
  getBusinesses: (query) => apiClient.getBusinesses({ query }),
  setBusinessVerified: (businessId, verified) =>
    apiClient.patchBusinessesBusinessIdVerified({
      pathParams: { businessId },
      body: { verified },
    }),
}
