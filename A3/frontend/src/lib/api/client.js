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
