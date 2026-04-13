import { useEffect, useMemo, useState } from "react"

import { adminApi, resolveApiUrl } from "@/lib/api/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading-state"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AdminHelperCard } from "@/components/admin/admin-helper-card"

function Pagination({ page, limit, count, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(count / limit))

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          Previous
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Next
        </Button>
      </div>
    </div>
  )
}

function formatDateTime(value) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

export const AdminQualificationsPage = () => {
  const [filters, setFilters] = useState({
    keyword: "",
    page: 1,
    limit: 10,
  })
  const [draft, setDraft] = useState(filters)
  const [data, setData] = useState({ count: 0, results: [] })
  const [detailsById, setDetailsById] = useState({})
  const [openId, setOpenId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [pendingId, setPendingId] = useState(null)

  const query = useMemo(
    () => ({
      keyword: filters.keyword || undefined,
      page: filters.page,
      limit: filters.limit,
    }),
    [filters],
  )

  const loadQualifications = async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await adminApi.getQualifications(query)
      setData(response)
    } catch (err) {
      setError(err.message || "Failed to load qualifications.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadQualifications()
  }, [query])

  const applyFilters = (event) => {
    event.preventDefault()
    setFilters({ ...draft, page: 1, limit: Number(draft.limit) || 10 })
  }

  const resetFilters = () => {
    const next = {
      keyword: "",
      page: 1,
      limit: 10,
    }
    setDraft(next)
    setFilters(next)
  }

  const toggleDetails = async (qualificationId) => {
    if (openId === qualificationId) {
      setOpenId(null)
      return
    }

    setOpenId(qualificationId)

    if (detailsById[qualificationId]) return

    try {
      const detail = await adminApi.getQualification(qualificationId)
      setDetailsById((current) => ({ ...current, [qualificationId]: detail }))
    } catch (err) {
      setError(err.message || "Failed to load qualification details.")
    }
  }

  const updateStatus = async (qualificationId, status) => {
    setPendingId(qualificationId)
    setError("")
    setSuccess("")
    try {
      await adminApi.updateQualification(qualificationId, { status })
      setDetailsById((current) => {
        const existing = current[qualificationId]
        if (!existing) return current
        return {
          ...current,
          [qualificationId]: { ...existing, status },
        }
      })
      setSuccess(`Qualification ${status}.`)
      await loadQualifications()
    } catch (err) {
      setError(err.message || "Failed to update qualification.")
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="page-enter mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Qualification Review</h1>
          <p className="mt-2 text-muted-foreground">Review submitted and revised qualifications that require admin attention.</p>
        </div>
        <Badge variant="secondary">Admin</Badge>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Use filters to focus on the workers and submissions that need a review decision right now.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-4" onSubmit={applyFilters}>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Keyword</label>
                <Input value={draft.keyword} onChange={(event) => setDraft((current) => ({ ...current, keyword: event.target.value }))} placeholder="Search first name, last name, email, or phone number" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Results per page</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={draft.limit} onChange={(event) => setDraft((current) => ({ ...current, limit: Number(event.target.value) }))}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit">Apply</Button>
                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <AdminHelperCard
          title="Review guidance"
          description="Use this queue to decide whether a worker can legitimately work a given position type."
          bullets={[
            'Only qualifications that still need admin attention should show up here.',
            'Approve when the attached documents and note clearly support the requested position type.',
            'Reject when information is missing, outdated, or does not match the qualification being requested.',
          ]}
        />
      </div>

      {error ? <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}
      {success ? <div className="mb-4 rounded-md border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>Qualifications</CardTitle>
          <CardDescription>{data.count} matching result{data.count === 1 ? "" : "s"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <LoadingState title="Loading qualifications" description="Fetching qualification requests that need review." compact />
          ) : data.results.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No qualifications need admin attention right now. This usually means the review queue is clear.</div>
          ) : (
            <>
              <div className="space-y-4">
                {data.results.map((qualification) => {
                  const isPending = pendingId === qualification.id
                  const detail = detailsById[qualification.id]
                  const isOpen = openId === qualification.id

                  return (
                    <Card key={qualification.id} className="border-dashed">
                      <CardContent className="space-y-4 p-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {qualification.user.first_name} {qualification.user.last_name}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">{qualification.position_type.name}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={qualification.status === "revised" ? "secondary" : "default"}>{qualification.status}</Badge>
                            <Badge variant="outline">Updated {formatDateTime(qualification.updatedAt)}</Badge>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" onClick={() => toggleDetails(qualification.id)}>
                            {isOpen ? "Hide Details" : "View Details"}
                          </Button>
                          <Button type="button" onClick={() => updateStatus(qualification.id, "approved")} disabled={isPending}>
                            {isPending ? "Saving..." : "Approve"}
                          </Button>
                          <Button type="button" variant="destructive" onClick={() => updateStatus(qualification.id, "rejected")} disabled={isPending}>
                            {isPending ? "Saving..." : "Reject"}
                          </Button>
                        </div>

                        {isOpen ? (
                          <div className="grid gap-4 rounded-md border bg-muted/20 p-4 md:grid-cols-2">
                            <div className="space-y-2 text-sm">
                              <div><span className="font-medium">Email:</span> {detail?.user?.email || "—"}</div>
                              <div><span className="font-medium">Phone:</span> {detail?.user?.phone_number || "—"}</div>
                              <div><span className="font-medium">Address:</span> {detail?.user?.postal_address || "—"}</div>
                              <div><span className="font-medium">Birthday:</span> {detail?.user?.birthday || "—"}</div>
                              <div><span className="font-medium">Activated:</span> {detail?.user?.activated ? "Yes" : "No"}</div>
                              <div><span className="font-medium">Suspended:</span> {detail?.user?.suspended ? "Yes" : "No"}</div>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div><span className="font-medium">Document:</span> {detail?.document ? <a className="text-primary underline" href={resolveApiUrl(detail.document)} target="_blank" rel="noreferrer">Open document</a> : "—"}</div>
                              <div><span className="font-medium">Note:</span></div>
                              <div className="rounded-md border bg-background p-3 text-sm text-muted-foreground">{detail?.note || "No note provided."}</div>
                            </div>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              <Pagination page={filters.page} limit={filters.limit} count={data.count} onPageChange={(nextPage) => setFilters((current) => ({ ...current, page: nextPage }))} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
