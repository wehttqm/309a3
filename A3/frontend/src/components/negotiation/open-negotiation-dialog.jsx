import { useMemo } from "react"
import { useAuth } from "@/context/auth-context"
import { getUserDisplayName } from "@/lib/user-status"
import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function formatDateTime(value) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString()
}

function PersonPreview({ label, user }) {
  if (!user) return null

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
      <UserAvatar user={user} className="h-12 w-12" fallbackClassName="text-sm" showStatus={false} />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{getUserDisplayName(user)}</p>
        {user.subtitle ? <p className="truncate text-sm text-muted-foreground">{user.subtitle}</p> : null}
      </div>
    </div>
  )
}

export function OpenNegotiationDialog({
  open,
  onOpenChange,
  negotiation,
  isLoading = false,
  onConfirm,
}) {
  const { user } = useAuth()

  const preview = useMemo(() => {
    if (!negotiation) {
      return { me: null, otherParty: null, title: "Negotiation", shiftText: "—", payText: "—" }
    }

    const negotiationUser = negotiation.user || negotiation.candidate || null
    const candidate = negotiationUser
      ? {
          ...negotiationUser,
          role: "regular",
          name: negotiationUser.name || `${negotiationUser.first_name || ""} ${negotiationUser.last_name || ""}`.trim(),
          subtitle: "Regular user",
        }
      : null

    const negotiationBusiness = negotiation.business || negotiation.job?.business || null
    const business = negotiationBusiness
      ? {
          ...negotiationBusiness,
          role: "business",
          name: negotiationBusiness.name || negotiationBusiness.business_name,
          subtitle: "Business",
        }
      : null

    const isRegular = user?.role === "regular"
    const me = isRegular
      ? {
          ...candidate,
          id: user?.id || candidate?.id,
          first_name: user?.first_name || candidate?.first_name,
          last_name: user?.last_name || candidate?.last_name,
          avatar: user?.avatar || candidate?.avatar,
          name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || candidate?.name || user?.name,
          role: "regular",
          subtitle: "Regular user",
        }
      : {
          ...business,
          id: user?.id || business?.id,
          business_name: user?.business_name || business?.business_name,
          avatar: user?.avatar || business?.avatar,
          name: user?.business_name || business?.name,
          role: "business",
          subtitle: "Business",
        }
    const otherParty = isRegular ? business : candidate

    return {
      me,
      otherParty,
      title: negotiation.job?.position_type?.name || `Job #${negotiation.job?.id || negotiation.id}`,
      shiftText: `${formatDateTime(negotiation.job?.start_time)} — ${formatDateTime(negotiation.job?.end_time)}`,
      payText:
        negotiation.job?.salary_min != null && negotiation.job?.salary_max != null
          ? `$${negotiation.job.salary_min} — $${negotiation.job.salary_max}`
          : "—",
    }
  }, [negotiation, user?.role])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Open negotiation window</DialogTitle>
          <DialogDescription>
            You are about to open the live negotiation window for <span className="font-medium text-foreground">{preview.title}</span>.
            Review the other party and shift details before continuing.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <PersonPreview label="You" user={preview.me} />
          <PersonPreview label="Other party" user={preview.otherParty} />
        </div>

        <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium text-foreground">{preview.title}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Shift</span>
            <span className="text-right font-medium text-foreground">{preview.shiftText}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Pay</span>
            <span className="font-medium text-foreground">{preview.payText}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading || !negotiation}>
            {isLoading ? (<><LoadingSpinner className="text-primary-foreground" /> Opening...</>) : "Open window"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
