import { useEffect, useMemo, useState } from "react"
import { notify } from "@/lib/notify"

import { JobCard } from "@/components/jobs/job-card"
import { formatDateTime, formatSalaryRange, jobStatusVariant } from "@/components/jobs/job-utils"
import { useAuth } from "@/context/auth-context"
import { apiClient } from "@/lib/api/client"
import { getNegotiationStartErrorMessage, getRegularNegotiationBlockReason } from "@/lib/negotiation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"
import { deriveUserAvatarStatus, formatAvatarStatusLabel } from "@/lib/user-status"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const LIMIT_OPTIONS = ["10", "20", "50"]

const DEFAULT_SHARED_FILTERS = {
  position_type_id: "all",
  business_id: "all",
}

const DEFAULT_INTEREST_FILTERS = {
  mutual: "all",
}

const DEFAULT_COMMITTED_FILTERS = {
  commitment_state: "all",
  status: "all",
}

function deriveCommitmentState(job) {
  const now = Date.now()
  const start = new Date(job?.start_time).getTime()
  const end = new Date(job?.end_time).getTime()

  if (job?.status === "canceled") return "canceled"
  if (job?.status === "completed") return "completed"
  if (!Number.isNaN(end) && now > end) return "completed"
  if (!Number.isNaN(start) && now < start) return "upcoming"
  if (!Number.isNaN(start) && !Number.isNaN(end) && now >= start && now <= end) return "active"
  return "filled"
}

function applySharedFilters(query, sharedFilters) {
  const nextQuery = { ...query }

  if (sharedFilters.position_type_id !== "all") {
    nextQuery.position_type_id = Number(sharedFilters.position_type_id)
  }

  if (sharedFilters.business_id !== "all") {
    nextQuery.business_id = Number(sharedFilters.business_id)
  }

  return nextQuery
}

function buildInterestQuery(page, limit, sharedFilters, filters) {
  const query = applySharedFilters({ page, limit }, sharedFilters)

  if (filters.mutual !== "all") {
    query.mutual = filters.mutual
  }

  return query
}

function buildInvitationQuery(page, limit, sharedFilters) {
  return applySharedFilters({ page, limit }, sharedFilters)
}

function buildCommittedQuery(page, limit, sharedFilters, filters) {
  const query = applySharedFilters({ page, limit }, sharedFilters)

  if (filters.commitment_state !== "all") {
    query.commitment_state = filters.commitment_state
  }

  if (filters.status !== "all") {
    query.status = filters.status
  }

  return query
}

