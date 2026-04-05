import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/context/auth-context"
import { apiClient, regularJobsApi } from "@/lib/api/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { formatDateTime, formatSalaryRange, jobStatusVariant } from "@/components/jobs/job-utils"

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

function summaryCount(jobs, matcher) {
  return jobs.filter(matcher).length
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
  const [jobs, setJobs] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, count: 0 })
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [activeNegotiation, setActiveNegotiation] = useState(null)
  const [isLoadingNegotiation, setIsLoadingNegotiation] = useState(true)
  const [decisionBusy, setDecisionBusy] = useState(false)
  const [error, setError] = useState("")

  const loadJobs = async (page = pagination.page, limit = pagination.limit) => {
    setIsLoadingJobs(true)
    setError("")
    try {
      const response = await regularJobsApi.listMine({ page, limit })
      setJobs(response?.results || [])
      setPagination({ page, limit, count: response?.count || 0 })
    } catch (err) {
      const message = err.message || "Failed to load your jobs."
      setError(message)
      toast.error(message)
    } finally {
      setIsLoadingJobs(false)
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
        toast.error(err.message || "Failed to load active negotiation.")
      }
    } finally {
      setIsLoadingNegotiation(false)
    }
  }

  useEffect(() => {
    loadJobs(1, pagination.limit)
    loadNegotiation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDecision = async (negotiationId, decision) => {
    setDecisionBusy(true)
    try {
      await apiClient.patchNegotiationsMeDecision({
        body: { negotiation_id: negotiationId, decision },
      })
      toast.success(`Negotiation ${decision === "accept" ? "updated" : "declined"}.`)
      await Promise.all([loadJobs(pagination.page, pagination.limit), loadNegotiation(), refreshUser()])
    } catch (err) {
      toast.error(err.message || "Failed to update negotiation.")
    } finally {
      setDecisionBusy(false)
    }
  }

  const jobsWithState = useMemo(
    () => jobs.map((job) => ({ ...job, commitment_state: deriveCommitmentState(job) })),
    [jobs],
  )

  const totalPages = Math.max(1, Math.ceil((pagination.count || 0) / pagination.limit))

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Jobs</h1>
          <p className="mt-2 text-muted-foreground">
            Review your current commitments, completed work, canceled jobs, and any active negotiation that still needs your decision.
          </p>
        </div>
        <Badge variant="secondary">Regular</Badge>
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

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
            <CardDescription>Filled jobs that have not started yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summaryCount(jobsWithState, (job) => job.commitment_state === "upcoming")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active</CardTitle>
            <CardDescription>Jobs currently in progress.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summaryCount(jobsWithState, (job) => job.commitment_state === "active")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
            <CardDescription>Past commitments and completed work.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summaryCount(jobsWithState, (job) => job.commitment_state === "completed")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Canceled</CardTitle>
            <CardDescription>Includes no-show cancellations.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{summaryCount(jobsWithState, (job) => job.commitment_state === "canceled")}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Active Negotiation</CardTitle>
          <CardDescription>
            While a negotiation is active, neither side can negotiate with anyone else. If both sides accept, the job becomes filled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingNegotiation ? (
            <div className="text-sm text-muted-foreground">Loading active negotiation...</div>
          ) : !activeNegotiation ? (
            <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              You do not currently have an active negotiation.
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Committed Jobs</CardTitle>
          <CardDescription>
            These are jobs that were filled by you. Canceled jobs are shown so the outcome of any no-show report is visible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingJobs ? (
            <div className="text-sm text-muted-foreground">Loading your jobs...</div>
          ) : jobsWithState.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              You do not have any filled or past committed jobs yet.
            </div>
          ) : (
            <div className="space-y-3">
              {jobsWithState.map((job) => (
                <div
                  key={job.id}
                  className="space-y-4 rounded-2xl border px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{job.position_type?.name || `Job #${job.id}`}</div>
                      <div className="text-sm text-muted-foreground">{job.business?.business_name || "Unknown business"}</div>
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

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-sm text-muted-foreground">
              {pagination.count} total job{pagination.count === 1 ? "" : "s"}
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="my-jobs-limit" className="text-sm">Per page</Label>
              <select
                id="my-jobs-limit"
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={String(pagination.limit)}
                onChange={(event) => {
                  const nextLimit = Number(event.target.value)
                  loadJobs(1, nextLimit)
                }}
              >
                {[10, 20, 50].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={pagination.page <= 1 || isLoadingJobs}
                onClick={() => loadJobs(pagination.page - 1, pagination.limit)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page >= totalPages || isLoadingJobs}
                onClick={() => loadJobs(pagination.page + 1, pagination.limit)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
