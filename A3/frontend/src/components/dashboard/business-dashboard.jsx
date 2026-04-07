import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Clock3,
  MessageSquareHeart,
  Plus,
  ShieldAlert,
  UserRound,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { dashboardApi } from "@/lib/api/client"

function CountBadge({ count }) {
  return <Badge variant="secondary">{count}</Badge>
}

function statusVariant(value) {
  switch (value) {
    case "verified":
    case "active":
    case "open":
      return "default"
    case "upcoming":
    case "pending":
    case "filled":
      return "secondary"
    case "canceled":
    case "expired":
      return "destructive"
    default:
      return "outline"
  }
}

function getInitials(user) {
  const first = user?.name?.[0] || user?.business_name?.[0] || user?.email?.[0] || "B"
  const second = user?.name?.split(" ")?.[1]?.[0] || ""
  return `${first}${second}`.toUpperCase()
}

function MetricPill({ label, value }) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  )
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

export function BusinessDashboard() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await dashboardApi.getBusinessDashboard()
      setDashboard(response)
    } catch (err) {
      setError(err.message || "Failed to load your dashboard.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

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

  const business = dashboard?.business || {}
  const status = dashboard?.status || {}
  const cards = dashboard?.cards || {}
  const liveJobsCard = cards.active_jobs || { count: 0, results: [] }
  const negotiationCard = cards.negotiations || { count: 0, current: null }
  const interestsCard = cards.interests || { count: 0, results: [] }
  const openJobsCard = cards.open_jobs || { count: 0, results: [] }

  const greetingName = business.business_name || user?.name || "your business"
  let pageSummary = "Use this page to stay on top of live staffing activity and open roles."

  if (!status.verified) {
    pageSummary = "Your account is still waiting for verification. Keep your profile complete so you are ready to post and manage jobs."
  } else if (negotiationCard.count > 0) {
    pageSummary = "A negotiation is active right now. That is your highest-priority item."
  } else if ((interestsCard.total_candidates || 0) > 0) {
    pageSummary = "Candidates are already engaging with your postings. Review interested workers and move strong matches forward."
  } else if ((liveJobsCard.count || 0) > 0) {
    pageSummary = "You have confirmed staffing commitments coming up or already in progress."
  }

  const visibleCards = []

  if ((liveJobsCard.count || 0) > 0) {
    visibleCards.push(
      <PreviewShell
        key="live-jobs"
        icon={Briefcase}
        title="Active and Upcoming Jobs"
        description={`Active now: ${liveJobsCard.active_count || 0} · Upcoming: ${liveJobsCard.upcoming_count || 0}`}
        count={liveJobsCard.count || 0}
        actionTo="/business/jobs"
        actionLabel="Open my postings"
      >
        {liveJobsCard.results?.map((job) => (
          <div key={job.id} className="rounded-2xl border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{job.position_type?.name || `Job #${job.id}`}</div>
              <Badge variant={statusVariant(job.window_state)}>{job.window_state}</Badge>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{formatSalaryRange(job)}</div>
            <div className="mt-2 text-sm text-muted-foreground">
              {job.window_state === "active" ? "Ends" : "Starts"} {formatDateTime(job.window_state === "active" ? job.end_time : job.start_time)}
            </div>
            {job.worker ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <UserRound className="h-4 w-4" />
                {job.worker.first_name} {job.worker.last_name}
              </div>
            ) : null}
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
        description="One active negotiation blocks new negotiations for that posting until it ends."
        count={negotiationCard.count || 0}
        actionTo="/business/jobs"
        actionLabel="Review negotiation"
      >
        <div className="rounded-2xl border px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="font-medium">{negotiationCard.current.job?.position_type?.name || `Job #${negotiationCard.current.job?.id}`}</div>
            <Badge variant="secondary">Ends {formatDateTime(negotiationCard.current.expiresAt)}</Badge>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Candidate: {negotiationCard.current.candidate?.first_name} {negotiationCard.current.candidate?.last_name}
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-muted/50 px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Your decision</div>
              <div className="mt-1 font-medium">{negotiationCard.current.decisions?.business || "pending"}</div>
            </div>
            <div className="rounded-xl bg-muted/50 px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Candidate decision</div>
              <div className="mt-1 font-medium">{negotiationCard.current.decisions?.candidate || "pending"}</div>
            </div>
          </div>
        </div>
      </PreviewShell>,
    )
  }

  if ((interestsCard.count || 0) > 0) {
    visibleCards.push(
      <PreviewShell
        key="interests"
        icon={MessageSquareHeart}
        title="Candidate Interest"
        description={`Interested candidates: ${interestsCard.total_candidates || 0} · Mutual matches: ${interestsCard.mutual_count || 0}`}
        count={interestsCard.count || 0}
        actionTo="/business/jobs"
        actionLabel="Review candidates"
      >
        {interestsCard.results?.map((entry) => (
          <div key={entry.job?.id} className="rounded-2xl border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{entry.job?.position_type?.name || `Job #${entry.job?.id}`}</div>
              {entry.mutual_interest_count > 0 ? <Badge>Mutual {entry.mutual_interest_count}</Badge> : null}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {entry.candidate_interest_count} interested · updated {formatDateTime(entry.latest_interest_at)}
            </div>
            {entry.candidates?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.candidates.map((candidate) => (
                  <Badge key={candidate.id} variant={candidate.mutual ? "default" : "secondary"}>
                    {candidate.first_name} {candidate.last_name}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </PreviewShell>,
    )
  }

  if ((openJobsCard.count || 0) > 0) {
    visibleCards.push(
      <PreviewShell
        key="open-jobs"
        icon={Plus}
        title="Open Postings"
        description="Recent open postings and whether they already have candidate traction."
        count={openJobsCard.count || 0}
        actionTo="/business/jobs"
        actionLabel="Manage postings"
      >
        {openJobsCard.results?.map((job) => (
          <div key={job.id} className="rounded-2xl border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{job.position_type?.name || `Job #${job.id}`}</div>
              <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{formatSalaryRange(job)}</div>
            <div className="mt-2 text-sm text-muted-foreground">Starts {formatDateTime(job.start_time)}</div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{job.candidate_interest_count || 0} interested</Badge>
              {(job.mutual_interest_count || 0) > 0 ? <Badge>Mutual {job.mutual_interest_count}</Badge> : null}
            </div>
          </div>
        ))}
      </PreviewShell>,
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-primary/10 bg-gradient-to-br from-background via-background to-primary/5">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border">
                  <AvatarImage src={business.avatar || user?.avatar || undefined} />
                  <AvatarFallback className="text-lg font-semibold">
                    {getInitials(user || business)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={status.verified ? "default" : "secondary"}>
                      {status.verified ? "Verified business" : "Verification pending"}
                    </Badge>
                    {!status.verified ? (
                      <Badge variant="outline">Posting is limited until verified</Badge>
                    ) : null}
                  </div>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight">Welcome back, {greetingName}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{pageSummary}</p>
                </div>
              </div>
              <Button asChild>
                <Link to="/business/jobs/create">Post a job</Link>
              </Button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricPill label="Open postings" value={status.open_jobs || 0} />
              <MetricPill label="Live jobs" value={status.active_jobs || 0} />
              <MetricPill label="Interested candidates" value={status.candidate_interest_total || 0} />
              <MetricPill label="Mutual matches" value={status.mutual_interest_total || 0} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              {status.verified ? (
                <BadgeCheck className="h-5 w-5 text-primary" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              )}
              <CardTitle className="text-base">Account status</CardTitle>
            </div>
            <CardDescription>
              Keep this current so your staffing pipeline moves without friction.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
              <span className="text-muted-foreground">Verification</span>
              <Badge variant={status.verified ? "default" : "secondary"}>{status.verification_state}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
              <span className="text-muted-foreground">Account activation</span>
              <Badge variant={business.activated ? "default" : "secondary"}>{business.activated ? "activated" : "pending"}</Badge>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link to="/profile/business">Update business profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {visibleCards.length > 0 ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">{visibleCards}</div>
      ) : (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Nothing urgent right now</CardTitle>
            <CardDescription>
              When jobs go live or candidates engage with a posting, the important items will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link to="/business/jobs/create">Create a posting</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/business/jobs">Review all postings</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
