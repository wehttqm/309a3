import { useEffect, useMemo, useState } from "react"

import { adminApi } from "@/lib/api/client"
import { AdminHelperCard } from "@/components/admin/admin-helper-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

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

function booleanFilterValue(value) {
  if (value === "all") return undefined
  return value
}

export const AdminBusinessesPage = () => {
  const [filters, setFilters] = useState({
    keyword: "",
    activated: "all",
    verified: "all",
    sort: "",
    order: "asc",
    page: 1,
    limit: 10,
  })
  const [draft, setDraft] = useState(filters)
  const [data, setData] = useState({ count: 0, results: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [pendingBusinessId, setPendingBusinessId] = useState(null)

  const query = useMemo(
    () => ({
      keyword: filters.keyword || undefined,
      activated: booleanFilterValue(filters.activated),
      verified: booleanFilterValue(filters.verified),
      sort: filters.sort || undefined,
      order: filters.sort ? filters.order : undefined,
      page: filters.page,
      limit: filters.limit,
    }),
    [filters],
  )

  const loadBusinesses = async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await adminApi.getBusinesses(query)
      setData(response)
    } catch (err) {
      setError(err.message || "Failed to load businesses.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBusinesses()
  }, [query])

  const applyFilters = (event) => {
    event.preventDefault()
    setFilters({ ...draft, page: 1, limit: Number(draft.limit) || 10 })
  }

  const resetFilters = () => {
    const next = {
      keyword: "",
      activated: "all",
      verified: "all",
      sort: "",
      order: "asc",
      page: 1,
      limit: 10,
    }
    setDraft(next)
    setFilters(next)
  }

  const toggleVerified = async (business) => {
    setPendingBusinessId(business.id)
    setError("")
    try {
      await adminApi.setBusinessVerified(business.id, !business.verified)
      await loadBusinesses()
    } catch (err) {
      setError(err.message || "Failed to update business verification.")
    } finally {
      setPendingBusinessId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Businesses</h1>
          <p className="mt-2 text-muted-foreground">Review clinic profiles, verify legitimate businesses, and keep the hiring side of the platform clean.</p>
        </div>
        <Badge variant="secondary">Admin</Badge>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Use filters to focus on clinics that need review, confirmation, or follow-up before they can post jobs.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-4" onSubmit={applyFilters}>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Keyword</label>
                <Input value={draft.keyword} onChange={(event) => setDraft((current) => ({ ...current, keyword: event.target.value }))} placeholder="Business, owner, email, phone, or address" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Activated</label>
                <select className="flex h-10 w-full rounded-3xl border border-input bg-background px-3 py-2 text-sm" value={draft.activated} onChange={(event) => setDraft((current) => ({ ...current, activated: event.target.value }))}>
                  <option value="all">All</option>
                  <option value="true">Activated</option>
                  <option value="false">Not activated</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Verified</label>
                <select className="flex h-10 w-full rounded-3xl border border-input bg-background px-3 py-2 text-sm" value={draft.verified} onChange={(event) => setDraft((current) => ({ ...current, verified: event.target.value }))}>
                  <option value="all">All</option>
                  <option value="true">Verified</option>
                  <option value="false">Not verified</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort by</label>
                <select className="flex h-10 w-full rounded-3xl border border-input bg-background px-3 py-2 text-sm" value={draft.sort} onChange={(event) => setDraft((current) => ({ ...current, sort: event.target.value }))}>
                  <option value="">Default</option>
                  <option value="business_name">Business name</option>
                  <option value="email">Email</option>
                  <option value="owner_name">Owner name</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Order</label>
                <select className="flex h-10 w-full rounded-3xl border border-input bg-background px-3 py-2 text-sm" value={draft.order} onChange={(event) => setDraft((current) => ({ ...current, order: event.target.value }))}>
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Results per page</label>
                <select className="flex h-10 w-full rounded-3xl border border-input bg-background px-3 py-2 text-sm" value={draft.limit} onChange={(event) => setDraft((current) => ({ ...current, limit: Number(event.target.value) }))}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-end gap-2 md:col-span-2">
                <Button type="submit">Apply</Button>
                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <AdminHelperCard
          title="How to use this page"
          description="This queue helps you approve legitimate businesses quickly and keep low-quality profiles from posting jobs."
          bullets={[
            "Filter by Not verified to work through the approval queue first.",
            "A business generally needs both activation and verification before it can fully participate in hiring workflows.",
            "Use owner, address, and phone details to sanity-check whether a clinic profile looks complete and trustworthy.",
          ]}
        />
      </div>

      {error ? <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>Businesses</CardTitle>
          <CardDescription>{data.count} matching result{data.count === 1 ? "" : "s"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading businesses...</div>
          ) : data.results.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No businesses matched the current filters. Try clearing one filter or switch Verified to Not verified to review pending approvals.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="border-b text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3 font-medium">Business</th>
                      <th className="px-3 py-3 font-medium">Owner</th>
                      <th className="px-3 py-3 font-medium">Email</th>
                      <th className="px-3 py-3 font-medium">Phone</th>
                      <th className="px-3 py-3 font-medium">Address</th>
                      <th className="px-3 py-3 font-medium">Activated</th>
                      <th className="px-3 py-3 font-medium">Verified</th>
                      <th className="px-3 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((business) => (
                      <tr key={business.id} className="border-b last:border-b-0">
                        <td className="px-3 py-4 font-medium">{business.business_name}</td>
                        <td className="px-3 py-4">{business.owner_name || "—"}</td>
                        <td className="px-3 py-4">{business.email}</td>
                        <td className="px-3 py-4">{business.phone_number || "—"}</td>
                        <td className="px-3 py-4">{business.postal_address || "—"}</td>
                        <td className="px-3 py-4">
                          <Badge variant={business.activated ? "default" : "outline"}>{business.activated ? "Activated" : "Inactive"}</Badge>
                        </td>
                        <td className="px-3 py-4">
                          <Badge variant={business.verified ? "default" : "secondary"}>{business.verified ? "Verified" : "Pending"}</Badge>
                        </td>
                        <td className="px-3 py-4">
                          <Button
                            type="button"
                            size="sm"
                            variant={business.verified ? "outline" : "default"}
                            onClick={() => toggleVerified(business)}
                            disabled={pendingBusinessId === business.id}
                          >
                            {pendingBusinessId === business.id ? "Saving..." : business.verified ? "Unverify" : "Verify"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={filters.page}
                limit={filters.limit}
                count={data.count}
                onPageChange={(nextPage) => setFilters((current) => ({ ...current, page: nextPage }))}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
