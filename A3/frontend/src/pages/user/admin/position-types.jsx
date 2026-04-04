import { useEffect, useMemo, useState } from "react"

import { adminApi } from "@/lib/api/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

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

function emptyCreateForm() {
  return {
    name: "",
    description: "",
    hidden: "false",
  }
}

export const AdminPositionTypesPage = () => {
  const [filters, setFilters] = useState({
    keyword: "",
    hidden: "all",
    name: "asc",
    num_qualified: "asc",
    page: 1,
    limit: 10,
  })
  const [draft, setDraft] = useState(filters)
  const [data, setData] = useState({ count: 0, results: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [createForm, setCreateForm] = useState(emptyCreateForm())
  const [isCreating, setIsCreating] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: "", description: "", hidden: "false" })
  const [pendingId, setPendingId] = useState(null)

  const query = useMemo(() => ({
    keyword: filters.keyword || undefined,
    hidden: filters.hidden === "all" ? undefined : filters.hidden,
    name: filters.name || undefined,
    num_qualified: filters.num_qualified || undefined,
    page: filters.page,
    limit: filters.limit,
  }), [filters])

  const loadPositionTypes = async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await adminApi.getPositionTypes(query)
      setData(response)
    } catch (err) {
      setError(err.message || "Failed to load position types.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPositionTypes()
  }, [query])

  const applyFilters = (event) => {
    event.preventDefault()
    setFilters({ ...draft, page: 1, limit: Number(draft.limit) || 10 })
  }

  const resetFilters = () => {
    const next = { keyword: "", hidden: "all", name: "asc", num_qualified: "asc", page: 1, limit: 10 }
    setDraft(next)
    setFilters(next)
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    setIsCreating(true)
    setError("")
    setSuccess("")
    try {
      await adminApi.createPositionType({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        hidden: createForm.hidden === "true",
      })
      setCreateForm(emptyCreateForm())
      setSuccess("Position type created.")
      await loadPositionTypes()
    } catch (err) {
      setError(err.message || "Failed to create position type.")
    } finally {
      setIsCreating(false)
    }
  }

  const startEditing = (positionType) => {
    setEditingId(positionType.id)
    setEditForm({
      name: positionType.name || "",
      description: positionType.description || "",
      hidden: String(Boolean(positionType.hidden)),
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditForm({ name: "", description: "", hidden: "false" })
  }

  const saveEdit = async (positionTypeId) => {
    setPendingId(positionTypeId)
    setError("")
    setSuccess("")
    try {
      await adminApi.updatePositionType(positionTypeId, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        hidden: editForm.hidden === "true",
      })
      setSuccess("Position type updated.")
      cancelEditing()
      await loadPositionTypes()
    } catch (err) {
      setError(err.message || "Failed to update position type.")
    } finally {
      setPendingId(null)
    }
  }

  const handleDelete = async (positionTypeId) => {
    const confirmed = window.confirm("Delete this position type?")
    if (!confirmed) return

    setPendingId(positionTypeId)
    setError("")
    setSuccess("")
    try {
      await adminApi.deletePositionType(positionTypeId)
      setSuccess("Position type deleted.")
      if (editingId === positionTypeId) cancelEditing()
      await loadPositionTypes()
    } catch (err) {
      setError(err.message || "Failed to delete position type.")
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Position Types</h1>
          <p className="mt-2 text-muted-foreground">Search, filter, sort, create, edit, and delete position types.</p>
        </div>
        <Badge variant="secondary">Admin</Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Matches the API for <code>GET /position-types</code>.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={applyFilters}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Keyword</label>
                  <Input value={draft.keyword} onChange={(event) => setDraft((current) => ({ ...current, keyword: event.target.value }))} placeholder="Name or description" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hidden</label>
                  <select className="flex h-10 w-full rounded-3xl border border-input bg-background px-3 py-2 text-sm" value={draft.hidden} onChange={(event) => setDraft((current) => ({ ...current, hidden: event.target.value }))}>
                    <option value="all">All</option>
                    <option value="true">Hidden</option>
                    <option value="false">Visible</option>
                  </select>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort by Name</label>
                    <select className="flex h-10 w-full rounded-3xl border border-input bg-background px-3 py-2 text-sm" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}>
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort by Qualified Count</label>
                    <select className="flex h-10 w-full rounded-3xl border border-input bg-background px-3 py-2 text-sm" value={draft.num_qualified} onChange={(event) => setDraft((current) => ({ ...current, num_qualified: event.target.value }))}>
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Results per page</label>
                  <select className="flex h-10 w-full rounded-3xl border border-input bg-background px-3 py-2 text-sm" value={draft.limit} onChange={(event) => setDraft((current) => ({ ...current, limit: Number(event.target.value) }))}>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Apply</Button>
                  <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create Position Type</CardTitle>
              <CardDescription>Uses <code>POST /position-types</code>.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreate}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input value={createForm.name} onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))} placeholder="Dental Assistant (Level 1)" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea rows={4} value={createForm.description} onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe the qualification or role" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visibility</label>
                  <select className="flex h-10 w-full rounded-3xl border border-input bg-background px-3 py-2 text-sm" value={createForm.hidden} onChange={(event) => setCreateForm((current) => ({ ...current, hidden: event.target.value }))}>
                    <option value="false">Visible</option>
                    <option value="true">Hidden</option>
                  </select>
                </div>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Position Type"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {error ? <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}
          {success ? <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

          <Card>
            <CardHeader>
              <CardTitle>Position Types</CardTitle>
              <CardDescription>{data.count} matching result{data.count === 1 ? "" : "s"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading position types...</div>
              ) : data.results.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No position types matched the current filters.</div>
              ) : (
                <>
                  <div className="space-y-4">
                    {data.results.map((positionType) => {
                      const isEditing = editingId === positionType.id
                      return (
                        <div key={positionType.id} className="rounded-2xl border p-4">
                          {isEditing ? (
                            <div className="space-y-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Name</label>
                                  <Input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Visibility</label>
                                  <select className="flex h-10 w-full rounded-3xl border border-input bg-background px-3 py-2 text-sm" value={editForm.hidden} onChange={(event) => setEditForm((current) => ({ ...current, hidden: event.target.value }))}>
                                    <option value="false">Visible</option>
                                    <option value="true">Hidden</option>
                                  </select>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Textarea rows={4} value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button type="button" onClick={() => saveEdit(positionType.id)} disabled={pendingId === positionType.id}>
                                  {pendingId === positionType.id ? "Saving..." : "Save"}
                                </Button>
                                <Button type="button" variant="outline" onClick={cancelEditing}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <h3 className="text-lg font-semibold">{positionType.name}</h3>
                                  <p className="mt-1 text-sm text-muted-foreground">{positionType.description}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant={positionType.hidden ? "secondary" : "default"}>
                                    {positionType.hidden ? "Hidden" : "Visible"}
                                  </Badge>
                                  <Badge variant="outline">Qualified: {positionType.num_qualified ?? 0}</Badge>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button type="button" size="sm" variant="outline" onClick={() => startEditing(positionType)}>Edit</Button>
                                <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(positionType.id)} disabled={pendingId === positionType.id}>
                                  {pendingId === positionType.id ? "Deleting..." : "Delete"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
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
      </div>
    </div>
  )
}
