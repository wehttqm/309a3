import { useEffect, useMemo, useState } from "react"
import { apiClient } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { useSocket } from "@/context/socket-context"
import { useAuth } from "@/context/auth-context"
import { canReportNoShow } from "@/components/jobs/job-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserAvatar } from "@/components/user-avatar"
import { StartNegotiationDialog } from "@/components/negotiation/start-negotiation-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const LIMIT_OPTIONS = ["10", "20", "50"]

function PaginationControls({ page, count, limit, isLoading, onPrevious, onNext, onLimitChange }) {
  const totalPages = Math.max(1, Math.ceil(count / limit))

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          Page {page} of {totalPages}
        </span>
        <Select value={String(limit)} onValueChange={(value) => onLimitChange(Number(value))}>
          <SelectTrigger className="h-8 w-24">
            <SelectValue placeholder="Limit" />
          </SelectTrigger>
          <SelectContent>
            {LIMIT_OPTIONS.map((value) => (
              <SelectItem key={value} value={value}>
                {value} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={isLoading || page <= 1} onClick={onPrevious}>
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isLoading || page >= totalPages}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

function CandidateRow({ candidate, subtitle, children }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          user={{ ...candidate, role: "regular" }}
          className="h-10 w-10"
          fallbackClassName="text-xs"
          showStatus={false}
        />
        <div className="min-w-0">
          <div className="truncate font-medium">
            {candidate.first_name} {candidate.last_name}
          </div>
          <div className="text-sm text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2">{children}</div>
    </div>
  )
}

export function JobCandidatesDialog({ open, onOpenChange, job, onDataChanged, onReportNoShow }) {
  const { user } = useAuth()
  const { openNegotiation } = useSocket()
  const [candidates, setCandidates] = useState([])
  const [candidateCount, setCandidateCount] = useState(0)
  const [candidatePage, setCandidatePage] = useState(1)
  const [candidateLimit, setCandidateLimit] = useState(10)

  const [interests, setInterests] = useState([])
  const [interestCount, setInterestCount] = useState(0)
  const [interestPage, setInterestPage] = useState(1)
  const [interestLimit, setInterestLimit] = useState(10)

  const [isLoading, setIsLoading] = useState(false)
  const [busyKey, setBusyKey] = useState("")
  const [error, setError] = useState("")
  const [pendingNegotiation, setPendingNegotiation] = useState(null)

  const isJobOpen = job?.status === "open"
  const canReportNoShowForJob = canReportNoShow(job)
  const candidateTotalPages = useMemo(
    () => Math.max(1, Math.ceil(candidateCount / candidateLimit)),
    [candidateCount, candidateLimit]
  )
  const interestTotalPages = useMemo(
    () => Math.max(1, Math.ceil(interestCount / interestLimit)),
    [interestCount, interestLimit]
  )

  const load = async () => {
    if (!job?.id || !open) return
    setIsLoading(true)
    setError("")

    try {
      const [candidateData, interestData] = await Promise.all([
        isJobOpen
          ? apiClient.getJobsJobIdCandidates({
              pathParams: { jobId: job.id },
              query: { page: candidatePage, limit: candidateLimit },
            })
          : Promise.resolve({ count: 0, results: [] }),
        apiClient.getJobsJobIdInterests({
          pathParams: { jobId: job.id },
          query: { page: interestPage, limit: interestLimit },
        }),
      ])

      setCandidates(candidateData?.results || [])
      setCandidateCount(candidateData?.count || 0)
      setInterests(interestData?.results || [])
      setInterestCount(interestData?.count || 0)
    } catch (loadError) {
      setError(loadError.message || "Unable to load candidates.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    load()
  }, [open, job?.id, candidatePage, candidateLimit, interestPage, interestLimit])

  useEffect(() => {
    if (!open || !job?.id) return
    setCandidatePage(1)
    setInterestPage(1)
  }, [open, job?.id])

  const handleInviteToggle = async (candidate, interested) => {
    if (!isJobOpen) return

    const actionKey = `invite-${candidate.id}`
    setBusyKey(actionKey)
    setError("")

    try {
      await apiClient.patchJobsJobIdCandidatesUserIdInterested({
        pathParams: { jobId: job.id, userId: candidate.id },
        body: { interested },
      })
      await load()
      await onDataChanged?.()
    } catch (actionError) {
      if (actionError?.status === 403 && actionError?.payload?.code === "not_discoverable") {
        await load()
        const issue = actionError?.payload?.issues?.[0]
        setError(issue?.message || "This candidate is no longer discoverable. The candidate lists were refreshed.")
      } else {
        setError(actionError.message || "Unable to update invitation.")
      }
    } finally {
      setBusyKey("")
    }
  }

  const handleStartNegotiation = (interest) => {
    if (!isJobOpen) return

    setPendingNegotiation({
      interestId: interest.interest_id,
      jobId: job.id,
      positionName: job?.position_type?.name || `Job #${job?.id}`,
      helperText: "The candidate and business will be moved into the exclusive negotiation window.",
      candidate: {
        ...interest.user,
        role: "regular",
        name: `${interest.user.first_name || ""} ${interest.user.last_name || ""}`.trim(),
      },
      business: {
        id: user?.id,
        role: "business",
        business_name: user?.business_name || job?.business?.business_name,
        name: user?.business_name || job?.business?.business_name || "Business",
        avatar: user?.avatar || job?.business?.avatar,
      },
    })
  }

  const confirmStartNegotiation = async () => {
    if (!pendingNegotiation?.interestId) return
    const actionKey = `negotiate-${pendingNegotiation.interestId}`
    setBusyKey(actionKey)
    setError("")

    try {
      await apiClient.postNegotiations({
        body: { interest_id: pendingNegotiation.interestId },
      })
      setPendingNegotiation(null)
      await load()
      await onDataChanged?.()
      openNegotiation()
    } catch (actionError) {
      setError(actionError.message || "Unable to start negotiation.")
    } finally {
      setBusyKey("")
    }
  }


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <DialogTitle>{isJobOpen ? "Manage Candidates" : "Candidate History"}</DialogTitle>
                <DialogDescription>
                  {isJobOpen
                    ? "Review discoverable candidates, manage invitations, and start negotiation once interest is mutual."
                    : "This job is no longer open. You can review prior candidate interest, but invitations and new negotiations are disabled."}
                </DialogDescription>
              </div>
              {canReportNoShowForJob ? (
                <Button variant="destructive" onClick={() => onReportNoShow?.(job)}>
                  Report No-show
                </Button>
              ) : null}
            </div>
          </DialogHeader>

          {!isJobOpen ? (
            <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              This job is {job?.status || "not open"}. Candidate discovery, invitations, and starting a new negotiation are unavailable.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Discoverable Candidates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
                {!isLoading && candidates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No candidates found.</p>
                ) : null}
                {candidates.map((candidate) => (
                  <CandidateRow
                    key={candidate.id}
                    candidate={candidate}
                    subtitle={candidate.invited ? "Already invited" : "Not invited"}
                  >
                    <Button
                      variant={candidate.invited ? "outline" : "default"}
                      disabled={!isJobOpen || busyKey === `invite-${candidate.id}`}
                      onClick={() => handleInviteToggle(candidate, !candidate.invited)}
                    >
                      {isJobOpen ? (candidate.invited ? "Withdraw Invite" : "Invite") : "Invitations Closed"}
                    </Button>
                  </CandidateRow>
                ))}

                <PaginationControls
                  page={candidatePage}
                  count={candidateCount}
                  limit={candidateLimit}
                  isLoading={isLoading}
                  onPrevious={() => setCandidatePage((current) => Math.max(1, current - 1))}
                  onNext={() =>
                    setCandidatePage((current) =>
                      Math.min(candidateTotalPages, current + 1)
                    )
                  }
                  onLimitChange={(value) => {
                    setCandidateLimit(value)
                    setCandidatePage(1)
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Interested Candidates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
                {!isLoading && interests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No candidate has expressed interest yet.</p>
                ) : null}
                {interests.map((interest) => (
                  <CandidateRow
                    key={interest.interest_id}
                    candidate={interest.user}
                    subtitle={interest.mutual ? "Mutual interest" : "Candidate interested"}
                  >
                    {interest.mutual ? (
                      isJobOpen ? (
                        <Button
                          disabled={busyKey === `negotiate-${interest.interest_id}`}
                          onClick={() => handleStartNegotiation(interest)}
                        >
                          Start Negotiation
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Negotiation is unavailable because this job is no longer open.</span>
                      )
                    ) : isJobOpen ? (
                      <Button
                        variant="outline"
                        disabled={busyKey === `invite-${interest.user.id}`}
                        onClick={() => handleInviteToggle(interest.user, true)}
                      >
                        Invite
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">This candidate is interested, but the job is no longer open.</span>
                    )}
                  </CandidateRow>
                ))}

                <PaginationControls
                  page={interestPage}
                  count={interestCount}
                  limit={interestLimit}
                  isLoading={isLoading}
                  onPrevious={() => setInterestPage((current) => Math.max(1, current - 1))}
                  onNext={() =>
                    setInterestPage((current) =>
                      Math.min(interestTotalPages, current + 1)
                    )
                  }
                  onLimitChange={(value) => {
                    setInterestLimit(value)
                    setInterestPage(1)
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <StartNegotiationDialog
        open={Boolean(pendingNegotiation)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingNegotiation(null)
        }}
        target={pendingNegotiation}
        isSubmitting={Boolean(pendingNegotiation) && busyKey === `negotiate-${pendingNegotiation.interestId}`}
        onConfirm={confirmStartNegotiation}
      />
    </>
  )
}
