import { useEffect, useMemo, useState } from "react"
import { apiClient } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { JobCard } from "@/components/jobs/job-card"
import { JobFormDialog } from "@/components/jobs/job-form-dialog"
import { JobCandidatesDialog } from "@/components/jobs/job-candidates-dialog"
import { StartNegotiationDialog } from "@/components/negotiation/start-negotiation-dialog"
import { useSocket } from "@/context/socket-context"
import { useAuth } from "@/context/auth-context"
import { canReportNoShow } from "@/components/jobs/job-utils"

const REGULAR_SORT_OPTIONS = [
  { value: "start_time", label: "Start time" },
  { value: "updatedAt", label: "Last updated" },
  { value: "salary_min", label: "Salary min" },
  { value: "salary_max", label: "Salary max" },
  { value: "distance", label: "Distance" },
  { value: "eta", label: "ETA" },
]

const LIMIT_OPTIONS = ["10", "20", "50"]
const JOB_STATUS_OPTIONS = ["open", "filled", "expired", "canceled", "completed"]
const INTEREST_FETCH_LIMIT = 100
const INTEREST_FETCH_MAX_PAGES = 20

function getConfig(role, mode) {
  if (role === "regular" && mode === "browse") {
    return {
      title: "Available Jobs",
      description:
        "Retrieve open job postings with API-backed filtering, sorting, pagination, and interest state.",
      load: async (query) => apiClient.getJobs({ query }),
      createAllowed: false,
      supportsFilters: true,
    }
  }

  if (role === "regular" && mode === "interests") {
    return {
      title: "My Interests",
      description: "Jobs where you have expressed interest.",
      load: async (query) => apiClient.getUsersMeInterests({ query }),
      createAllowed: false,
      supportsFilters: false,
    }
  }

  if (role === "regular" && mode === "invitations") {
    return {
      title: "My Invitations",
      description: "Job invitations sent to you by businesses.",
      load: async (query) => apiClient.getUsersMeInvitations({ query }),
      createAllowed: false,
      supportsFilters: false,
    }
  }

  if (role === "business" && mode === "postings") {
    return {
      title: "My Job Postings",
      description: "Create, update, manage, and review interest for your job postings.",
      load: async (query) => apiClient.getBusinessesMeJobs({ query }),
      createAllowed: true,
      supportsFilters: true,
    }
  }

  return {
    title: "Jobs",
    description: "",
    load: async () => ({ count: 0, results: [] }),
    createAllowed: false,
    supportsFilters: false,
  }
}

function getInitialFilters(role, mode) {
  if (role === "regular" && mode === "browse") {
    return {
      position_type_id: "all",
      business_id: "all",
      sort: "start_time",
      order: "asc",
      lat: "",
      lon: "",
    }
  }

  if (role === "business" && mode === "postings") {
    return {
      position_type_id: "all",
      salary_min: "",
      salary_max: "",
      start_time: "",
      end_time: "",
      status: ["open", "filled"],
    }
  }

  return {}
}

