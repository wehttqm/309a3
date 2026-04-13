export function getRegularNegotiationBlockReason(user) {
  if (!user || user.role !== "regular") return ""

  if (!user.activated) {
    return "Activate your account before starting a negotiation."
  }

  if (user.suspended) {
    return "Your account is suspended, so you cannot negotiate right now."
  }

  if (!user.available) {
    return (
      user.availability_message ||
      (user.availability_state === "inactive"
        ? "Your availability timed out because of inactivity. Turn it back on before starting a negotiation."
        : "Turn availability on before starting a negotiation.")
    )
  }

  return ""
}

export function canRegularUserStartNegotiation(user) {
  return !getRegularNegotiationBlockReason(user)
}

function formatWaitSeconds(seconds) {
  const total = Number(seconds)
  if (!Number.isFinite(total) || total <= 0) return ""
  const minutes = Math.floor(total / 60)
  const remainder = total % 60
  if (minutes > 0 && remainder > 0) return `${minutes}m ${remainder}s`
  if (minutes > 0) return `${minutes}m`
  return `${remainder}s`
}

export function getNegotiationStartErrorMessage(error, user) {
  const payload = error?.payload || {}
  const code = payload?.code
  const fallbackMessage = error?.message || "Unable to start negotiation."

  if (code === "not_discoverable") {
    const reasons = Array.isArray(payload?.details?.reasons) ? payload.details.reasons : []
    if (reasons.length > 0) {
      return reasons[0].message || fallbackMessage
    }
    return getRegularNegotiationBlockReason(user) || "You are no longer discoverable for this job."
  }

  if (code === "job_not_open") {
    return "This job is no longer open, so negotiation cannot be started."
  }

  if (code === "interest_not_mutual") {
    return "Negotiation can only start after both sides have expressed interest."
  }

  if (code === "active_negotiation_block") {
    const waitLabel = formatWaitSeconds(payload?.blocking?.wait_seconds)
    return waitLabel
      ? `Another active negotiation is blocking this match. Try again in about ${waitLabel}.`
      : "Another active negotiation is blocking this match right now."
  }

  if (/not discoverable/i.test(fallbackMessage)) {
    return getRegularNegotiationBlockReason(user) || "You are no longer discoverable for this job."
  }

  if (/no longer available for negotiation/i.test(fallbackMessage) || /job is no longer/i.test(fallbackMessage)) {
    return "This job is no longer open, so negotiation cannot be started."
  }

  if (/not mutual/i.test(fallbackMessage)) {
    return "Negotiation can only start after both sides have expressed interest."
  }

  return fallbackMessage
}
