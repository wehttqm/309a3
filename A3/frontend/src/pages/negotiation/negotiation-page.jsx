import { useCallback, useEffect, useMemo, useState } from "react"
import { requestJson } from "@/lib/api/client"
import { getNegotiationStartErrorMessage, getRegularNegotiationBlockReason } from "@/lib/negotiation"
import { useAuth } from "@/context/auth-context"
import { useSocket } from "@/context/socket-context"
import { UserAvatar } from "@/components/user-avatar"
import { isJobNegotiable } from "@/components/jobs/job-utils"
import { getUserDisplayName } from "@/lib/user-status"
import { StartNegotiationDialog } from "@/components/negotiation/start-negotiation-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function formatDateTime(value) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString()
}

function StatusBadge({ status }) {
  const variant = status === "success" || status === "active" ? "default" : status === "failed" ? "secondary" : "outline"
  return <Badge variant={variant}>{status || "unknown"}</Badge>
}

function PersonRow({ label, user, subtitle }) {
  if (!user) return null

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3">
      <UserAvatar user={user} className="h-11 w-11" fallbackClassName="text-xs" showStatus={false} />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{getUserDisplayName(user)}</p>
        {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  )
}

function CurrentNegotiationCard({ negotiation, onOpen }) {
  if (!negotiation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Negotiation</CardTitle>
          <CardDescription>No active negotiation at the moment.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const candidate = {
    ...negotiation.user,
    role: "regular",
    name: `${negotiation.user?.first_name || ""} ${negotiation.user?.last_name || ""}`.trim(),
  }
  const business = {
    ...negotiation.job?.business,
    role: "business",
    name: negotiation.job?.business?.business_name,
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Current Negotiation</CardTitle>
            <CardDescription>{negotiation.job?.position_type?.name || `Negotiation #${negotiation.id}`}</CardDescription>
          </div>
          <StatusBadge status={negotiation.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <PersonRow label="Candidate" user={candidate} />
          <PersonRow label="Business" user={business} />
        </div>

        <div className="grid gap-2 rounded-xl border bg-muted/20 p-4 text-sm">
          <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Window ends</span><span className="font-medium">{formatDateTime(negotiation.expiresAt)}</span></div>
          <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Shift</span><span className="font-medium">{formatDateTime(negotiation.job?.start_time)} — {formatDateTime(negotiation.job?.end_time)}</span></div>
          <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Pay</span><span className="font-medium">${negotiation.job?.salary_min} — ${negotiation.job?.salary_max}</span></div>
          <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Decisions</span><span className="font-medium">Candidate {negotiation.decisions?.candidate || "pending"} · Business {negotiation.decisions?.business || "pending"}</span></div>
        </div>

        <Button onClick={() => onOpen(negotiation)}>Review before opening window</Button>
      </CardContent>
    </Card>
  )
}

function PreviousNegotiationCard({ item }) {
  const candidate = {
    ...item.user,
    role: "regular",
    name: `${item.user?.first_name || ""} ${item.user?.last_name || ""}`.trim(),
  }
  const business = {
    ...item.job?.business,
    role: "business",
    name: item.job?.business?.business_name,
  }

  return (
    <div className="rounded-2xl border bg-muted/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{item.job?.position_type?.name || `Negotiation #${item.id}`}</p>
          <p className="text-sm text-muted-foreground">Updated {formatDateTime(item.updatedAt || item.createdAt)}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <PersonRow label="Candidate" user={candidate} />
        <PersonRow label="Business" user={business} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Decisions: candidate {item.decisions?.candidate || "pending"} · business {item.decisions?.business || "pending"}</p>
    </div>
  )
}

function PossibleNegotiationCard({ item, onStart, isBusy }) {
  const candidate = {
    ...item.candidate,
    role: "regular",
    name: item.candidate?.name || `${item.candidate?.first_name || ""} ${item.candidate?.last_name || ""}`.trim(),
  }
  const business = {
    ...item.business,
    role: "business",
    name: item.business?.name || item.business?.business_name,
  }

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{item.positionName}</p>
          <p className="text-sm text-muted-foreground">{item.subtitle}</p>
        </div>
        <Badge variant="secondary">Mutual interest</Badge>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <PersonRow label="Candidate" user={candidate} />
        <PersonRow label="Business" user={business} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button disabled={isBusy} onClick={() => onStart(item)}>
          {isBusy ? "Starting..." : "Start Negotiation"}
        </Button>
      </div>
    </div>
  )
}

export function NegotiationPage() {
  const { user, refreshUser } = useAuth()
  const { openNegotiation, hasActiveNegotiation } = useSocket()
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const [possible, setPossible] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [pendingNegotiation, setPendingNegotiation] = useState(null)
  const [isStarting, setIsStarting] = useState(false)

  const loadPage = useCallback(async () => {
    if (!["regular", "business"].includes(user?.role)) return

    setLoading(true)
    setError("")
    try {
      const negotiationsPayload = await requestJson("/negotiations")
      setCurrent(negotiationsPayload?.current || null)
      setHistory(negotiationsPayload?.history || [])

      if (user.role === "regular") {
        const interestsPayload = await requestJson("/users/me/interests?page=1&limit=100&mutual=true")
        const nextPossible = (interestsPayload?.results || [])
          .filter((item) => item.interest_id && isJobNegotiable(item.job) && (!negotiationsPayload?.current || item.job?.id !== negotiationsPayload.current?.job?.id))
          .map((item) => ({
            interestId: item.interest_id,
            jobId: item.job?.id,
            positionName: item.job?.position_type?.name || `Job #${item.job?.id}`,
            subtitle: `${item.job?.business?.business_name || "Business"} · ${formatDateTime(item.job?.start_time)}`,
            candidate: {
              id: user?.id,
              first_name: user?.first_name,
              last_name: user?.last_name,
              avatar: user?.avatar,
              name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.name,
            },
            business: {
              ...item.job?.business,
              business_name: item.job?.business?.business_name,
              avatar: item.job?.business?.avatar,
            },
          }))
        setPossible(nextPossible)
        setLoading(false)
        return
      }

      const jobsPayload = await requestJson("/businesses/me/jobs?page=1&limit=100")
      const jobs = jobsPayload?.results || []
      const interestPayloads = await Promise.all(
        jobs
          .filter((job) => job?.status === "open")
          .map(async (job) => {
            const interests = await requestJson(`/jobs/${job.id}/interests?page=1&limit=100`)
            return { job, interests: interests?.results || [] }
          })
      )

      const nextPossible = interestPayloads.flatMap(({ job, interests }) =>
        interests
          .filter((interest) => interest.mutual && (!negotiationsPayload?.current || job.id !== negotiationsPayload.current?.job?.id))
          .map((interest) => ({
            interestId: interest.interest_id,
            jobId: job.id,
            positionName: job.position_type?.name || `Job #${job.id}`,
            subtitle: `${interest.user?.first_name || "Candidate"} ${interest.user?.last_name || ""}`.trim(),
            candidate: interest.user,
            business: {
              id: user?.id,
              business_name: user?.business_name || job?.business?.business_name,
              avatar: user?.avatar || job?.business?.avatar,
            },
          }))
      )
      setPossible(nextPossible)
    } catch (err) {
      setError(err.message || "Unable to load negotiations.")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadPage()
  }, [loadPage])

  useEffect(() => {
    const reload = () => loadPage()
    window.addEventListener("app:job-updated-from-negotiation", reload)
    return () => window.removeEventListener("app:job-updated-from-negotiation", reload)
  }, [loadPage])

  const possibleCountLabel = useMemo(() => `${possible.length} possible negotiation${possible.length === 1 ? "" : "s"}`, [possible.length])

  const handleSelectPendingNegotiation = (item) => {
    const blockedReason = user?.role === "regular" ? getRegularNegotiationBlockReason(user) : ""
    if (blockedReason) {
      setError(blockedReason)
      refreshUser?.()
      return
    }

    setPendingNegotiation(item)
  }

  const confirmStartNegotiation = async () => {
    if (!pendingNegotiation?.interestId) return
    setIsStarting(true)
    setError("")
    try {
      const negotiation = await requestJson("/negotiations", { method: "POST", body: { interest_id: pendingNegotiation.interestId } })
      setPendingNegotiation(null)
      await Promise.allSettled([loadPage(), refreshUser?.()])
      openNegotiation(negotiation)
    } catch (err) {
      setError(getNegotiationStartErrorMessage(err, user))
      await Promise.allSettled([loadPage(), refreshUser?.()])
    } finally {
      setIsStarting(false)
    }
  }

  if (!["regular", "business"].includes(user?.role)) {
    return <div className="p-10 text-center text-muted-foreground">Negotiations are only available for regular users and businesses.</div>
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Negotiations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review the active negotiation, start new negotiations from mutual interest matches, and inspect previous negotiations.</p>
        </div>
        {hasActiveNegotiation ? <Badge>Active negotiation</Badge> : null}
      </div>

      {error ? <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <div className="grid gap-6">
        <CurrentNegotiationCard negotiation={current} onOpen={openNegotiation} />

        <Card>
          <CardHeader>
            <CardTitle>Possible Negotiation Candidates</CardTitle>
            <CardDescription>{possibleCountLabel}. These matches already have mutual interest and can move into the exclusive negotiation window.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <p className="text-sm text-muted-foreground">Loading possible negotiations...</p> : null}
            {!loading && possible.length === 0 ? <p className="text-sm text-muted-foreground">No mutual-interest matches are ready to negotiate right now.</p> : null}
            {!loading && possible.map((item) => (
              <PossibleNegotiationCard
                key={`${item.interestId}-${item.jobId}`}
                item={item}
                isBusy={isStarting && pendingNegotiation?.interestId === item.interestId}
                onStart={handleSelectPendingNegotiation}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Previous Negotiations</CardTitle>
            <CardDescription>Historic negotiations, including successful and failed outcomes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <p className="text-sm text-muted-foreground">Loading previous negotiations...</p> : null}
            {!loading && history.length === 0 ? <p className="text-sm text-muted-foreground">No previous negotiations yet.</p> : null}
            {!loading && history.map((item) => <PreviousNegotiationCard key={item.id} item={item} />)}
          </CardContent>
        </Card>
      </div>

      <StartNegotiationDialog
        open={Boolean(pendingNegotiation)}
        onOpenChange={(open) => {
          if (!open) setPendingNegotiation(null)
        }}
        target={pendingNegotiation}
        isSubmitting={isStarting}
        onConfirm={confirmStartNegotiation}
      />
    </div>
  )
}