function SectionPagination({ pagination, isLoading, onPrevious, onNext, onLimitChange }) {
  const totalPages = Math.max(1, Math.ceil((pagination.count || 0) / pagination.limit))

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <div className="text-sm text-muted-foreground">
        {pagination.count} total result{pagination.count === 1 ? "" : "s"}
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm">Per page</Label>
        <Select value={String(pagination.limit)} onValueChange={onLimitChange}>
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Limit" />
          </SelectTrigger>
          <SelectContent>
            {LIMIT_OPTIONS.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" disabled={pagination.page <= 1 || isLoading} onClick={onPrevious}>
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {pagination.page} of {totalPages}
        </span>
        <Button
          variant="outline"
          disabled={pagination.page >= totalPages || isLoading}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

function EmptyState({ children }) {
  return (
    <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}

function SelectFilter({ label, value, onValueChange, placeholder, options, allLabel = "All" }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function SectionHeading({ eyebrow, title, description, count }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {eyebrow}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {typeof count === "number" ? <Badge variant="secondary">{count}</Badge> : null}
      </div>
      <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function DecisionButtons({ negotiationId, isBusy, onDecide }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button disabled={isBusy} onClick={() => onDecide(negotiationId, "accept")}>
        Accept
      </Button>
      <Button variant="outline" disabled={isBusy} onClick={() => onDecide(negotiationId, "decline")}>
        Decline
      </Button>
    </div>
  )
}

export const RegularMyJobsPage = () => {
  const { user, refreshUser } = useAuth()

  const [positionTypes, setPositionTypes] = useState([])
  const [businesses, setBusinesses] = useState([])

  const [sharedFilters, setSharedFilters] = useState(DEFAULT_SHARED_FILTERS)

  const [interestItems, setInterestItems] = useState([])
  const [interestFilters, setInterestFilters] = useState(DEFAULT_INTEREST_FILTERS)
  const [interestPagination, setInterestPagination] = useState({ page: 1, limit: 10, count: 0 })
  const [isLoadingInterests, setIsLoadingInterests] = useState(true)

  const [invitationItems, setInvitationItems] = useState([])
  const [invitationPagination, setInvitationPagination] = useState({ page: 1, limit: 10, count: 0 })
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true)

  const [committedJobs, setCommittedJobs] = useState([])
  const [committedFilters, setCommittedFilters] = useState(DEFAULT_COMMITTED_FILTERS)
  const [committedPagination, setCommittedPagination] = useState({ page: 1, limit: 10, count: 0 })
  const [isLoadingCommittedJobs, setIsLoadingCommittedJobs] = useState(true)

  const [activeNegotiation, setActiveNegotiation] = useState(null)
  const [isLoadingNegotiation, setIsLoadingNegotiation] = useState(true)
  const [decisionBusy, setDecisionBusy] = useState(false)
  const [busyJobId, setBusyJobId] = useState(null)
  const [error, setError] = useState("")

  const businessOptions = useMemo(
    () => businesses.map((business) => ({ value: String(business.id), label: business.business_name })),
    [businesses],
  )

  const positionTypeOptions = useMemo(
    () => positionTypes.map((positionType) => ({ value: String(positionType.id), label: positionType.name })),
    [positionTypes],
  )

  const committedJobsWithState = useMemo(
    () => committedJobs.map((job) => ({ ...job, commitment_state: deriveCommitmentState(job) })),
    [committedJobs],
  )

  const hasSharedFilters =
    sharedFilters.position_type_id !== "all" || sharedFilters.business_id !== "all"

  const hasNeedsAttention = Boolean(activeNegotiation) || invitationPagination.count > 0

  const loadFilterOptions = async () => {
    try {
      const [positionTypeResponse, businessResponse] = await Promise.all([
        apiClient.getPositionTypes({ query: { page: 1, limit: 100, name: "asc" } }),
        apiClient.getBusinesses({ query: { page: 1, limit: 100, sort: "business_name", order: "asc" } }),
      ])

      setPositionTypes(positionTypeResponse?.results || [])
      setBusinesses(businessResponse?.results || [])
    } catch {
      // keep filters usable even if auxiliary data cannot be loaded
    }
  }

  const loadInterests = async (
    page = interestPagination.page,
    limit = interestPagination.limit,
    nextSharedFilters = sharedFilters,
    filters = interestFilters,
  ) => {
    setIsLoadingInterests(true)
    try {
      const response = await apiClient.getUsersMeInterests({
        query: buildInterestQuery(page, limit, nextSharedFilters, filters),
      })
      setInterestItems(response?.results || [])
      setInterestPagination((current) => ({ ...current, page, limit, count: response?.count || 0 }))
    } catch (err) {
      const message = err.message || "Failed to load your interested jobs."
      setError(message)
      notify.error(message)
    } finally {
      setIsLoadingInterests(false)
    }
  }

  const loadInvitations = async (
    page = invitationPagination.page,
    limit = invitationPagination.limit,
    nextSharedFilters = sharedFilters,
  ) => {
    setIsLoadingInvitations(true)
    try {
      const response = await apiClient.getUsersMeInvitations({
        query: buildInvitationQuery(page, limit, nextSharedFilters),
      })
      setInvitationItems(response?.results || [])
      setInvitationPagination((current) => ({ ...current, page, limit, count: response?.count || 0 }))
    } catch (err) {
      const message = err.message || "Failed to load your invitations."
      setError(message)
      notify.error(message)
    } finally {
      setIsLoadingInvitations(false)
    }
  }

  const loadCommittedJobs = async (
    page = committedPagination.page,
    limit = committedPagination.limit,
    nextSharedFilters = sharedFilters,
    filters = committedFilters,
  ) => {
    setIsLoadingCommittedJobs(true)
    try {
      const response = await apiClient.getUsersMeJobs({
        query: buildCommittedQuery(page, limit, nextSharedFilters, filters),
      })
      setCommittedJobs(response?.results || [])
      setCommittedPagination((current) => ({ ...current, page, limit, count: response?.count || 0 }))
    } catch (err) {
      const message = err.message || "Failed to load your job history."
      setError(message)
      notify.error(message)
    } finally {
      setIsLoadingCommittedJobs(false)
    }
  }

  const loadNegotiation = async () => {
    setIsLoadingNegotiation(true)
    try {
      const response = await apiClient.getNegotiationsMe()
      setActiveNegotiation(response)
    } catch (err) {
      if (err?.status === 404) {
        setActiveNegotiation(null)
      } else {
        notify.error(err.message || "Failed to load active negotiation.")
      }
    } finally {
      setIsLoadingNegotiation(false)
    }
  }

  useEffect(() => {
    loadFilterOptions()
    loadNegotiation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadInterests(interestPagination.page, interestPagination.limit, sharedFilters, interestFilters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedFilters, interestFilters, interestPagination.page, interestPagination.limit])

  useEffect(() => {
    loadInvitations(invitationPagination.page, invitationPagination.limit, sharedFilters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedFilters, invitationPagination.page, invitationPagination.limit])

  useEffect(() => {
    loadCommittedJobs(committedPagination.page, committedPagination.limit, sharedFilters, committedFilters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedFilters, committedFilters, committedPagination.page, committedPagination.limit])

  const reloadLists = async () => {
    await Promise.all([
      loadInterests(),
      loadInvitations(),
      loadCommittedJobs(),
      loadNegotiation(),
      refreshUser(),
    ])
  }

  const actOnJob = async (jobId, action, successMessage, useNegotiationMessages = false) => {
    setBusyJobId(jobId)
    setError("")

    try {
      await action()
      notify.success(successMessage)
      await reloadLists()
    } catch (err) {
      const message = useNegotiationMessages
        ? getNegotiationStartErrorMessage(err, user)
        : err.message || "Unable to update this job."
      setError(message)
      notify.error(message)
      await refreshUser()
      if (useNegotiationMessages) {
        await Promise.allSettled([loadInterests(), loadInvitations(), loadNegotiation()])
      }
    } finally {
      setBusyJobId(null)
    }
  }

  const handleExpressInterest = (job) =>
    actOnJob(
      job.id,
      () =>
        apiClient.patchJobsJobIdInterested({
          pathParams: { jobId: job.id },
          body: { interested: true },
        }),
      "Interest recorded.",
    )

  const handleWithdrawInterest = (job) =>
    actOnJob(
      job.id,
      () =>
        apiClient.patchJobsJobIdInterested({
          pathParams: { jobId: job.id },
          body: { interested: false },
        }),
      "Interest withdrawn.",
    )

  const handleStartNegotiation = async (job) => {
    const blockedReason = getRegularNegotiationBlockReason(user)
    if (blockedReason) {
      setError(blockedReason)
      notify.error(blockedReason)
      await refreshUser()
      return
    }

    return actOnJob(
      job.id,
      () =>
        apiClient.postNegotiations({
          body: { interest_id: job.interest_id },
        }),
      "Negotiation started.",
      true,
    )
  }


  const handleDecision = async (negotiationId, decision) => {
    setDecisionBusy(true)
    try {
      await apiClient.patchNegotiationsMeDecision({
        body: { negotiation_id: negotiationId, decision },
      })
      notify.success(`Negotiation ${decision === "accept" ? "updated" : "declined"}.`)
      await reloadLists()
    } catch (err) {
      notify.error(err.message || "Failed to update negotiation.")
    } finally {
      setDecisionBusy(false)
    }
  }

  const updateSharedFilter = (key, value) => {
    setInterestPagination((current) => ({ ...current, page: 1 }))
    setInvitationPagination((current) => ({ ...current, page: 1 }))
    setCommittedPagination((current) => ({ ...current, page: 1 }))
    setSharedFilters((current) => ({ ...current, [key]: value }))
  }

  const resetAllFilters = () => {
    setSharedFilters(DEFAULT_SHARED_FILTERS)
    setInterestFilters(DEFAULT_INTEREST_FILTERS)
    setCommittedFilters(DEFAULT_COMMITTED_FILTERS)
    setInterestPagination((current) => ({ ...current, page: 1 }))
    setInvitationPagination((current) => ({ ...current, page: 1 }))
    setCommittedPagination((current) => ({ ...current, page: 1 }))
  }

  const updateInterestFilter = (key, value) => {
    setInterestPagination((current) => ({ ...current, page: 1 }))
    setInterestFilters((current) => ({ ...current, [key]: value }))
  }

  const updateCommittedFilter = (key, value) => {
    setCommittedPagination((current) => ({ ...current, page: 1 }))
    setCommittedFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Activity</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Everything related to your jobs lives here: items that need a response, jobs you are tracking,
            and your past or upcoming commitments.
          </p>
        </div>
      </div>

      {user?.suspended ? (
        <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Your account is currently suspended. A business may have reported a no-show on a filled job. Contact an administrator if you believe this is incorrect.
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Filter all sections</CardTitle>
          <CardDescription>
            Narrow invitations, active interests, and job history using the same business and position type filters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SelectFilter
              label="Position Type"
              value={sharedFilters.position_type_id}
              onValueChange={(value) => updateSharedFilter("position_type_id", value)}
              placeholder="All position types"
              options={positionTypeOptions}
              allLabel="All position types"
            />
            <SelectFilter
              label="Business"
              value={sharedFilters.business_id}
              onValueChange={(value) => updateSharedFilter("business_id", value)}
              placeholder="All businesses"
              options={businessOptions}
              allLabel="All businesses"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={resetAllFilters} disabled={!hasSharedFilters && interestFilters.mutual === "all" && committedFilters.commitment_state === "all" && committedFilters.status === "all"}>
              Reset filters
            </Button>
            <span className="text-sm text-muted-foreground">
              Section-specific filters stay inside each section below.
            </span>
          </div>
        </CardContent>
      </Card>

      <section className="mb-10 space-y-6">
        <SectionHeading
          eyebrow="Needs attention"
          title="Take action"
          count={(activeNegotiation ? 1 : 0) + invitationPagination.count}
          description="Respond to anything that currently needs your decision, starting with live negotiations and outstanding invitations."
        />

        {isLoadingNegotiation || isLoadingInvitations ? null : !hasNeedsAttention ? (
          <EmptyState>You do not have any items that need action right now.</EmptyState>
        ) : null}

        {!isLoadingNegotiation && activeNegotiation ? (
          <Card>
            <CardHeader>
              <CardTitle>Active Negotiation</CardTitle>
              <CardDescription>
                This job is currently in exclusive negotiation. If both sides accept, the job becomes filled.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 rounded-2xl border px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{activeNegotiation.job?.position_type?.name || `Job #${activeNegotiation.job?.id}`}</div>
                    <div className="text-sm text-muted-foreground">
                      {activeNegotiation.job?.business?.business_name || "Unknown business"}
                    </div>
                  </div>
                  <Badge variant="secondary">Ends {formatDateTime(activeNegotiation.expiresAt)}</Badge>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm">
                    <div className="font-medium">Your decision</div>
                    <div className="text-muted-foreground">{activeNegotiation.decisions?.candidate || "pending"}</div>
                  </div>
                  <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm">
                    <div className="font-medium">Business decision</div>
                    <div className="text-muted-foreground">{activeNegotiation.decisions?.business || "pending"}</div>
                  </div>
                </div>

                <DecisionButtons
                  negotiationId={activeNegotiation.id}
                  isBusy={decisionBusy}
                  onDecide={handleDecision}
                />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {(isLoadingInvitations || invitationPagination.count > 0) ? (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle>Invitations</CardTitle>
                <Badge variant="secondary">{invitationPagination.count}</Badge>
              </div>
              <CardDescription>
                Businesses have invited you to show interest in these jobs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingInvitations ? (
                <div className="text-sm text-muted-foreground">Loading invitations...</div>
              ) : invitationItems.length === 0 ? (
                <EmptyState>No invitations match the current filters.</EmptyState>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {invitationItems.map((job) => (
                    <JobCard
                      key={`invitation-${job.id}`}
                      role="regular"
                      mode="invitations"
                      job={job}
                      busy={busyJobId === job.id}
                      onExpressInterest={handleExpressInterest}
                    />
                  ))}
                </div>
              )}

              <SectionPagination
                pagination={invitationPagination}
                isLoading={isLoadingInvitations}
                onLimitChange={(value) =>
                  setInvitationPagination((current) => ({ ...current, page: 1, limit: Number(value) }))
                }
                onPrevious={() =>
                  setInvitationPagination((current) => ({ ...current, page: current.page - 1 }))
                }
                onNext={() =>
                  setInvitationPagination((current) => ({ ...current, page: current.page + 1 }))
                }
              />
            </CardContent>
          </Card>
        ) : null}
      </section>

      <section className="mb-10 space-y-6">
        <SectionHeading
          eyebrow="In progress"
          title="Jobs you are tracking"
          count={interestPagination.count}
          description="These are jobs where you have already expressed interest. Use the section filter to focus on mutual interest or jobs still waiting on the business."
        />

        <Card>
          <CardHeader>
            <CardTitle>Interested Jobs</CardTitle>
            <CardDescription>
              You will be notified automatically when a mutual match is ready to negotiate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SelectFilter
                label="Interest Status"
                value={interestFilters.mutual}
                onValueChange={(value) => updateInterestFilter("mutual", value)}
                placeholder="All interest states"
                options={[
                  { value: "true", label: "Mutual interest" },
                  { value: "false", label: "Waiting on business" },
                ]}
                allLabel="All interest states"
              />
            </div>

            {isLoadingInterests ? (
              <div className="text-sm text-muted-foreground">Loading interested jobs...</div>
            ) : interestItems.length === 0 ? (
              <EmptyState>No interested jobs match the current filters.</EmptyState>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {interestItems.map((item) => {
                  const job = { ...item.job, interest_id: item.interest_id, mutual: item.mutual }
                  return (
                    <JobCard
                      key={`interest-${job.id}`}
                      role="regular"
                      mode="interests"
                      job={job}
                      busy={busyJobId === job.id}
                      onWithdrawInterest={handleWithdrawInterest}
                      onStartNegotiation={handleStartNegotiation}
                    />
                  )
                })}
              </div>
            )}

            <SectionPagination
              pagination={interestPagination}
              isLoading={isLoadingInterests}
              onLimitChange={(value) =>
                setInterestPagination((current) => ({ ...current, page: 1, limit: Number(value) }))
              }
              onPrevious={() =>
                setInterestPagination((current) => ({ ...current, page: current.page - 1 }))
              }
              onNext={() =>
                setInterestPagination((current) => ({ ...current, page: current.page + 1 }))
              }
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="History"
          title="Job history"
          count={committedPagination.count}
          description="Review confirmed work, upcoming filled jobs, completed shifts, and canceled commitments in one place."
        />

        <Card>
          <CardHeader>
            <CardTitle>Committed Jobs</CardTitle>
            <CardDescription>
              Use the history filters to focus on current commitments, completed work, or canceled jobs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SelectFilter
                label="Commitment State"
                value={committedFilters.commitment_state}
                onValueChange={(value) => updateCommittedFilter("commitment_state", value)}
                placeholder="All commitment states"
                options={[
                  { value: "upcoming", label: "Upcoming" },
                  { value: "active", label: "Active" },
                  { value: "completed", label: "Completed" },
                  { value: "canceled", label: "Canceled" },
                ]}
                allLabel="All commitment states"
              />
              <SelectFilter
                label="Job Status"
                value={committedFilters.status}
                onValueChange={(value) => updateCommittedFilter("status", value)}
                placeholder="All statuses"
                options={[
                  { value: "filled", label: "Filled" },
                  { value: "completed", label: "Completed" },
                  { value: "canceled", label: "Canceled" },
                ]}
                allLabel="All statuses"
              />
            </div>

            {isLoadingCommittedJobs ? (
              <div className="text-sm text-muted-foreground">Loading job history...</div>
            ) : committedJobsWithState.length === 0 ? (
              <EmptyState>No committed jobs match the current filters.</EmptyState>
            ) : (
              <div className="space-y-3">
                {committedJobsWithState.map((job) => (
                  <div key={job.id} className="space-y-4 rounded-2xl border px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar
                          user={{ ...job.business, role: "business" }}
                          className="h-10 w-10"
                          fallbackClassName="text-xs"
                        />
                        <div className="min-w-0">
                          <div className="font-medium">{job.position_type?.name || `Job #${job.id}`}</div>
                          <div className="truncate text-sm text-muted-foreground">
                            {job.business?.business_name || "Unknown business"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatAvatarStatusLabel(deriveUserAvatarStatus({ ...job.business, role: "business" }))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={jobStatusVariant(job.status)}>{job.status}</Badge>
                        <Badge variant="outline">{job.commitment_state}</Badge>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Pay</Label>
                        <div className="text-sm font-medium">{formatSalaryRange(job)}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Start</Label>
                        <div className="text-sm font-medium">{formatDateTime(job.start_time)}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">End</Label>
                        <div className="text-sm font-medium">{formatDateTime(job.end_time)}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Updated</Label>
                        <div className="text-sm font-medium">{formatDateTime(job.updatedAt)}</div>
                      </div>
                    </div>

                    {job.note ? (
                      <div>
                        <Label className="text-xs text-muted-foreground">Note</Label>
                        <div className="text-sm">{job.note}</div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            <SectionPagination
              pagination={committedPagination}
              isLoading={isLoadingCommittedJobs}
              onLimitChange={(value) =>
                setCommittedPagination((current) => ({ ...current, page: 1, limit: Number(value) }))
              }
              onPrevious={() =>
                setCommittedPagination((current) => ({ ...current, page: current.page - 1 }))
              }
              onNext={() =>
                setCommittedPagination((current) => ({ ...current, page: current.page + 1 }))
              }
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
