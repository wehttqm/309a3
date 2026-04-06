import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { io } from "socket.io-client"
import { useAuth } from "@/context/auth-context"
import { BACKEND_URL, getStoredToken } from "@/lib/api/client"

const SocketContext = createContext(null)

function notificationKey(userId) {
  return `notifications:${userId}`
}

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!user?.id || !["regular", "business"].includes(user.role)) {
      setNotifications([])
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      return
    }

    const stored = localStorage.getItem(notificationKey(user.id))
    setNotifications(stored ? JSON.parse(stored) : [])

    const token = getStoredToken()
    if (!token) return

    const socket = io(BACKEND_URL, { auth: { token } })
    socketRef.current = socket

    socket.on("negotiation:started", (payload) => {
      setNotifications((current) => {
        const next = [
          {
            id: `${payload.negotiation_id}:${Date.now()}`,
            type: "negotiation_started",
            negotiation_id: payload.negotiation_id,
            createdAt: new Date().toISOString(),
            read: false,
          },
          ...current,
        ]
        localStorage.setItem(notificationKey(user.id), JSON.stringify(next))
        return next
      })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user?.id, user?.role])

  const markAllRead = () => {
    if (!user?.id) return
    setNotifications((current) => {
      const next = current.map((item) => ({ ...item, read: true }))
      localStorage.setItem(notificationKey(user.id), JSON.stringify(next))
      return next
    })
  }

  const removeNotification = (id) => {
    if (!user?.id) return
    setNotifications((current) => {
      const next = current.filter((item) => item.id !== id)
      localStorage.setItem(notificationKey(user.id), JSON.stringify(next))
      return next
    })
  }

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      notifications,
      unreadCount: notifications.filter((item) => !item.read).length,
      markAllRead,
      removeNotification,
    }),
    [notifications]
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
