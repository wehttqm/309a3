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
      <span className="text-muted-foreground">
        Page {page} of {totalPages}
      </span>
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

export const AdminUsersPage = () => {
  const [filters, setFilters] = useState({
    keyword: "",
    activated: "all",
    suspended: "all",
    page: 1,
    limit: 10,
  })
  const [draft, setDraft] = useState(filters)
  const [data, setData] = useState({ count: 0, results: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [pendingUserId, setPendingUserId] = useState(null)

  const query = useMemo(
    () => ({
      keyword: filters.keyword || undefined,
      activated: booleanFilterValue(filters.activated),
      suspended: booleanFilterValue(filters.suspended),
      page: filters.page,
      limit: filters.limit,
    }),
    [filters],
  )

  const loadUsers = async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await adminApi.getRegularUsers(query)
      setData(response)
    } catch (err) {
      setError(err.message || "Failed to load users.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [query])

  const applyFilters = (event) => {
    event.preventDefault()
    setFilters({ ...draft, page: 1, limit: Number(draft.limit) || 10 })
  }

  const resetFilters = () => {
    const next = { keyword: "", activated: "all", suspended: "all", page: 1, limit: 10 }
    setDraft(next)
    setFilters(next)
  }

  const toggleSuspended = async (user) => {
    setPendingUserId(user.id)
    setError("")
    try {
      await adminApi.setUserSuspended(user.id, !user.suspended)
      await loadUsers()
    } catch (err) {
      setError(err.message || "Failed to update user suspension.")
    } finally {
      setPendingUserId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
          <p className="mt-2 text-muted-foreground">Find worker accounts quickly, review activation state, and suspend or restore access when intervention is needed.</p>
        </div>
        <Badge variant="secondary">Admin</Badge>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Use these filters to narrow the worker list, focus on edge cases, and review account access quickly.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-4" onSubmit={applyFilters}>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Keyword</label>
                <Input value={draft.keyword} onChange={(event) => setDraft((current) => ({ ...current, keyword: event.target.value }))} placeholder="Name, email, phone, or address" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Activated</label>
                <select
                  className="flex h-10 w-full rounded-3xl border border-input bg-background px-3 py-2 text-sm"
                  value={draft.activated}
                  onChange={(event) => setDraft((current) => ({ ...current, activated: event.target.value }))}
                >
                  <option value="all">All</option>
                  <option value="true">Activated</option>
                  <option value="false">Not activated</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Suspended</label>
                <select
                  className="flex h-10 w-full rounded-3xl border border-input bg-background px-3 py-2 text-sm"
                  value={draft.suspended}
                  onChange={(event) => setDraft((current) => ({ ...current, suspended: event.target.value }))}
                >
                  <option value="all">All</option>
                  <option value="true">Suspended</option>
                  <option value="false">Not suspended</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Results per page</label>
                <select
                  className="flex h-10 w-full rounded-3xl border border-input bg-background px-3 py-2 text-sm"
                  value={draft.limit}
                  onChange={(event) => setDraft((current) => ({ ...current, limit: Number(event.target.value) }))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-end gap-2 md:col-span-3">
                <Button type="submit">Apply</Button>
                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <AdminHelperCard
          title="What admins usually do here"
          description="This page is for intervention. Use it to find blocked accounts, review no-show consequences, and restore access when appropriate."
          bullets={[
            "Suspended workers can still log in, but they should not be able to make themselves available for matching.",
            "Filter by Suspended to review workers who may need follow-up or manual reinstatement.",
            "Search by contact details when support requests come in and you need to find a specific account quickly.",
          ]}
        />
      </div>

      {error ? <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>Regular Users</CardTitle>
          <CardDescription>{data.count} matching result{data.count === 1 ? "" : "s"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading users...</div>
          ) : data.results.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No users matched the current filters. Clear one or more filters if you need a broader list.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3 font-medium">User</th>
                      <th className="px-3 py-3 font-medium">Email</th>
                      <th className="px-3 py-3 font-medium">Phone</th>
                      <th className="px-3 py-3 font-medium">Address</th>
                      <th className="px-3 py-3 font-medium">Activated</th>
                      <th className="px-3 py-3 font-medium">Suspended</th>
                      <th className="px-3 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((user) => (
                      <tr key={user.id} className="border-b last:border-b-0">
                        <td className="px-3 py-4 font-medium">{user.first_name} {user.last_name}</td>
                        <td className="px-3 py-4">{user.email}</td>
                        <td className="px-3 py-4">{user.phone_number || "—"}</td>
                        <td className="px-3 py-4">{user.postal_address || "—"}</td>
                        <td className="px-3 py-4">
                          <Badge variant={user.activated ? "default" : "outline"}>{user.activated ? "Activated" : "Inactive"}</Badge>
                        </td>
                        <td className="px-3 py-4">
                          <Badge variant={user.suspended ? "destructive" : "secondary"}>{user.suspended ? "Suspended" : "Active"}</Badge>
                        </td>
                        <td className="px-3 py-4">
                          <Button
                            type="button"
                            size="sm"
                            variant={user.suspended ? "default" : "outline"}
                            onClick={() => toggleSuspended(user)}
                            disabled={pendingUserId === user.id}
                          >
                            {pendingUserId === user.id ? "Saving..." : user.suspended ? "Unsuspend" : "Suspend"}
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
