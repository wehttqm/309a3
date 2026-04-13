import { useCallback, useEffect, useMemo, useState } from "react"
import { notify } from "@/lib/notify"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Eye,
  Settings2,
  ShieldCheck,
  UserRoundX,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { DashboardSkeleton } from "@/components/ui/app-skeletons"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { adminApi } from "@/lib/api/client"

function formatDateLabel(value) {
  if (!value) return "Recently"

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value))
  } catch {
    return value
  }
}

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

function QueueCard({
  icon: Icon,
  title,
  description,
  count,
  actionTo,
  actionLabel,
  emptyText,
  children,
}) {
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
          {count > 0 ? (
            children
          ) : (
            <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
              {emptyText}
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
  const [dashboard, setDashboard] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [pendingAction, setPendingAction] = useState("")

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError("")

    try {
      const [
        businesses,
        qualifications,
        suspendedUsers,
        hiddenPositions,
        resetCooldown,
        negotiationWindow,
        jobStartWindow,
        availabilityTimeout,
      ] = await Promise.all([
        adminApi.getBusinesses({ verified: false, page: 1, limit: 5, sort: "business_name", order: "asc" }),
        adminApi.getQualifications({ page: 1, limit: 5 }),
        adminApi.getRegularUsers({ suspended: true, page: 1, limit: 5 }),
        adminApi.getPositionTypes({ hidden: true, page: 1, limit: 5, name: "asc" }),
        adminApi.getResetCooldown(),
        adminApi.getNegotiationWindow(),
        adminApi.getJobStartWindow(),
        adminApi.getAvailabilityTimeout(),
      ])

      setDashboard({
        businesses,
        qualifications,
        suspendedUsers,
        hiddenPositions,
        settings: {
          reset_cooldown: resetCooldown?.reset_cooldown,
          negotiation_window: negotiationWindow?.negotiation_window,
          job_start_window: jobStartWindow?.job_start_window,
          availability_timeout: availabilityTimeout?.availability_timeout,
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

  const queueCounts = useMemo(() => {
    return {
      businesses: dashboard?.businesses?.count || 0,
      qualifications: dashboard?.qualifications?.count || 0,
      suspendedUsers: dashboard?.suspendedUsers?.count || 0,
      hiddenPositions: dashboard?.hiddenPositions?.count || 0,
    }
  }, [dashboard])

  const totalTodos =
    queueCounts.businesses +
    queueCounts.qualifications +
    queueCounts.suspendedUsers +
    queueCounts.hiddenPositions

  const handleVerifyBusiness = async (businessId) => {
    const key = `verify-${businessId}`
    setPendingAction(key)

    try {
      await adminApi.setBusinessVerified(businessId, true)
      notify.success("Business verified.")
      await loadDashboard()
    } catch (err) {
      notify.error(err.message || "Failed to verify business.")
    } finally {
      setPendingAction("")
    }
  }

  const handleQualificationDecision = async (qualificationId, status) => {
    const key = `${status}-${qualificationId}`
    setPendingAction(key)

    try {
      await adminApi.updateQualification(qualificationId, { status })
      notify.success(`Qualification ${status}.`)
      await loadDashboard()
    } catch (err) {
      notify.error(err.message || `Failed to mark qualification as ${status}.`)
    } finally {
      setPendingAction("")
    }
  }

  const handleUnsuspendUser = async (userId) => {
    const key = `unsuspend-${userId}`
    setPendingAction(key)

    try {
      await adminApi.setUserSuspended(userId, false)
      notify.success("User unsuspended.")
      await loadDashboard()
    } catch (err) {
      notify.error(err.message || "Failed to unsuspend user.")
    } finally {
      setPendingAction("")
    }
  }

  const handleMakePositionVisible = async (positionTypeId) => {
    const key = `visible-${positionTypeId}`
    setPendingAction(key)

    try {
      await adminApi.updatePositionType(positionTypeId, { hidden: false })
      notify.success("Position type is now visible.")
      await loadDashboard()
    } catch (err) {
      notify.error(err.message || "Failed to update position type visibility.")
    } finally {
      setPendingAction("")
    }
  }

  if (isLoading) {
    return <DashboardSkeleton cards="4" />
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

  const businesses = dashboard?.businesses?.results || []
  const qualifications = dashboard?.qualifications?.results || []
  const suspendedUsers = dashboard?.suspendedUsers?.results || []
  const hiddenPositions = dashboard?.hiddenPositions?.results || []
  const settings = dashboard?.settings || {}

  let pageSummary = "Work through the queues below to keep matching, onboarding, and platform visibility moving."

  if (queueCounts.qualifications > 0) {
    pageSummary = "Qualification review is your most time-sensitive queue because it unlocks matching for workers."
  } else if (queueCounts.businesses > 0) {
    pageSummary = "Businesses are waiting for verification before they can fully participate in hiring workflows."
  } else if (totalTodos === 0) {
    pageSummary = "You are caught up on the main admin queues. This is a good moment to review visibility settings and system timing controls."
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="secondary" className="mb-4">Administrator</Badge>
          <h1 className="text-3xl font-bold tracking-tight">Admin dashboard</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">{pageSummary}</p>
        </div>
        <Button variant="outline" onClick={loadDashboard}>Refresh queues</Button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricPill label="Open admin to-dos" value={totalTodos} />
        <MetricPill label="Businesses to verify" value={queueCounts.businesses} />
        <MetricPill label="Qualifications to review" value={queueCounts.qualifications} />
        <MetricPill label="Suspended users" value={queueCounts.suspendedUsers} />
        <MetricPill label="Hidden positions" value={queueCounts.hiddenPositions} />
      </div>

      {totalTodos === 0 ? (
        <Card className="mb-6 border-dashed bg-muted/20">
          <CardHeader>
            <CardTitle>All caught up</CardTitle>
            <CardDescription>
              There are no urgent approval queues right now. You can still review positions, users, or configuration from the cards below.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <QueueCard
          icon={ShieldCheck}
          title="Verify Businesses"
          description="Confirm legitimate clinics and complete onboarding for businesses waiting on approval."
          count={queueCounts.businesses}
          actionTo="/admin/businesses"
          actionLabel="Open business queue"
          emptyText="No businesses are currently waiting for verification."
        >
          {businesses.map((business) => (
            <div key={business.id} className="rounded-2xl border px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{business.business_name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{business.owner_name || "No owner listed"}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={business.activated ? "secondary" : "outline"}>
                    {business.activated ? "Activated" : "Not activated"}
                  </Badge>
                  <Badge variant="outline">Pending verification</Badge>
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{business.email}</div>
              <div className="mt-1 text-sm text-muted-foreground">{business.phone_number || "No phone listed"}</div>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleVerifyBusiness(business.id)}
                  disabled={pendingAction === `verify-${business.id}`}
                >
                  {pendingAction === `verify-${business.id}` ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </div>
          ))}
        </QueueCard>

        <QueueCard
          icon={ClipboardCheck}
          title="Review Qualifications"
          description="Approve or reject worker qualifications so eligible users can start matching for jobs."
          count={queueCounts.qualifications}
          actionTo="/admin/qualifications"
          actionLabel="Open qualification queue"
          emptyText="No qualifications are currently waiting for admin attention."
        >
          {qualifications.map((qualification) => (
            <div key={qualification.id} className="rounded-2xl border px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">
                    {qualification.user?.first_name} {qualification.user?.last_name}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {qualification.position_type?.name || "Unknown position type"}
                  </div>
                </div>
                <Badge variant="secondary">{qualification.status}</Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">Updated {formatDateLabel(qualification.updatedAt)}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleQualificationDecision(qualification.id, "approved")}
                  disabled={pendingAction === `approved-${qualification.id}` || pendingAction === `rejected-${qualification.id}`}
                >
                  {pendingAction === `approved-${qualification.id}` ? "Approving..." : "Approve"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleQualificationDecision(qualification.id, "rejected")}
                  disabled={pendingAction === `approved-${qualification.id}` || pendingAction === `rejected-${qualification.id}`}
                >
                  {pendingAction === `rejected-${qualification.id}` ? "Rejecting..." : "Reject"}
                </Button>
              </div>
            </div>
          ))}
        </QueueCard>

        <QueueCard
          icon={UserRoundX}
          title="Suspended Users"
          description="Follow up on restricted accounts and restore access when suspension should be lifted."
          count={queueCounts.suspendedUsers}
          actionTo="/admin/users"
          actionLabel="Open user management"
          emptyText="No regular users are currently suspended."
        >
          {suspendedUsers.map((regularUser) => (
            <div key={regularUser.id} className="rounded-2xl border px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{regularUser.first_name} {regularUser.last_name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{regularUser.email}</div>
                </div>
                <Badge variant="destructive">Suspended</Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{regularUser.phone_number || "No phone listed"}</div>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleUnsuspendUser(regularUser.id)}
                  disabled={pendingAction === `unsuspend-${regularUser.id}`}
                >
                  {pendingAction === `unsuspend-${regularUser.id}` ? "Updating..." : "Unsuspend"}
                </Button>
              </div>
            </div>
          ))}
        </QueueCard>

        <QueueCard
          icon={Eye}
          title="Hidden Position Types"
          description="Review hidden roles and make them visible again when admins are ready to support them."
          count={queueCounts.hiddenPositions}
          actionTo="/admin/positions"
          actionLabel="Open position types"
          emptyText="No position types are currently hidden."
        >
          {hiddenPositions.map((positionType) => (
            <div key={positionType.id} className="rounded-2xl border px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{positionType.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground line-clamp-2">{positionType.description}</div>
                </div>
                <Badge variant="outline">Hidden</Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Qualified users: {positionType.num_qualified ?? 0}
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleMakePositionVisible(positionType.id)}
                  disabled={pendingAction === `visible-${positionType.id}`}
                >
                  {pendingAction === `visible-${positionType.id}` ? "Updating..." : "Make visible"}
                </Button>
              </div>
            </div>
          ))}
        </QueueCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Suggested admin priorities</CardTitle>
            </div>
            <CardDescription>
              A practical order of operations for keeping the platform moving smoothly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-2xl border px-4 py-3">
              <div className="font-medium text-foreground">1. Clear the qualification queue first</div>
              <div className="mt-1">
                Workers cannot fully participate in matching until their qualifications are reviewed and approved.
              </div>
            </div>
            <div className="rounded-2xl border px-4 py-3">
              <div className="font-medium text-foreground">2. Verify real businesses quickly</div>
              <div className="mt-1">
                Verification helps legitimate clinics move from onboarding into live hiring without manual delays.
              </div>
            </div>
            <div className="rounded-2xl border px-4 py-3">
              <div className="font-medium text-foreground">3. Revisit suspended accounts deliberately</div>
              <div className="mt-1">
                Unsuspend only when the operational reason for the restriction has been resolved.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">System settings snapshot</CardTitle>
            </div>
            <CardDescription>
              These timing rules shape how fast resets, negotiations, and matching state changes happen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <MetricPill label="Reset cooldown" value={`${settings.reset_cooldown ?? "—"} sec`} />
            <MetricPill label="Negotiation window" value={`${settings.negotiation_window ?? "—"} sec`} />
            <MetricPill label="Job start window" value={`${settings.job_start_window ?? "—"} hr`} />
            <MetricPill label="Availability timeout" value={`${settings.availability_timeout ?? "—"} sec`} />
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/config">
                Open system settings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
