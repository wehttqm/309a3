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

function HiddenBadge({ hidden }) {
  return <Badge variant={hidden ? "secondary" : "outline"}>{hidden ? "Hidden" : "Visible"}</Badge>
}

const emptyCreateForm = {
  name: "",
  description: "",
  hidden: false,
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
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingForm, setEditingForm] = useState({ name: "", description: "", hidden: false })
  const [pendingId, setPendingId] = useState(null)

  const query = useMemo(
    () => ({
      keyword: filters.keyword || undefined,
      hidden: filters.hidden === "all" ? undefined : filters.hidden,
      name: filters.name || undefined,
      num_qualified: filters.num_qualified || undefined,
      page: filters.page,
      limit: filters.limit,
    }),
    [filters],
  )

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
    const next = {
      keyword: "",
      hidden: "all",
      name: "asc",
      num_qualified: "asc",
      page: 1,
      limit: 10,
    }
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
        name: createForm.name,
        description: createForm.description,
        hidden: Boolean(createForm.hidden),
      })
      setCreateForm(emptyCreateForm)
      setSuccess("Position type created.")
      await loadPositionTypes()
    } catch (err) {
      setError(err.message || "Failed to create position type.")
    } finally {
      setIsCreating(false)
    }
  }

  const startEdit = (positionType) => {
    setEditingId(positionType.id)
    setEditingForm({
      name: positionType.name || "",
      description: positionType.description || "",
      hidden: Boolean(positionType.hidden),
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingForm({ name: "", description: "", hidden: false })
  }

  const saveEdit = async (positionTypeId) => {
    setPendingId(positionTypeId)
    setError("")
    setSuccess("")
    try {
      await adminApi.updatePositionType(positionTypeId, {
        name: editingForm.name,
        description: editingForm.description,
        hidden: Boolean(editingForm.hidden),
      })
      setSuccess("Position type updated.")
      cancelEdit()
      await loadPositionTypes()
    } catch (err) {
      setError(err.message || "Failed to update position type.")
    } finally {
      setPendingId(null)
    }
  }

  const deletePositionType = async (positionType) => {
    const confirmed = window.confirm(`Delete \"${positionType.name}\"?`)
    if (!confirmed) return

    setPendingId(positionType.id)
    setError("")
    setSuccess("")
    try {
      await adminApi.deletePositionType(positionType.id)
      setSuccess("Position type deleted.")
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
          <p className="mt-2 text-muted-foreground">Create, search, filter, sort, edit, and delete position types.</p>
        </div>
        <Badge variant="secondary">Admin</Badge>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create Position Type</CardTitle>
          <CardDescription>Uses <code>POST /position-types</code>.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={createForm.name} onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))} placeholder="Position type name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Visibility</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={String(createForm.hidden)} onChange={(event) => setCreateForm((current) => ({ ...current, hidden: event.target.value === "true" }))}>
                <option value="false">Visible</option>
                <option value="true">Hidden</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={createForm.description} onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe this position type" rows={4} />
            </div>
            <div>
              <Button type="submit" disabled={isCreating}>{isCreating ? "Creating..." : "Create"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Matches the API for <code>GET /position-types</code> as an admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4" onSubmit={applyFilters}>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Keyword</label>
              <Input value={draft.keyword} onChange={(event) => setDraft((current) => ({ ...current, keyword: event.target.value }))} placeholder="Search name or description" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hidden</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={draft.hidden} onChange={(event) => setDraft((current) => ({ ...current, hidden: event.target.value }))}>
                <option value="all">All</option>
                <option value="true">Hidden</option>
                <option value="false">Visible</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name Order</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Qualified Count Order</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={draft.num_qualified} onChange={(event) => setDraft((current) => ({ ...current, num_qualified: event.target.value }))}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Results per page</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={draft.limit} onChange={(event) => setDraft((current) => ({ ...current, limit: Number(event.target.value) }))}>
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

      {error ? <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}
      {success ? <div className="mb-4 rounded-md border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

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
                  const isPending = pendingId === positionType.id

                  return (
                    <Card key={positionType.id} className="border-dashed">
                      <CardContent className="space-y-4 p-5">
                        {isEditing ? (
                          <>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input value={editingForm.name} onChange={(event) => setEditingForm((current) => ({ ...current, name: event.target.value }))} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Visibility</label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={String(editingForm.hidden)} onChange={(event) => setEditingForm((current) => ({ ...current, hidden: event.target.value === "true" }))}>
                                  <option value="false">Visible</option>
                                  <option value="true">Hidden</option>
                                </select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Description</label>
                              <Textarea rows={4} value={editingForm.description} onChange={(event) => setEditingForm((current) => ({ ...current, description: event.target.value }))} />
                            </div>
                            <div className="flex gap-2">
                              <Button type="button" onClick={() => saveEdit(positionType.id)} disabled={isPending}>{isPending ? "Saving..." : "Save"}</Button>
                              <Button type="button" variant="outline" onClick={cancelEdit} disabled={isPending}>Cancel</Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <h3 className="text-lg font-semibold">{positionType.name}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">{positionType.description}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <HiddenBadge hidden={positionType.hidden} />
                                <Badge variant="outline">Qualified: {positionType.num_qualified}</Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button type="button" variant="outline" onClick={() => startEdit(positionType)}>
                                Edit
                              </Button>
                              <Button type="button" variant="destructive" onClick={() => deletePositionType(positionType)} disabled={isPending}>
                                {isPending ? "Deleting..." : "Delete"}
                              </Button>
                            </div>
                          </>
                        )}
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
