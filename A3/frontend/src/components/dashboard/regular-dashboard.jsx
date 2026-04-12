import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowRight,
  Briefcase,
  ClipboardCheck,
  Clock3,
  FileClock,
  Heart,
  ShieldAlert,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react"

import { UserAvatar } from "@/components/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDateTime, formatSalaryRange } from "@/components/jobs/job-utils"
import { useAuth } from "@/context/auth-context"
import { availabilityApi, dashboardApi } from "@/lib/api/client"

function statusVariant(value) {
  switch (value) {
    case "available":
    case "activated":
    case "approved":
    case "active":
      return "default"
    case "inactive":
    case "pending":
    case "upcoming":
      return "secondary"
    case "suspended":
    case "rejected":
      return "destructive"
    default:
      return "outline"
  }
}

function pendingQualificationVariant(status) {
  switch (status) {
    case "submitted":
    case "revised":
      return "secondary"
    case "created":
      return "outline"
    default:
      return "outline"
  }
}

function CountBadge({ count }) {
  return <Badge variant="secondary">{count}</Badge>
}

function PreviewShell({ icon: Icon, title, description, count, actionTo, actionLabel, children, footerNote = null }) {
  return (
    <Card>
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <CountBadge count={count} />
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-4 pt-0">
        <div className="flex-1 space-y-3">{children}</div>
        {footerNote ? <div className="text-xs text-muted-foreground">{footerNote}</div> : null}
        <Button asChild variant="outline" className="w-full">
          <Link to={actionTo}>
            {actionLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function MetricPill({ label, value }) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  )
}

function AvailabilityExplainer({ status }) {
  if (status?.availability_message) {
    return status.availability_message
  }

  if (status.suspended) {
    return "Availability cannot be changed while your account is suspended."
  }

  if (status.availability_state === "available") {
    return "Available workers can be matched for qualified jobs and invitations."
  }

  if (status.availability_state === "inactive") {
    return "Inactive means your availability timed out. Turn it back on to appear in matching again."
  }

  return "Unavailable pauses new matching until you turn availability back on."
}


export function RegularDashboard() {
  const { user, refreshUser } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await dashboardApi.getRegularDashboard()
      setDashboard(response)
    } catch (err) {
      const message = err.message || "Failed to load your dashboard."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleAvailabilityToggle = async () => {
    if (!dashboard?.status || isUpdatingStatus) return

    const nextAvailable =
      dashboard.status.availability_state === "inactive"
        ? true
        : !dashboard.status.raw_available
    setIsUpdatingStatus(true)

    try {
      await availabilityApi.updateMine(nextAvailable)
      toast.success(nextAvailable ? "Matching is now on." : "Matching is now paused.")
      await Promise.all([loadDashboard(), refreshUser()])
    } catch (err) {
      toast.error(err.message || "Failed to update your status.")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Loading dashboard...
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-3xl border border-destructive/20 bg-destructive/10 px-6 py-5 text-sm text-destructive">
          {error}
        </div>
      </div>
    )
  }

  const status = dashboard?.status || {}
  const cards = dashboard?.cards || {}
  const jobsCard = cards.upcoming_or_active_jobs || { count: 0, results: [] }
  const negotiationCard = cards.negotiations || { count: 0, current: null }
  const invitationsCard = cards.invitations || { count: 0, results: [] }
  const interestsCard = cards.interests || { count: 0, results: [] }
  const newJobsCard = cards.new_jobs || { count: 0, results: [] }
  const pendingQualificationsCard = cards.pending_qualifications || { count: 0, results: [] }

  const canSetAvailable =
    status.raw_available || status.can_set_available || false

  const greetingName = user?.first_name || user?.name?.split(" ")?.[0] || "there"
  let pageSummary = "Here is a clean view of your account and matching activity."

  if (status.suspended) {
    pageSummary = "Your account is suspended right now. You can still review your activity below."
  } else if (jobsCard.count > 0) {
    pageSummary = "You have live work activity to keep an eye on today."
  } else if (negotiationCard.count > 0 || invitationsCard.count > 0) {
    pageSummary = "You have matching activity waiting for your attention."
  } else if (newJobsCard.count > 0) {
    pageSummary = "New matching jobs are available for you to review."
  }

  const visibleCards = []

  if ((jobsCard.count || 0) > 0) {
    visibleCards.push(
      <PreviewShell
        key="jobs"
        icon={Briefcase}
        title="Upcoming or Active Jobs"
        description={`Upcoming: ${jobsCard.upcoming_count || 0} · Active: ${jobsCard.active_count || 0}`}
        count={jobsCard.count || 0}
        actionTo="/my/jobs"
        actionLabel="Open my jobs"
      >
        {jobsCard.results?.map((job) => (
          <div key={job.id} className="rounded-2xl border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{job.position_type?.name || `Job #${job.id}`}</div>
              <Badge variant={statusVariant(job.commitment_state)}>{job.commitment_state}</Badge>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{job.business?.business_name || "Unknown business"}</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Starts {formatDateTime(job.start_time)}
            </div>
          </div>
        ))}
      </PreviewShell>,
    )
  }

  if ((negotiationCard.count || 0) > 0 && negotiationCard.current) {
    visibleCards.push(
      <PreviewShell
        key="negotiation"
        icon={Clock3}
        title="Negotiation"
        description="Track the one active negotiation that currently blocks other negotiations."
        count={negotiationCard.count || 0}
        actionTo="/my/jobs"
        actionLabel="Review negotiation"
      >
        <div className="rounded-2xl border px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="font-medium">
              {negotiationCard.current.job?.position_type?.name || `Job #${negotiationCard.current.job?.id}`}
            </div>
            <Badge variant="secondary">Ends {formatDateTime(negotiationCard.current.expiresAt)}</Badge>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {negotiationCard.current.job?.business?.business_name || "Unknown business"}
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-muted/50 px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Your decision</div>
              <div className="mt-1 font-medium">{negotiationCard.current.decisions?.candidate || "pending"}</div>
            </div>
            <div className="rounded-xl bg-muted/50 px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Business decision</div>
              <div className="mt-1 font-medium">{negotiationCard.current.decisions?.business || "pending"}</div>
            </div>
          </div>
        </div>
      </PreviewShell>,
    )
  }

  if ((invitationsCard.count || 0) > 0) {
    visibleCards.push(
      <PreviewShell
        key="invitations"
        icon={ClipboardCheck}
        title="Invitations"
        description="Businesses that invited you and are waiting for your response."
        count={invitationsCard.count || 0}
        actionTo="/my/invitations"
        actionLabel="Open invitations"
      >
        {invitationsCard.results?.map((interest) => (
          <div key={interest.interest_id} className="rounded-2xl border px-4 py-3">
            <div className="font-medium">{interest.job?.position_type?.name || `Job #${interest.job?.id}`}</div>
            <div className="mt-1 text-sm text-muted-foreground">{interest.job?.business?.business_name || "Unknown business"}</div>
            <div className="mt-2 text-sm text-muted-foreground">Starts {formatDateTime(interest.job?.start_time)}</div>
          </div>
        ))}
      </PreviewShell>,
    )
  }

  if ((interestsCard.count || 0) > 0) {
    visibleCards.push(
      <PreviewShell
        key="interests"
        icon={Heart}
        title="Interests"
        description={`Mutual interest: ${interestsCard.mutual_count || 0}`}
        count={interestsCard.count || 0}
        actionTo="/my/interests"
        actionLabel="Open interests"
      >
        {interestsCard.results?.map((interest) => (
          <div key={interest.interest_id} className="rounded-2xl border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{interest.job?.position_type?.name || `Job #${interest.job?.id}`}</div>
              {interest.mutual ? <Badge variant="default">Mutual</Badge> : null}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{interest.job?.business?.business_name || "Unknown business"}</div>
            <div className="mt-2 text-sm text-muted-foreground">{formatSalaryRange(interest.job)}</div>
          </div>
        ))}
      </PreviewShell>,
    )
  }

  if ((newJobsCard.count || 0) > 0) {
    visibleCards.push(
      <PreviewShell
        key="new-jobs"
        icon={Briefcase}
        title="New Jobs"
        description="Fresh matching jobs you have not acted on yet."
        count={newJobsCard.count || 0}
        actionTo="/jobs/browse"
        actionLabel="Browse jobs"
      >
        {newJobsCard.results?.map((job) => (
          <div key={job.id} className="rounded-2xl border px-4 py-3">
            <div className="font-medium">{job.position_type?.name || `Job #${job.id}`}</div>
            <div className="mt-1 text-sm text-muted-foreground">{job.business?.business_name || "Unknown business"}</div>
            <div className="mt-2 text-sm text-muted-foreground">{formatSalaryRange(job)}</div>
          </div>
        ))}
      </PreviewShell>,
    )
  }

  if ((pendingQualificationsCard.count || 0) > 0) {
    visibleCards.push(
      <PreviewShell
        key="pending-qualifications"
        icon={FileClock}
        title="Pending Qualifications"
        description="Created, submitted, or revised qualifications that still need progress."
        count={pendingQualificationsCard.count || 0}
        actionTo="/my/qualifications"
        actionLabel="Open qualifications"
      >
        {pendingQualificationsCard.results?.map((qualification) => (
          <div key={qualification.id} className="rounded-2xl border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{qualification.position_type?.name || `Qualification #${qualification.id}`}</div>
              <Badge variant={pendingQualificationVariant(qualification.status)}>{qualification.status}</Badge>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Updated {formatDateTime(qualification.updatedAt)}
            </div>
          </div>
        ))}
      </PreviewShell>,
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border bg-card px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} className="h-14 w-14 border bg-background" fallbackClassName="text-sm font-semibold" />
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Worker Dashboard</Badge>
              {status.suspended ? <Badge variant="destructive">Suspended</Badge> : null}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, {greetingName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{pageSummary}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Badge variant={statusVariant(status.activated ? "activated" : "inactive")}>
            {status.activated ? "Activated" : "Not activated"}
          </Badge>
          <Badge variant={statusVariant(status.availability_state)}>
            {String(status.availability_state || "unavailable").replaceAll("_", " ")}
          </Badge>
          {!status.suspended ? (
            <Badge variant={statusVariant("approved")}>In good standing</Badge>
          ) : null}
        </div>
      </div>

      <Card className="mb-6 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                {status.suspended ? (
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
              </div>
              <div>
                <CardTitle className="text-base">Account Status</CardTitle>
                <CardDescription className="mt-1 text-sm">
                  Keep your account ready for matching and review any blockers here.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <MetricPill label="Pending qualifications" value={status.pending_qualifications || 0} />
            <MetricPill label="Resume" value={status.resume_uploaded ? "Uploaded" : "Missing"} />
            <div className="rounded-xl border bg-muted/20 px-3 py-2 sm:col-span-2 xl:col-span-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Availability</div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={statusVariant(status.availability_state)}>
                      {String(status.availability_state || "unavailable").replaceAll("_", " ")}
                    </Badge>
                    {!status.suspended && !canSetAvailable ? (
                      <Badge variant="outline">Needs approved qualification</Badge>
                    ) : null}
                  </div>
                </div>
                {!status.suspended ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAvailabilityToggle}
                    disabled={!canSetAvailable || isUpdatingStatus}
                    className="shrink-0"
                  >
                    <UserRoundCheck className="mr-2 h-4 w-4" />
                    {isUpdatingStatus
                      ? "Updating..."
                      : status.availability_state === "inactive"
                        ? "Resume matching"
                        : status.raw_available
                          ? "Pause matching"
                          : "Set available"}
                  </Button>
                ) : null}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                <AvailabilityExplainer status={status} />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {visibleCards.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{visibleCards}</div>
      ) : (
        <Card>
          <CardContent className="px-6 py-8 text-sm text-muted-foreground">
            No upcoming jobs, negotiations, invitations, interests, new jobs, or pending qualifications to show right now.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
