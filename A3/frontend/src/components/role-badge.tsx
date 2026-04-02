import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const TITLES = {
  regular: "Regular User",
  business: "Business Account",
  admin: "Administrator",
}

const COLORS = {
  regular: "bg-blue-500",
  business: "bg-green-500",
  admin: "bg-orange-500",
}

export const RoleBadge = ({ role }: { role: string }) => {
  return (
    <Badge className={cn(COLORS[role], "p-4 text-lg")}>{TITLES[role]}</Badge>
  )
}
