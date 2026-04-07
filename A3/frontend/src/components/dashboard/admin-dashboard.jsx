import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Wrench,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { adminApi } from "@/lib/api/client"

function CountBadge({ count }) {
  return <Badge variant="secondary">{count}</Badge>
}

function MetricPill({ label, value }) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  )
}

function formatDateTime(value) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

function getAdminName(user) {
  if (user?.name) return user.name
  if (user?.email) return user.email.split("@")[0]
  return "Admin"
}

function QueueShell({
  icon: Icon,
  title,
  description,
  count,
  actionTo,
  actionLabel,
  emptyMessage,
  children,
}) {
  const hasItems = count > 0

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
        <div className="flex-1 space-y-3">
          {hasItems ? children : (
            <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          )}
        </div>
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

export function AdminDashboard() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [pendingAction, setPendingAction] = useState("")

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError("")

    try {
      const [
        pendingBusinesses,
        pendingQualifications,
        suspendedUsers,
        hiddenPositionTypes,
        resetCooldown,
        negotiationWindow,
        jobStartWindow,
        availabilityTimeout,
      ] = await Promise.all([
        adminApi.getBusinesses({ verified: false, page: 1, limit: 5, sort: "business_name", order: "asc" }),
        adminApi.getQualifications({ page: 1, limit: 5 }),
        adminApi.getRegularUsers({ suspended: true, page: 1, limit: 5 }),
        adminApi.getPositionTypes({ hidden: "true", name: "asc", num_qualified: "asc", page: 1, limit: 5 }),
        adminApi.getResetCooldown(),
        adminApi.getNegotiationWindow(),
        adminApi.getJobStartWindow(),
        adminApi.getAvailabilityTimeout(),
      ])

      setDashboard({
        pendingBusinesses,
        pendingQualifications,
        suspendedUsers,
        hiddenPositionTypes,
        settings: {
          reset_cooldown: resetCooldown?.reset_cooldown ?? null,
          negotiation_window: negotiationWindow?.negotiation_window ?? null,
          job_start_window: jobStartWindow?.job_start_window ?? null,
          availability_timeout: availabilityTimeout?.availability_timeout ?? null,
        },
      })
    } catch (err) {
      setError(err.message || "Failed to load the admin dashboard.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleVerifyBusiness = async (businessId) => {
    setPendingAction(`business-${businessId}`)
    try {
      await adminApi.setBusinessVerified(businessId, true)
      toast.success("Business verified.")
      await loadDashboard()
    } catch (err) {
      toast.error(err.message || "Failed to verify business.")
    } finally {
      setPendingAction("")
    }
  }

  const handleQualificationDecision = async (qualificationId, status) => {
    setPendingAction(`qualification-${qualificationId}-${status}`)
    try {
      await adminApi.updateQualification(qualificationId, { status })
      toast.success(`Qualification ${status}.`)
      await loadDashboard()
    } catch (err) {
      toast.error(err.message || "Failed to update qualification.")
    } finally {
      setPendingAction("")
    }
  }

  const handleUnsuspendUser = async (userId) => {
    setPendingAction(`user-${userId}`)
    try {
      await adminApi.setUserSuspended(userId, false)
      toast.success("User unsuspended.")
      await loadDashboard()
    } catch (err) {
      toast.error(err.message || "Failed to update user.")
    } finally {
      setPendingAction("")
    }
  }

  const handleRevealPosition = async (positionTypeId) => {
    setPendingAction(`position-${positionTypeId}`)
    try {
      await adminApi.updatePositionType(positionTypeId, { hidden: false })
      toast.success("Position type is now visible.")
      await loadDashboard()
    } catch (err) {
      toast.error(err.message || "Failed to update position type.")
    } finally {
      setPendingAction("")
    }
  }

  const stats = useMemo(() => ({
    pendingBusinesses: dashboard?.pendingBusinesses?.count || 0,
    qualificationQueue: dashboard?.pendingQualifications?.count || 0,
    suspendedUsers: dashboard?.suspendedUsers?.count || 0,
    hiddenPositions: dashboard?.hiddenPositionTypes?.count || 0,
  }), [dashboard])

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

  const greetingName = getAdminName(user)
  let pageSummary = "Here is the quickest path through the main review queues and system controls."

  if (stats.pendingBusinesses > 0) {
    pageSummary = `${stats.pendingBusinesses} business${stats.pendingBusinesses === 1 ? "" : "es"} are waiting for verification.`
  } else if (stats.qualificationQueue > 0) {
    pageSummary = `${stats.qualificationQueue} qualification${stats.qualificationQueue === 1 ? "" : "s"} need review.`
  } else if (stats.suspendedUsers > 0) {
    pageSummary = `${stats.suspendedUsers} suspended user${stats.suspendedUsers === 1 ? "" : "s"} can be reviewed here.`
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="border-primary/10 bg-gradient-to-br from-background via-background to-primary/5">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>Administrator</Badge>
                  {(stats.pendingBusinesses + stats.qualificationQueue + stats.suspendedUsers) > 0 ? (
                    <Badge variant="secondary">Action queue active</Badge>
                  ) : (
                    <Badge variant="outline">No urgent queue</Badge>
                  )}
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">Welcome back, {greetingName}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{pageSummary}</p>
              </div>
              <Button asChild>
                <Link to="/admin/businesses">Open admin tools</Link>
              </Button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricPill label="Awaiting verification" value={stats.pendingBusinesses} />
              <MetricPill label="Qualification queue" value={stats.qualificationQueue} />
              <MetricPill label="Suspended users" value={stats.suspendedUsers} />
              <MetricPill label="Hidden positions" value={stats.hiddenPositions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">System controls</CardTitle>
            </div>
            <CardDescription>
              Snapshot of admin-managed timing values.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
              <span className="text-muted-foreground">Reset cooldown</span>
              <Badge variant="secondary">{dashboard?.settings?.reset_cooldown ?? "—"}s</Badge>
            </div>
            <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
              <span className="text-muted-foreground">Negotiation window</span>
              <Badge variant="secondary">{dashboard?.settings?.negotiation_window ?? "—"}s</Badge>
            </div>
            <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
              <span className="text-muted-foreground">Job start window</span>
              <Badge variant="secondary">{dashboard?.settings?.job_start_window ?? "—"}h</Badge>
            </div>
            <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
              <span className="text-muted-foreground">Availability timeout</span>
              <Badge variant="secondary">{dashboard?.settings?.availability_timeout ?? "—"}s</Badge>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/config">Adjust system settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <QueueShell
          icon={Building2}
          title="Businesses awaiting verification"
          description="Verify organizations so they can move faster into job posting and hiring workflows."
          count={dashboard?.pendingBusinesses?.count || 0}
          actionTo="/admin/businesses"
          actionLabel="Manage businesses"
          emptyMessage="No businesses are currently waiting for verification."
        >
          {dashboard?.pendingBusinesses?.results?.map((business) => (
            <div key={business.id} className="rounded-2xl border px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{business.business_name || "Unnamed business"}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{business.owner_name || "Unknown owner"}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{business.email}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={business.activated ? "default" : "outline"}>
                    {business.activated ? "Activated" : "Not activated"}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => handleVerifyBusiness(business.id)}
                    disabled={pendingAction === `business-${business.id}`}
                  >
                    {pendingAction === `business-${business.id}` ? "Saving..." : "Verify"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </QueueShell>

        <QueueShell
          icon={BadgeCheck}
          title="Qualification review"
          description="Approve or reject the requests that need administrator attention."
          count={dashboard?.pendingQualifications?.count || 0}
          actionTo="/admin/qualifications"
          actionLabel="Open qualification queue"
          emptyMessage="No qualification requests require admin attention right now."
        >
          {dashboard?.pendingQualifications?.results?.map((qualification) => (
            <div key={qualification.id} className="rounded-2xl border px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">
                    {qualification.user?.first_name} {qualification.user?.last_name}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{qualification.position_type?.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Updated {formatDateTime(qualification.updatedAt)}</div>
                </div>
                <Badge variant={qualification.status === "revised" ? "secondary" : "default"}>
                  {qualification.status}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/qualifications/${qualification.id}`}>Review</Link>
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleQualificationDecision(qualification.id, "approved")}
                  disabled={pendingAction === `qualification-${qualification.id}-approved` || pendingAction === `qualification-${qualification.id}-rejected`}
                >
                  {pendingAction === `qualification-${qualification.id}-approved` ? "Saving..." : "Approve"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleQualificationDecision(qualification.id, "rejected")}
                  disabled={pendingAction === `qualification-${qualification.id}-approved` || pendingAction === `qualification-${qualification.id}-rejected`}
                >
                  {pendingAction === `qualification-${qualification.id}-rejected` ? "Saving..." : "Reject"}
                </Button>
              </div>
            </div>
          ))}
        </QueueShell>

        <QueueShell
          icon={ShieldAlert}
          title="Suspended users"
          description="Quickly review and unsuspend accounts when appropriate."
          count={dashboard?.suspendedUsers?.count || 0}
          actionTo="/admin/users"
          actionLabel="Manage users"
          emptyMessage="There are no suspended users at the moment."
        >
          {dashboard?.suspendedUsers?.results?.map((regularUser) => (
            <div key={regularUser.id} className="rounded-2xl border px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{regularUser.first_name} {regularUser.last_name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{regularUser.email}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{regularUser.phone_number || "No phone on file"}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUnsuspendUser(regularUser.id)}
                  disabled={pendingAction === `user-${regularUser.id}`}
                >
                  {pendingAction === `user-${regularUser.id}` ? "Saving..." : "Unsuspend"}
                </Button>
              </div>
            </div>
          ))}
        </QueueShell>

        <QueueShell
          icon={Wrench}
          title="Hidden position types"
          description="Publish position types that are ready to appear in worker and business flows."
          count={dashboard?.hiddenPositionTypes?.count || 0}
          actionTo="/admin/positions"
          actionLabel="Manage position types"
          emptyMessage="All position types are currently visible."
        >
          {dashboard?.hiddenPositionTypes?.results?.map((positionType) => (
            <div key={positionType.id} className="rounded-2xl border px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{positionType.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground line-clamp-2">{positionType.description}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">Qualified {positionType.num_qualified ?? 0}</Badge>
                    <Badge variant="outline">Hidden</Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRevealPosition(positionType.id)}
                  disabled={pendingAction === `position-${positionType.id}`}
                >
                  {pendingAction === `position-${positionType.id}` ? "Saving..." : "Make visible"}
                </Button>
              </div>
            </div>
          ))}
        </QueueShell>
      </div>

      {(stats.pendingBusinesses + stats.qualificationQueue + stats.suspendedUsers + stats.hiddenPositions) === 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>Everything is caught up</CardTitle>
            </div>
            <CardDescription>
              There are no pending verification, review, suspension, or hidden-position queues right now.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline">
              <Link to="/admin/businesses">Review businesses</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/qualifications">Review qualifications</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
