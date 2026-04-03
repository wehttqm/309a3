import { useEffect, useMemo, useState } from "react"
import { apiClient } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export function JobCandidatesDialog({ open, onOpenChange, job, onDataChanged }) {
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
        apiClient.getJobsJobIdCandidates({
          pathParams: { jobId: job.id },
          query: { page: candidatePage, limit: candidateLimit },
        }),
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
      setError(actionError.message || "Unable to update invitation.")
    } finally {
      setBusyKey("")
    }
  }

  const handleStartNegotiation = async (interest) => {
    const actionKey = `negotiate-${interest.interest_id}`
    setBusyKey(actionKey)
    setError("")

    try {
      await apiClient.postNegotiations({
        body: { interest_id: interest.interest_id },
      })
      await load()
      await onDataChanged?.()
    } catch (actionError) {
      setError(actionError.message || "Unable to start negotiation.")
    } finally {
      setBusyKey("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Manage Candidates</DialogTitle>
          <DialogDescription>
            Review discoverable candidates, manage invitations, and start negotiation once interest is mutual.
          </DialogDescription>
        </DialogHeader>

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
                <div key={candidate.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <div className="font-medium">
                      {candidate.first_name} {candidate.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {candidate.invited ? "Already invited" : "Not invited"}
                    </div>
                  </div>
                  <Button
                    variant={candidate.invited ? "outline" : "default"}
                    disabled={busyKey === `invite-${candidate.id}`}
                    onClick={() => handleInviteToggle(candidate, !candidate.invited)}
                  >
                    {candidate.invited ? "Withdraw Invite" : "Invite"}
                  </Button>
                </div>
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
                <div key={interest.interest_id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <div className="font-medium">
                      {interest.user.first_name} {interest.user.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {interest.mutual ? "Mutual interest" : "Candidate interested"}
                    </div>
                  </div>
                  {interest.mutual ? (
                    <Button
                      disabled={busyKey === `negotiate-${interest.interest_id}`}
                      onClick={() => handleStartNegotiation(interest)}
                    >
                      Start Negotiation
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled={busyKey === `invite-${interest.user.id}`}
                      onClick={() =>
                        handleInviteToggle(
                          { id: interest.user.id, invited: false },
                          true
                        )
                      }
                    >
                      Invite Back
                    </Button>
                  )}
                </div>
              ))}

              <PaginationControls
                page={interestPage}
                count={interestCount}
                limit={interestLimit}
                isLoading={isLoading}
                onPrevious={() => setInterestPage((current) => Math.max(1, current - 1))}
                onNext={() =>
                  setInterestPage((current) => Math.min(interestTotalPages, current + 1))
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
  )
}
