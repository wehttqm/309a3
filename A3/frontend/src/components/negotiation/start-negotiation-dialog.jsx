import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function PersonPreview({ label, user }) {
  if (!user) return null

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
      <UserAvatar user={user} className="h-12 w-12" fallbackClassName="text-sm" showStatus={false} />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{user.name || user.business_name || `${user.first_name || ""} ${user.last_name || ""}`.trim()}</p>
        {user.subtitle ? <p className="truncate text-sm text-muted-foreground">{user.subtitle}</p> : null}
      </div>
    </div>
  )
}

export function StartNegotiationDialog({
  open,
  onOpenChange,
  target,
  isSubmitting = false,
  onConfirm,
}) {
  const candidate = target?.candidate || null
  const business = target?.business || null
  const title = target?.positionName || target?.title || "this role"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Start negotiation</DialogTitle>
          <DialogDescription>
            This opens the exclusive negotiation window for <span className="font-medium text-foreground">{title}</span>.
            While the negotiation is active, neither side can negotiate conflicting opportunities.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <PersonPreview label="Candidate" user={candidate} />
          <PersonPreview label="Business" user={business} />
        </div>

        {target?.helperText ? (
          <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            {target.helperText}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Starting..." : "Start negotiation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
