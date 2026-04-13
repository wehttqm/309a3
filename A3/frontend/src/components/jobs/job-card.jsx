import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/user-avatar"
import { deriveUserAvatarStatus, formatAvatarStatusLabel } from "@/lib/user-status"
import {
  formatDateTime,
  formatSalaryRange,
  jobStatusVariant,
  canReportNoShow,
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

function CandidateStatusBadge({ status }) {
  const label = status || "history"
  const variant = label === "accepted" ? "default" : label === "mutual" ? "secondary" : "outline"
  return <Badge variant={variant}>{label}</Badge>
}

function CandidateHistory({ candidates }) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null

  const visible = candidates.slice(0, 4)
  const remaining = candidates.length - visible.length

  return (
    <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
      <div className="text-sm font-medium">Candidate History</div>
      <div className="space-y-2">
        {visible.map((candidate) => (
          <div key={`${candidate.id}-${candidate.createdAt || candidate.status}`} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <UserAvatar
                user={{ ...candidate, role: "regular" }}
                className="h-8 w-8"
                fallbackClassName="text-[10px]"
                showStatus={false}
              />
              <span className="truncate text-sm">
                {candidate.first_name} {candidate.last_name}
              </span>
            </div>
            <CandidateStatusBadge status={candidate.status} />
          </div>
        ))}
      </div>
      {remaining > 0 ? <p className="text-xs text-muted-foreground">+{remaining} more candidate(s)</p> : null}
    </div>
  )
}

function ConfirmedWorker({ worker }) {
  if (!worker) return null

  return (
    <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
      <div className="text-sm font-medium">Accepted Candidate</div>
      <div className="flex items-center gap-3">
        <UserAvatar
          user={{ ...worker, role: "regular" }}
          className="h-10 w-10"
          fallbackClassName="text-xs"
          showStatus={false}
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">
            {worker.first_name} {worker.last_name}
          </div>
          <p className="text-xs text-muted-foreground">This candidate accepted and filled the job.</p>
        </div>
      </div>
    </div>
  )
}


function BusinessSummary({ business }) {
  if (!business) return null

  const businessWithRole = { ...business, role: "business" }
  const status = deriveUserAvatarStatus(businessWithRole)
  const statusLabel = formatAvatarStatusLabel(status)

  return (
    <div className="mt-2 flex items-center gap-3">
      <UserAvatar
        user={businessWithRole}
        className="h-10 w-10"
        fallbackClassName="text-xs"
      />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{business.business_name || "Unknown business"}</div>
        <div className="text-xs text-muted-foreground">{statusLabel}</div>
      </div>
    </div>
  )
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
  onReportNoShow,
  extraActions = null,
}) {
  const title = job?.position_type?.name || `Job #${job?.id}`
  const businessName = job?.business?.business_name || "—"
  const isMutual = Boolean(job?.mutual)
  const isJobOpen = job?.status === "open"
  const showAvailableJobFields = role === "regular" && mode === "browse"
  const regularBrowseState = showAvailableJobFields ? getRegularBrowseState(job) : null
  const hideBusinessMeta = role === "business" && mode === "postings"
  const showBusinessSummary = role === "regular" && Boolean(job?.business)
  const canEditBusinessJob = role === "business" && mode === "postings" && isJobOpen
  const canDeleteBusinessJob =
    role === "business" && mode === "postings" && ["open", "expired"].includes(job?.status)
  const candidateButtonLabel = isJobOpen ? "Manage Candidates" : "View Candidate History"
  const showNoShowAction = role === "business" && mode === "postings" && canReportNoShow(job)

  return (
    <Card className="h-full">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {showBusinessSummary ? (
              <BusinessSummary business={job?.business} />
            ) : !hideBusinessMeta ? (
              <p className="mt-1 text-sm text-muted-foreground">{businessName}</p>
            ) : null}
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
        {!hideBusinessMeta && !showBusinessSummary ? <Detail label="Business" value={businessName} /> : null}
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

        {role === "business" && mode === "postings" ? <ConfirmedWorker worker={job?.worker} /> : null}
        {role === "business" && mode === "postings" ? <CandidateHistory candidates={job?.candidate_history} /> : null}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        {extraActions}
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
          isJobOpen ? (
            <Button disabled={busy} onClick={() => onExpressInterest?.(job)}>
              Accept Invite
            </Button>
          ) : null
        ) : null}

        {role === "regular" && mode === "interests" ? (
          isJobOpen ? (
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
          ) : null
        ) : null}

        {role === "business" && mode === "postings" ? (
          <>
            {canEditBusinessJob ? (
              <Button variant="outline" disabled={busy} onClick={() => onEdit?.(job)}>
                Edit
              </Button>
            ) : null}
            <Button variant="outline" disabled={busy} onClick={() => onManageCandidates?.(job)}>
              {candidateButtonLabel}
            </Button>
            {showNoShowAction ? (
              <Button variant="destructive" disabled={busy} onClick={() => onReportNoShow?.(job)}>
                Report No-show
              </Button>
            ) : null}
            {canDeleteBusinessJob ? (
              <Button variant="destructive" disabled={busy} onClick={() => onDelete?.(job)}>
                Delete
              </Button>
            ) : null}
          </>
        ) : null}
      </CardFooter>
    </Card>
  )
}