function toIsoOrUndefined(value) {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

function buildQuery(role, mode, filters, page, limit) {
  const query = { page: Number(page), limit: Number(limit) }

  if (role === "regular" && mode === "browse") {
    if (["distance", "eta"].includes(filters.sort) && (!filters.lat || !filters.lon)) {
      throw new Error("Sorting by distance or ETA requires both latitude and longitude.")
    }

    if ((filters.lat && !filters.lon) || (!filters.lat && filters.lon)) {
      throw new Error("Latitude and longitude must either both be present or both be empty.")
    }

    if (filters.position_type_id && filters.position_type_id !== "all") {
      query.position_type_id = filters.position_type_id
    }

    if (filters.business_id && filters.business_id !== "all") {
      query.business_id = filters.business_id
    }

    query.sort = filters.sort || "start_time"
    query.order = filters.order || "asc"

    if (filters.lat && filters.lon) {
      query.lat = filters.lat
      query.lon = filters.lon
    }
  }

  if (role === "business" && mode === "postings") {
    if (filters.position_type_id && filters.position_type_id !== "all") {
      query.position_type_id = filters.position_type_id
    }

    if (filters.salary_min !== "") query.salary_min = filters.salary_min
    if (filters.salary_max !== "") query.salary_max = filters.salary_max

    const startIso = toIsoOrUndefined(filters.start_time)
    const endIso = toIsoOrUndefined(filters.end_time)
    if (startIso) query.start_time = startIso
    if (endIso) query.end_time = endIso

    if (Array.isArray(filters.status) && filters.status.length > 0) {
      query.status = filters.status
    }
  }

  return query
}

async function fetchAllInterestPages(loader) {
  let page = 1
  let count = 0
  let results = []

  while (page <= INTEREST_FETCH_MAX_PAGES) {
    const data = await loader({ page, limit: INTEREST_FETCH_LIMIT })
    const nextResults = data?.results || []
    count = data?.count || 0
    results = [...results, ...nextResults]

    if (results.length >= count || nextResults.length === 0) {
      break
    }

    page += 1
  }

  return results
}

function enrichAvailableJobsWithInterestState(jobs, interests, invitations) {
  const interestByJobId = new Map(
    interests.map((interest) => [interest.job?.id, interest]).filter(([id]) => id != null)
  )
  const invitationJobIds = new Set(invitations.map((item) => item.id))

  return jobs.map((job) => {
    const interest = interestByJobId.get(job.id)

    return {
      ...job,
      interest_id: interest?.interest_id ?? null,
      mutual: Boolean(interest?.mutual),
      is_interested: Boolean(interest),
      invited: !interest && invitationJobIds.has(job.id),
    }
  })
}

function FiltersCard({
  role,
  mode,
  filters,
  pageSize,
  onPageSizeChange,
  onChange,
  onToggleStatus,
  onApply,
  onReset,
  positionTypes,
  businesses,
  isLoading,
}) {
  if (role === "regular" && mode === "browse") {
    const needsLocation = ["distance", "eta"].includes(filters.sort)

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Jobs Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Position Type</Label>
              <Select
                value={filters.position_type_id}
                onValueChange={(value) => onChange("position_type_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All position types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All position types</SelectItem>
                  {positionTypes.map((positionType) => (
                    <SelectItem key={positionType.id} value={String(positionType.id)}>
                      {positionType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Business</Label>
              <Select
                value={filters.business_id}
                onValueChange={(value) => onChange("business_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All businesses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All businesses</SelectItem>
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={String(business.id)}>
                      {business.business_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort</Label>
              <Select value={filters.sort} onValueChange={(value) => onChange("sort", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {REGULAR_SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Order</Label>
              <Select value={filters.order} onValueChange={(value) => onChange("order", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input
                type="number"
                step="any"
                value={filters.lat}
                onChange={(event) => onChange("lat", event.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input
                type="number"
                step="any"
                value={filters.lon}
                onChange={(event) => onChange("lon", event.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label>Results per page</Label>
              <Select value={String(pageSize)} onValueChange={onPageSizeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Page size" />
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
          </div>

          <p className="text-xs text-muted-foreground">
            {needsLocation
              ? "Sorting by distance or ETA requires both latitude and longitude. When lat/lon are provided, the API also returns distance and ETA in each result."
              : "Latitude and longitude are optional, but they are required for distance or ETA sorting and for distance/ETA fields in results."}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button disabled={isLoading} onClick={onApply}>
              Apply Filters
            </Button>
            <Button variant="outline" disabled={isLoading} onClick={onReset}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (role === "business" && mode === "postings") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter Postings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label>Position Type</Label>
              <Select
                value={filters.position_type_id}
                onValueChange={(value) => onChange("position_type_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All position types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All position types</SelectItem>
                  {positionTypes.map((positionType) => (
                    <SelectItem key={positionType.id} value={String(positionType.id)}>
                      {positionType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Minimum Salary ≥</Label>
              <Input
                type="number"
                step="0.01"
                value={filters.salary_min}
                onChange={(event) => onChange("salary_min", event.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label>Maximum Salary ≥</Label>
              <Input
                type="number"
                step="0.01"
                value={filters.salary_max}
                onChange={(event) => onChange("salary_max", event.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label>Starts On or After</Label>
              <Input
                type="datetime-local"
                value={filters.start_time}
                onChange={(event) => onChange("start_time", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Ends On or Before</Label>
              <Input
                type="datetime-local"
                value={filters.end_time}
                onChange={(event) => onChange("end_time", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Results per page</Label>
              <Select value={String(pageSize)} onValueChange={onPageSizeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Page size" />
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
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-3">
              {JOB_STATUS_OPTIONS.map((statusValue) => {
                const checked = filters.status.includes(statusValue)

                return (
                  <label
                    key={statusValue}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleStatus(statusValue)}
                    />
                    <span className="capitalize">{statusValue}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button disabled={isLoading} onClick={onApply}>
              Apply Filters
            </Button>
            <Button variant="outline" disabled={isLoading} onClick={onReset}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}

export function JobsPage({ role, mode, startCreateOpen = false }) {
  const { user } = useAuth()
  const { openNegotiation } = useSocket()
  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState("")
  const [positionTypes, setPositionTypes] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [filters, setFilters] = useState(getInitialFilters(role, mode))
  const [createOpen, setCreateOpen] = useState(startCreateOpen)
  const [editingJob, setEditingJob] = useState(null)
  const [candidateJob, setCandidateJob] = useState(null)
  const [isSavingJob, setIsSavingJob] = useState(false)
  const [pendingNegotiationJob, setPendingNegotiationJob] = useState(null)
  const [isStartingNegotiation, setIsStartingNegotiation] = useState(false)

  const config = useMemo(() => getConfig(role, mode), [role, mode])

  const load = async (targetPage = page, nextFilters = filters, nextLimit = limit) => {
    setIsLoading(true)
    setError("")

    try {
      const query = buildQuery(role, mode, nextFilters, targetPage, nextLimit)
      const data = await config.load(query)
      let nextItems = data?.results || []

      if (role === "regular" && mode === "browse" && nextItems.length > 0) {
        const [interests, invitations] = await Promise.all([
          fetchAllInterestPages((interestQuery) =>
            apiClient.getUsersMeInterests({ query: interestQuery })
          ),
          fetchAllInterestPages((invitationQuery) =>
            apiClient.getUsersMeInvitations({ query: invitationQuery })
          ),
        ])

        nextItems = enrichAvailableJobsWithInterestState(nextItems, interests, invitations)
      }

      setItems(nextItems)
      setCount(data?.count || 0)
      setPage(targetPage)
    } catch (loadError) {
      setError(loadError.message || "Unable to load jobs.")
    } finally {
      setIsLoading(false)
    }
  }

  const loadPositionTypes = async () => {
    if (!["regular", "business"].includes(role)) return

    try {
      const data = await apiClient.getPositionTypes({
        query: { page: 1, limit: 100, name: "asc" },
      })
      setPositionTypes(data?.results || [])
    } catch {
      // silent: other actions surface backend errors when necessary
    }
  }

  const loadBusinesses = async () => {
    if (!(role === "regular" && mode === "browse")) return

    try {
      const data = await apiClient.getBusinesses({
        query: { page: 1, limit: 100, sort: "business_name", order: "asc" },
      })
      setBusinesses(data?.results || [])
    } catch {
      // silent: job list itself will still function without this auxiliary filter list
    }
  }

  useEffect(() => {
    const nextFilters = getInitialFilters(role, mode)
    setFilters(nextFilters)
    setPage(1)
    setLimit(10)
    load(1, nextFilters, 10)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, mode])

  useEffect(() => {
    loadPositionTypes()
    loadBusinesses()
  }, [role, mode])

  useEffect(() => {
    const handleNegotiationUpdate = () => {
      load(page)
    }

    window.addEventListener("app:job-updated-from-negotiation", handleNegotiationUpdate)
    return () => {
      window.removeEventListener("app:job-updated-from-negotiation", handleNegotiationUpdate)
    }
  }, [page])


  const actOnJob = async (jobId, action) => {
    setBusyId(jobId)
    setError("")

    try {
      await action()
      await load(page)
    } catch (actionError) {
      setError(actionError.message || "Action failed.")
    } finally {
      setBusyId(null)
    }
  }

  const handleExpressInterest = (job) =>
    actOnJob(job.id, () =>
      apiClient.patchJobsJobIdInterested({
        pathParams: { jobId: job.id },
        body: { interested: true },
      })
    )

  const handleWithdrawInterest = (job) =>
    actOnJob(job.id, () =>
      apiClient.patchJobsJobIdInterested({
        pathParams: { jobId: job.id },
        body: { interested: false },
      })
    )

  const handleStartNegotiation = (job) => {
    const currentUserName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.name || "You"

    setPendingNegotiationJob({
      interestId: job.interest_id,
      jobId: job.id,
      positionName: job.position_type?.name || `Job #${job.id}`,
      helperText: "You are about to open the exclusive negotiation window for this match.",
      candidate: {
        id: user?.id,
        role: "regular",
        first_name: user?.first_name,
        last_name: user?.last_name,
        name: currentUserName,
        avatar: user?.avatar,
      },
      business: {
        id: job.business?.id,
        role: "business",
        business_name: job.business?.business_name,
        name: job.business?.business_name || "Business",
        avatar: job.business?.avatar,
      },
    })
  }

  const confirmStartNegotiation = async () => {
    if (!pendingNegotiationJob?.interestId || !pendingNegotiationJob?.jobId) return

    setIsStartingNegotiation(true)
    setBusyId(pendingNegotiationJob.jobId)
    setError("")

    try {
      await apiClient.postNegotiations({
        body: { interest_id: pendingNegotiationJob.interestId },
      })
      setPendingNegotiationJob(null)
      await load(page)
      openNegotiation()
    } catch (actionError) {
      setError(actionError.message || "Unable to start negotiation.")
    } finally {
      setBusyId(null)
      setIsStartingNegotiation(false)
    }
  }

  const handleDelete = (job) => {
    const ok = window.confirm(`Delete job #${job.id}?`)
    if (!ok) return
    return actOnJob(job.id, () =>
      apiClient.deleteBusinessesMeJobsJobId({
        pathParams: { jobId: job.id },
      })
    )
  }


  const handleReportNoShow = (job) => {
    if (!canReportNoShow(job)) {
      setError("No-show reporting is only available for filled jobs during the active work window.")
      return
    }

    const candidateName = `${job?.worker?.first_name || ""} ${job?.worker?.last_name || ""}`.trim() || "this candidate"
    const ok = window.confirm(
      `Report ${candidateName} as a no-show? This will cancel the job and suspend the candidate account.`
    )
    if (!ok) return

    return actOnJob(job.id, () =>
      apiClient.patchJobsJobIdNoShow({
        pathParams: { jobId: job.id },
        body: {},
      })
    )
  }


  const handleCreateJob = async (payload) => {
    setIsSavingJob(true)
    try {
      await apiClient.postBusinessesMeJobs({ body: payload })
      await load(1)
    } finally {
      setIsSavingJob(false)
    }
  }

  const handleUpdateJob = async (payload) => {
    if (!editingJob?.id) return
    setIsSavingJob(true)
    try {
      await apiClient.patchBusinessesMeJobsJobId({
        pathParams: { jobId: editingJob.id },
        body: payload,
      })
      setEditingJob(null)
      await load(page)
    } finally {
      setIsSavingJob(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const handleToggleStatus = (statusValue) => {
    setFilters((current) => {
      const nextStatuses = current.status.includes(statusValue)
        ? current.status.filter((item) => item !== statusValue)
        : [...current.status, statusValue]

      return { ...current, status: nextStatuses }
    })
  }

  const handleApplyFilters = () => load(1, filters, limit)

  const handleResetFilters = () => {
    const nextFilters = getInitialFilters(role, mode)
    setFilters(nextFilters)
    load(1, nextFilters, limit)
  }

  const handlePageSizeChange = (value) => {
    const nextLimit = Number(value)
    setLimit(nextLimit)
    load(1, filters, nextLimit)
  }

  const totalPages = Math.max(1, Math.ceil(count / limit))
  const showStandalonePageSize = !config.supportsFilters

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{config.title}</h1>
          <p className="mt-2 text-muted-foreground">{config.description}</p>
          <p className="mt-2 text-sm text-muted-foreground">Total results: {count}</p>
          {role === "business" && mode === "postings" ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Filled jobs can be reported as no-shows only during the scheduled work window.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {showStandalonePageSize ? (
            <div className="space-y-2">
              <Label>Results per page</Label>
              <Select value={String(limit)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Page size" />
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
          ) : null}
          {config.createAllowed ? <Button onClick={() => setCreateOpen(true)}>Post a Job</Button> : null}
        </div>
      </div>

      {config.supportsFilters ? (
        <FiltersCard
          role={role}
          mode={mode}
          filters={filters}
          pageSize={limit}
          onPageSizeChange={handlePageSizeChange}
          onChange={handleFilterChange}
          onToggleStatus={handleToggleStatus}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          positionTypes={positionTypes}
          businesses={businesses}
          isLoading={isLoading}
        />
      ) : null}

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">Loading...</CardContent>
        </Card>
      ) : null}

      {!isLoading && items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nothing to show</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No results were returned for this view.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const job = item.job
            ? { ...item.job, interest_id: item.interest_id, mutual: item.mutual }
            : item

          return (
            <JobCard
              key={`${mode}-${job.id}`}
              role={role}
              mode={mode === "postings" ? "postings" : mode}
              job={job}
              busy={busyId === job.id}
              onExpressInterest={handleExpressInterest}
              onWithdrawInterest={handleWithdrawInterest}
              onStartNegotiation={handleStartNegotiation}
              onEdit={(selectedJob) => setEditingJob(selectedJob)}
              onDelete={handleDelete}
              onManageCandidates={(selectedJob) => setCandidateJob(selectedJob)}
              onReportNoShow={handleReportNoShow}
            />
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page <= 1 || isLoading} onClick={() => load(page - 1)}>
            Previous
          </Button>
          <Button variant="outline" disabled={page >= totalPages || isLoading} onClick={() => load(page + 1)}>
            Next
          </Button>
        </div>
      </div>

      <JobFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        positionTypes={positionTypes}
        onSubmit={handleCreateJob}
        isSaving={isSavingJob}
      />

      <JobFormDialog
        open={Boolean(editingJob)}
        onOpenChange={(open) => {
          if (!open) setEditingJob(null)
        }}
        mode="edit"
        job={editingJob}
        positionTypes={positionTypes}
        onSubmit={handleUpdateJob}
        isSaving={isSavingJob}
      />

      <JobCandidatesDialog
        open={Boolean(candidateJob)}
        onOpenChange={(open) => {
          if (!open) setCandidateJob(null)
        }}
        job={candidateJob}
        onDataChanged={() => load(page)}
      />

      <StartNegotiationDialog
        open={Boolean(pendingNegotiationJob)}
        onOpenChange={(open) => {
          if (!open) setPendingNegotiationJob(null)
        }}
        target={pendingNegotiationJob}
        isSubmitting={isStartingNegotiation}
        onConfirm={confirmStartNegotiation}
      />
    </div>
  )
}
