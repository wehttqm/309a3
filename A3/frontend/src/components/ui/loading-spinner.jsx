import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function LoadingSpinner({ className, label = "Loading", withLabel = false }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)} role="status" aria-live="polite">
      <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
      {withLabel ? <span className="text-sm text-muted-foreground">{label}</span> : null}
    </span>
  )
}
