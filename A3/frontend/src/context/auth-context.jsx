import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useApi } from "@/context/api-context"

const AuthContext = createContext(null)
const TOKEN_KEY = "token"

function decodeJwtPayload(token) {
  try {
    const [, payload] = token.split(".")
    if (!payload) return null

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
    const decoded = atob(padded)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

function normalizeUser(rawUser, roleFromToken) {
  if (!rawUser) return null

  const role = rawUser.role || roleFromToken || null

  if (role === "business") {
    const name = rawUser.business_name || rawUser.owner_name || rawUser.email
    return {
      ...rawUser,
      role,
      name,
    }
  }

  if (role === "admin") {
    return {
      ...rawUser,
      role,
      name: rawUser.name || rawUser.first_name || rawUser.email || "Admin",
    }
  }

  const fullName = [rawUser.first_name, rawUser.last_name].filter(Boolean).join(" ")
  return {
    ...rawUser,
    role,
    name: fullName || rawUser.email,
  }
}

export function AuthProvider({ children }) {
  const api = useApi()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  const getCurrentUser = useCallback(
    async (token) => {
      const claims = decodeJwtPayload(token)
      const role = claims?.role

      if (!role) {
        throw new Error("Invalid authentication token.")
      }

      if (role === "regular") {
        const me = await api.getRegularMe(token)
        return normalizeUser(me, role)
      }

      if (role === "business") {
        const me = await api.getBusinessMe(token)
        return normalizeUser(me, role)
      }

      if (role === "admin") {
        return normalizeUser(
          {
            id: claims.id,
            role,
            name: "Admin",
          },
          role
        )
      }

      throw new Error("Unsupported user role.")
    },
    [api]
  )

  const restoreSession = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const currentUser = await getCurrentUser(token)
      setUser(currentUser)
    } catch {
      clearSession()
    } finally {
      setIsLoading(false)
    }
  }, [clearSession, getCurrentUser])

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  const login = useCallback(
    async (email, password) => {
      const data = await api.login({ email, password })
      localStorage.setItem(TOKEN_KEY, data.token)

      try {
        const currentUser = await getCurrentUser(data.token)
        setUser(currentUser)
        return currentUser
      } catch (error) {
        clearSession()
        throw error
      }
    },
    [api, clearSession, getCurrentUser]
  )

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  const registerRegular = useCallback(
    async (payload) => {
      return api.registerRegular(payload)
    },
    [api]
  )

  const registerBusiness = useCallback(
    async (payload) => {
      return api.registerBusiness(payload)
    },
    [api]
  )

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
      registerRegular,
      registerBusiness,
      refreshUser: restoreSession,
    }),
    [user, isLoading, login, logout, registerRegular, registerBusiness, restoreSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
