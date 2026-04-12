import { resolveApiUrl } from "@/lib/api/client"

export function getUserDisplayName(user) {
  if (!user) return ""
  if (user.name) return user.name
  if (user.business_name) return user.business_name
  if (user.first_name || user.last_name) {
    return `${user.first_name || ""} ${user.last_name || ""}`.trim()
  }
  if (user.owner_name) return user.owner_name
  return user.email || ""
}

export function getUserInitials(user) {
  const displayName = getUserDisplayName(user)

  if (!displayName) return "?"

  return displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function getResolvedAvatarSrc(user) {
  return resolveApiUrl(user?.avatar)
}

export function deriveUserAvatarStatus(user) {
  if (!user) return "away"

  if (user.suspended) {
    return "suspended"
  }

  if (user.role === "regular") {
    if (user.activated === false) {
      return "unverified"
    }

    if (user.available === true || user.availability_state === "available") {
      return "available"
    }

    return "away"
  }

  if (user.role === "business") {
    if (user.activated === false || user.verified === false) {
      return "unverified"
    }

    return "available"
  }

  if (user.role === "admin") {
    return "available"
  }

  if (user.activated === false) {
    return "unverified"
  }

  return user.available ? "available" : "away"
}

export function getAvatarStatusMeta(status) {
  switch (status) {
    case "available":
      return {
        label: "Available",
        dotClassName: "bg-emerald-500",
      }
    case "suspended":
      return {
        label: "Suspended",
        dotClassName: "bg-red-500",
      }
    case "unverified":
      return {
        label: "Unverified",
        dotClassName: "bg-slate-400",
      }
    case "away":
    default:
      return {
        label: "Away",
        dotClassName: "bg-amber-400",
      }
  }
}

export function formatAvatarStatusLabel(status) {
  return getAvatarStatusMeta(status).label
}
