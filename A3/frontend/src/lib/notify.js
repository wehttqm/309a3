import { toast } from "sonner"

const RECENT_TOAST_TTL_MS = 1200
const DEFAULT_DURATION_MS = 4000
const recentToasts = new Map()

function normalizeMessage(message) {
  if (message == null) return ""
  return String(message).trim()
}

function shouldShowToast(type, message) {
  const now = Date.now()
  const key = `${type}:${message}`
  const lastShownAt = recentToasts.get(key)

  for (const [recentKey, timestamp] of recentToasts.entries()) {
    if (now - timestamp > RECENT_TOAST_TTL_MS) {
      recentToasts.delete(recentKey)
    }
  }

  if (lastShownAt && now - lastShownAt < RECENT_TOAST_TTL_MS) {
    return false
  }

  recentToasts.set(key, now)
  return true
}

function showToast(type, message, options = {}) {
  const normalizedMessage = normalizeMessage(message)
  if (!normalizedMessage) return null

  if (!options.force && !shouldShowToast(type, normalizedMessage)) {
    return null
  }

  const { force, ...toastOptions } = options
  const show = toast[type] || toast.message

  return show(normalizedMessage, {
    duration: DEFAULT_DURATION_MS,
    ...toastOptions,
  })
}

export const notify = {
  success(message, options) {
    return showToast("success", message, options)
  },
  error(message, options) {
    return showToast("error", message, options)
  },
  info(message, options) {
    return showToast("info", message, options)
  },
  warning(message, options) {
    return showToast("warning", message, options)
  },
  message(message, options) {
    return showToast("message", message, options)
  },
}

export default notify
