export function formatDateTime(value) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

export function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "—"
  const amount = Number(value)
  if (Number.isNaN(amount)) return String(value)

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatSalaryRange(job) {
  const min = formatMoney(job?.salary_min)
  const max = formatMoney(job?.salary_max)
  if (min === "—" && max === "—") return "—"
  if (min === max) return min
  return `${min} – ${max}`
}

export function toLocalDateTimeInput(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function jobStatusVariant(status) {
  switch (String(status || "").toLowerCase()) {
    case "open":
      return "default"
    case "filled":
      return "secondary"
    case "completed":
      return "outline"
    case "canceled":
    case "expired":
      return "destructive"
    default:
      return "outline"
  }
}
