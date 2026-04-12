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


async function requestJson(path, options = {}) {
  const token = options.token ?? getStoredToken()
  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body:
      options.body === undefined
        ? undefined
        : options.body instanceof FormData
          ? options.body
          : JSON.stringify(options.body),
  })

  const text = await response.text()
  const payload = text ? (() => {
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  })() : null

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && (payload.error || payload.message)) ||
      (typeof payload === "string" ? payload : `Request failed with status ${response.status}.`)

    const error = new Error(message)
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

export const authApi = {
  login: ({ email, password }) =>
    apiClient.postAuthTokens({
      body: { email, password },
    }),
  requestPasswordReset: (email) =>
    apiClient.postAuthResets({
      body: { email },
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
  activateAccount: (resetToken, email) =>
    apiClient.postAuthResetsResetToken({
      pathParams: { resetToken },
      body: { email },
    }),
  resetPassword: (resetToken, email, password) =>
    apiClient.postAuthResetsResetToken({
      pathParams: { resetToken },
      body: { email, password },
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
  getPositionTypes: (query) => apiClient.getPositionTypes({ query }),
  createPositionType: (payload) =>
    apiClient.postPositionTypes({
      body: payload,
    }),
  updatePositionType: (positionTypeId, payload) =>
    apiClient.patchPositionTypesPositionTypeId({
      pathParams: { positionTypeId },
      body: payload,
    }),
  deletePositionType: (positionTypeId) =>
    apiClient.deletePositionTypesPositionTypeId({
      pathParams: { positionTypeId },
    }),
  getQualifications: (query) => apiClient.getQualifications({ query }),
  getQualification: (qualificationId) =>
    apiClient.getQualificationsQualificationId({
      pathParams: { qualificationId },
    }),
  updateQualification: (qualificationId, body) =>
    apiClient.patchQualificationsQualificationId({
      pathParams: { qualificationId },
      body,
    }),
  getResetCooldown: () => apiClient.getSystemResetCooldown(),
  setResetCooldown: (reset_cooldown) =>
    apiClient.patchSystemResetCooldown({
      body: { reset_cooldown },
    }),
  getNegotiationWindow: () => apiClient.getSystemNegotiationWindow(),
  setNegotiationWindow: (negotiation_window) =>
    apiClient.patchSystemNegotiationWindow({
      body: { negotiation_window },
    }),
  getJobStartWindow: () => apiClient.getSystemJobStartWindow(),
  setJobStartWindow: (job_start_window) =>
    apiClient.patchSystemJobStartWindow({
      body: { job_start_window },
    }),
  getAvailabilityTimeout: () => apiClient.getSystemAvailabilityTimeout(),
  setAvailabilityTimeout: (availability_timeout) =>
    apiClient.patchSystemAvailabilityTimeout({
      body: { availability_timeout },
    }),
}


export const positionTypeApi = {
  list: (query) => apiClient.getPositionTypes({ query }),
}

export const qualificationApi = {
  list: (query) => apiClient.getQualifications({ query }),
  listMine: (query) => apiClient.getUsersMeQualifications({ query }),
  create: (payload) => apiClient.postQualifications({ body: payload }),
  getById: (qualificationId) =>
    apiClient.getQualificationsQualificationId({
      pathParams: { qualificationId },
    }),
  update: (qualificationId, body) =>
    apiClient.patchQualificationsQualificationId({
      pathParams: { qualificationId },
      body,
    }),
  uploadDocument: (qualificationId, fileOrBody) =>
    apiClient.putQualificationsQualificationIdDocument({
      pathParams: { qualificationId },
      body: fileOrBody,
    }),
}


export const regularJobsApi = {
  listMine: (query) => apiClient.getUsersMeJobs({ query }),
}



export const availabilityApi = {
  updateMine: (available) =>
    requestJson("/users/me/available", {
      method: "PATCH",
      body: { available },
    }),
}

export const dashboardApi = {
  getRegularDashboard: () => requestJson("/users/me/dashboard"),
  getBusinessDashboard: () => requestJson("/businesses/me/dashboard"),
}
