import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { io } from "socket.io-client"
import { useAuth } from "@/context/auth-context"
import { BACKEND_URL, apiClient, getStoredToken, requestJson } from "@/lib/api/client"

const SocketContext = createContext(null)
const PAGE_LIMIT = 100
const MAX_PAGES = 20

function notificationKey(userId) {
  return `notifications:${userId}`
}

function readStoredJson(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function persistStoredJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function showBrowserNotification(notification) {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return
  }

  if (Notification.permission !== "granted") {
    return
  }

  if (document.visibilityState === "visible") {
    return
  }

  try {
    new Notification(notification.title, { body: notification.message })
  } catch {
    // Ignore browser notification failures.
  }
}

async function fetchAllPages(loader) {
  let page = 1
  let count = 0
  let results = []

  while (page <= MAX_PAGES) {
    const data = await loader({ page, limit: PAGE_LIMIT })
    const nextResults = data?.results || []
    count = data?.count || 0
    results = [...results, ...nextResults]

    if (results.length >= count || nextResults.length === 0) {
      break
    }

    page += 1
  }

  return results
}

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [notifications, setNotifications] = useState([])
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false)
  const [isNegotiationPromptOpen, setIsNegotiationPromptOpen] = useState(false)
  const [isNegotiationPreviewLoading, setIsNegotiationPreviewLoading] = useState(false)
  const [negotiationPreview, setNegotiationPreview] = useState(null)
  const [currentNegotiation, setCurrentNegotiation] = useState(null)
  const currentNegotiationRef = useRef(null)

  const persistNotifications = useCallback(
    (value) => {
      if (!user?.id) return
      persistStoredJson(notificationKey(user.id), value)
    },
    [user?.id]
  )

  const refreshNegotiationState = useCallback(async () => {
    if (!user?.id || !["regular", "business"].includes(user.role)) {
      setCurrentNegotiation(null)
      return null
    }

    try {
      const payload = await requestJson("/negotiations")
      setCurrentNegotiation(payload?.current || null)
      return payload
    } catch {
      setCurrentNegotiation(null)
      return null
    }
  }, [user?.id, user?.role])

  useEffect(() => {
    currentNegotiationRef.current = currentNegotiation
  }, [currentNegotiation])

  const addNotification = useCallback(
    (input) => {
      if (!user?.id) return

      setNotifications((current) => {
        if (input.dedupeKey && current.some((item) => item.dedupeKey === input.dedupeKey)) {
          return current
        }

        const next = [
          {
            id: input.id || `${input.type || "notification"}:${Date.now()}`,
            type: input.type || "general",
            title: input.title || "Notification",
            message: input.message || "You have a new notification.",
            href: input.href || "/notifications",
            read: false,
            createdAt: input.createdAt || new Date().toISOString(),
            dedupeKey: input.dedupeKey || null,
            negotiation_id: input.negotiation_id ?? null,
          },
          ...current,
        ]

        persistNotifications(next)
        showBrowserNotification(next[0])
        return next
      })
    },
    [persistNotifications, user?.id]
  )

  const removeNotification = useCallback(
    (id) => {
      if (!user?.id) return

      setNotifications((current) => {
        const next = current.filter((item) => item.id !== id)
        persistNotifications(next)
        return next
      })
    },
    [persistNotifications, user?.id]
  )

  const markAllRead = useCallback(() => {
    if (!user?.id) return

    setNotifications((current) => {
      const next = current.map((item) => ({ ...item, read: true }))
      persistNotifications(next)
      return next
    })
  }, [persistNotifications, user?.id])

  const openNegotiation = useCallback(async (negotiationInput = null) => {
    const initialPreview = negotiationInput || currentNegotiationRef.current

    if (initialPreview) {
      setNegotiationPreview(initialPreview)
      setIsNegotiationPromptOpen(true)
      return
    }

    setIsNegotiationPreviewLoading(true)
    try {
      const payload = await refreshNegotiationState()
      const preview = payload?.current || null
      if (!preview) return
      setNegotiationPreview(preview)
      setIsNegotiationPromptOpen(true)
    } finally {
      setIsNegotiationPreviewLoading(false)
    }
  }, [refreshNegotiationState])

  const confirmOpenNegotiation = useCallback(() => {
    setIsNegotiationPromptOpen(false)
    setIsNegotiationOpen(true)
  }, [])

  const closeNegotiationPrompt = useCallback(() => {
    setIsNegotiationPromptOpen(false)
    setNegotiationPreview(null)
  }, [])

  const closeNegotiation = useCallback(() => {
    setIsNegotiationOpen(false)
  }, [])

  useEffect(() => {
    if (!user?.id || !["regular", "business"].includes(user.role)) {
      setNotifications([])
      setIsNegotiationOpen(false)
      setIsNegotiationPromptOpen(false)
      setNegotiationPreview(null)
      setCurrentNegotiation(null)
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      return
    }

    setNotifications(readStoredJson(notificationKey(user.id), []))
    refreshNegotiationState()

    const token = getStoredToken()
    if (!token) return

    const socket = io(BACKEND_URL, { auth: { token } })
    socketRef.current = socket

    socket.on("negotiation:started", (payload) => {
      addNotification({
        type: "negotiation_started",
        negotiation_id: payload.negotiation_id,
        title: "Negotiation started",
        message: `Negotiation #${payload.negotiation_id} has started.`,
        href: "/negotiations",
        dedupeKey: `negotiation-started:${payload.negotiation_id}`,
      })
      refreshNegotiationState()
      openNegotiation(payload?.negotiation || null)
    })

    socket.on("negotiation:completed", () => {
      refreshNegotiationState()
    })

    socket.on("negotiation:decision", () => {
      refreshNegotiationState()
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [addNotification, openNegotiation, refreshNegotiationState, user?.id, user?.role])

  useEffect(() => {
    if (!user?.id || !["regular", "business"].includes(user.role)) {
      return undefined
    }

    let isCancelled = false

    const pollNegotiationReadyNotifications = async () => {
      try {
        const negotiationsPayload = await requestJson("/negotiations")
        if (isCancelled) return

        if (negotiationsPayload?.current) {
          return
        }

        if (user.role === "regular") {
          const interests = await fetchAllPages((query) =>
            apiClient.getUsersMeInterests({ query: { ...query, mutual: true } })
          )
          if (isCancelled) return

          for (const interest of interests) {
            if (!interest?.interest_id || !interest?.job?.id) continue

            addNotification({
              type: "negotiation_ready",
              title: "Ready to negotiate",
              message: `${interest.job?.business?.business_name || "A business"} is ready to negotiate${interest.job?.position_type?.name ? ` for ${interest.job.position_type.name}` : ""}.`,
              href: "/negotiations",
              dedupeKey: `negotiation-ready:${interest.interest_id}`,
            })
          }
          return
        }

        const jobs = await fetchAllPages((query) => apiClient.getBusinessesMeJobs({ query }))
        if (isCancelled) return

        const openJobs = jobs.filter((job) => job?.status === "open")
        for (const job of openJobs) {
          const interests = await fetchAllPages((query) =>
            apiClient.getJobsJobIdInterests({
              pathParams: { jobId: job.id },
              query,
            })
          )
          if (isCancelled) return

          for (const interest of interests) {
            if (!interest?.mutual || !interest?.interest_id) continue

            addNotification({
              type: "negotiation_ready",
              title: "Candidate ready to negotiate",
              message: `${interest.user?.first_name || "A candidate"}${interest.user?.last_name ? ` ${interest.user.last_name}` : ""} is ready to negotiate${job?.position_type?.name ? ` for ${job.position_type.name}` : ""}.`,
              href: "/negotiations",
              dedupeKey: `negotiation-ready:${interest.interest_id}`,
            })
          }
        }
      } catch {
        // Background notification polling is best-effort.
      }
    }

    pollNegotiationReadyNotifications()
    const intervalId = window.setInterval(pollNegotiationReadyNotifications, 30000)

    return () => {
      isCancelled = true
      window.clearInterval(intervalId)
    }
  }, [addNotification, user?.id, user?.role])

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      notifications,
      unreadCount: notifications.filter((item) => !item.read).length,
      markAllRead,
      removeNotification,
      addNotification,
      isNegotiationOpen,
      isNegotiationPromptOpen,
      isNegotiationPreviewLoading,
      negotiationPreview,
      openNegotiation,
      confirmOpenNegotiation,
      closeNegotiationPrompt,
      closeNegotiation,
      currentNegotiation,
      hasActiveNegotiation: Boolean(currentNegotiation),
      refreshNegotiationState,
    }),
    [
      addNotification,
      closeNegotiation,
      closeNegotiationPrompt,
      confirmOpenNegotiation,
      currentNegotiation,
      isNegotiationOpen,
      isNegotiationPreviewLoading,
      isNegotiationPromptOpen,
      markAllRead,
      negotiationPreview,
      notifications,
      openNegotiation,
      refreshNegotiationState,
      removeNotification,
    ]
  )

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}
