import { createContext, useContext, useMemo } from "react"

const DEFAULT_BACKEND_URL = "http://localhost:3000"
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || DEFAULT_BACKEND_URL

const ApiContext = createContext(null)

function safeParse(text) {
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function getErrorMessage(payload, fallback) {
  if (!payload) return fallback
  if (typeof payload === "string") return payload
  return payload.error || payload.message || fallback
}

export function ApiProvider({ children }) {
  const api = useMemo(() => {
    async function request(path, options = {}) {
      const {
        method = "GET",
        body,
        token,
        headers: customHeaders = {},
        ...rest
      } = options

      const headers = new Headers(customHeaders)

      if (token) {
        headers.set("Authorization", `Bearer ${token}`)
      }

      let requestBody = body
      if (body !== undefined && !(body instanceof FormData)) {
        headers.set("Content-Type", "application/json")
        requestBody = JSON.stringify(body)
      }

      const response = await fetch(`${BACKEND_URL}${path}`, {
        method,
        headers,
        body: requestBody,
        ...rest,
      })

      const raw = await response.text()
      const payload = safeParse(raw)

      if (!response.ok) {
        const error = new Error(
          getErrorMessage(
            payload,
            `Request failed with status ${response.status}`
          )
        )
        error.status = response.status
        error.payload = payload
        throw error
      }

      return payload
    }

    return {
      backendUrl: BACKEND_URL,
      request,
      login: ({ email, password }) =>
        request("/auth/tokens", {
          method: "POST",
          body: { email, password },
        }),
      getRegularMe: (token) =>
        request("/users/me", {
          token,
        }),
      getBusinessMe: (token) =>
        request("/businesses/me", {
          token,
        }),
      registerRegular: (payload) =>
        request("/users", {
          method: "POST",
          body: payload,
        }),
      registerBusiness: (payload) =>
        request("/businesses", {
          method: "POST",
          body: payload,
        }),
    }
  }, [])

  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
}

export function useApi() {
  const context = useContext(ApiContext)

  if (!context) {
    throw new Error("useApi must be used within an ApiProvider")
  }

  return context
}
