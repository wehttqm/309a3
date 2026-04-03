import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  formatDateTime,
  formatSalaryRange,
  jobStatusVariant,
} from "@/components/jobs/job-utils"

function Detail({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value || "—"}</span>
    </div>
  )
}

function formatDistance(value) {
  if (value === null || value === undefined || value === "") return "—"
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `${numeric.toFixed(1)} km`
}

function formatEta(value) {
  if (value === null || value === undefined || value === "") return "—"
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `${Math.round(numeric)} min`
}

function getRegularBrowseState(job) {
  if (job?.mutual && job?.interest_id) {
    return { label: "Mutual interest", variant: "default" }
  }

  if (job?.is_interested) {
    return { label: "Interest expressed", variant: "secondary" }
  }

  if (job?.invited) {
    return { label: "Invitation received", variant: "outline" }
  }

  return null
}

export function JobCard({
  role,
  mode,
  job,
  busy = false,
  onExpressInterest,
  onWithdrawInterest,
  onStartNegotiation,
  onEdit,
  onDelete,
  onManageCandidates,
}) {
  const title = job?.position_type?.name || `Job #${job?.id}`
  const businessName = job?.business?.business_name || "—"
  const isMutual = Boolean(job?.mutual)
  const showAvailableJobFields = role === "regular" && mode === "browse"
  const regularBrowseState = showAvailableJobFields ? getRegularBrowseState(job) : null

  return (
    <Card className="h-full">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{businessName}</p>
          </div>
          <Badge variant={jobStatusVariant(job?.status)}>{job?.status || "unknown"}</Badge>
        </div>
        {regularBrowseState ? (
          <div>
            <Badge variant={regularBrowseState.variant}>{regularBrowseState.label}</Badge>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-0">
        <Detail label="Position Type" value={job?.position_type?.name} />
        <Detail label="Business" value={businessName} />
        <Detail label="Pay" value={formatSalaryRange(job)} />
        <Detail label="Start" value={formatDateTime(job?.start_time)} />
        <Detail label="End" value={formatDateTime(job?.end_time)} />

        {showAvailableJobFields ? <Detail label="Updated" value={formatDateTime(job?.updatedAt)} /> : null}

        {job?.distance !== undefined ? <Detail label="Distance" value={formatDistance(job.distance)} /> : null}

        {job?.eta !== undefined ? <Detail label="ETA" value={formatEta(job.eta)} /> : null}

        {job?.note ? <Detail label="Note" value={job.note} /> : null}

        {role === "regular" && mode === "interests" ? (
          <Detail label="Mutual interest" value={isMutual ? "Yes" : "No"} />
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        {role === "regular" && mode === "browse" ? (
          <>
            {job?.mutual && job?.interest_id ? (
              <>
                <Button disabled={busy} onClick={() => onStartNegotiation?.(job)}>
                  Start Negotiation
                </Button>
                <Button variant="outline" disabled={busy} onClick={() => onWithdrawInterest?.(job)}>
                  Withdraw Interest
                </Button>
              </>
            ) : job?.is_interested ? (
              <Button variant="outline" disabled={busy} onClick={() => onWithdrawInterest?.(job)}>
                Withdraw Interest
              </Button>
            ) : job?.invited ? (
              <Button disabled={busy} onClick={() => onExpressInterest?.(job)}>
                Accept Invite
              </Button>
            ) : (
              <Button disabled={busy} onClick={() => onExpressInterest?.(job)}>
                Express Interest
              </Button>
            )}
          </>
        ) : null}

        {role === "regular" && mode === "invitations" ? (
          <Button disabled={busy} onClick={() => onExpressInterest?.(job)}>
            Accept Invite
          </Button>
        ) : null}

        {role === "regular" && mode === "interests" ? (
          <>
            <Button variant="outline" disabled={busy} onClick={() => onWithdrawInterest?.(job)}>
              Withdraw Interest
            </Button>
            {job?.interest_id && isMutual ? (
              <Button disabled={busy} onClick={() => onStartNegotiation?.(job)}>
                Start Negotiation
              </Button>
            ) : null}
          </>
        ) : null}

        {role === "business" && mode === "postings" ? (
          <>
            <Button variant="outline" disabled={busy} onClick={() => onEdit?.(job)}>
              Edit
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => onManageCandidates?.(job)}>
              Candidates
            </Button>
            <Button variant="destructive" disabled={busy} onClick={() => onDelete?.(job)}>
              Delete
            </Button>
          </>
        ) : null}
      </CardFooter>
    </Card>
  )
}
