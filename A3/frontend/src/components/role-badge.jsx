import { Badge } from "@/components/ui/badge"

const variants = {
  regular: "secondary",
  business: "outline",
  admin: "default",
}

export function RoleBadge({ role }) {
  if (!role) return null
  return <Badge variant={variants[role] || "secondary"}>{role}</Badge>
}
