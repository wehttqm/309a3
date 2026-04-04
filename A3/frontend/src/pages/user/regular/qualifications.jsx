import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { positionTypeApi, qualificationApi, resolveApiUrl } from "@/lib/api/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

function badgeVariant(status) {
  switch (status) {
    case "approved":
      return "default"
    case "rejected":
      return "destructive"
    case "submitted":
    case "revised":
      return "secondary"
    default:
      return "outline"
  }
}

function formatDateTime(value) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString()
}

function countByStatus(items, status) {
  return items.filter((item) => item.status === status).length
}

export const RegularQualificationsPage = () => {
  const navigate = useNavigate()
  const [positionTypes, setPositionTypes] = useState([])
  const [qualifications, setQualifications] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, count: 0 })
  const [form, setForm] = useState({
    position_type_id: "",
    note: "",
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)
  const [isLoadingQualifications, setIsLoadingQualifications] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [createdQualification, setCreatedQualification] = useState(null)

  const loadPositionTypes = async () => {
    setIsLoadingTypes(true)
    try {
      const response = await positionTypeApi.list({ page: 1, limit: 100, name: "asc" })
      setPositionTypes(response?.results || [])
    } catch (err) {
      setError(err.message || "Failed to load position types.")
    } finally {
      setIsLoadingTypes(false)
    }
  }

  const loadQualifications = async (page = pagination.page, limit = pagination.limit) => {
    setIsLoadingQualifications(true)
    try {
      const response = await qualificationApi.listMine({ page, limit })
      setQualifications(response?.results || [])
      setPagination({ page, limit, count: response?.count || 0 })
    } catch (err) {
      setError(err.message || "Failed to load your qualifications.")
    } finally {
      setIsLoadingQualifications(false)
    }
  }

  useEffect(() => {
    setError("")
    loadPositionTypes()
    loadQualifications(1, pagination.limit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const qualificationByPositionTypeId = useMemo(() => {
    const map = new Map()
    qualifications.forEach((qualification) => {
      if (qualification.position_type?.id != null) {
        map.set(Number(qualification.position_type.id), qualification)
      }
    })
    return map
  }, [qualifications])

  const availablePositionTypes = useMemo(
    () => positionTypes.filter((positionType) => !qualificationByPositionTypeId.has(Number(positionType.id))),
    [positionTypes, qualificationByPositionTypeId],
  )

  const duplicateQualification = useMemo(() => {
    if (!form.position_type_id) return null
    return qualificationByPositionTypeId.get(Number(form.position_type_id)) || null
  }, [form.position_type_id, qualificationByPositionTypeId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.position_type_id) {
      setError("Please select a position type.")
      return
    }

    if (duplicateQualification) {
      setError("A qualification for this position type already exists. Open the existing qualification instead.")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const qualification = await qualificationApi.create({
        position_type_id: Number(form.position_type_id),
        note: form.note,
      })

      if (selectedFile) {
        await qualificationApi.uploadDocument(qualification.id, { file: selectedFile })
      }

      setCreatedQualification(qualification)
      setForm({ position_type_id: "", note: "" })
      setSelectedFile(null)
      await loadQualifications(1, pagination.limit)
      navigate(`/qualifications/${qualification.id}`)
    } catch (err) {
      const message = err.message || "Failed to create qualification."
      if (message.toLowerCase().includes("already exists")) {
        setError("A qualification for this position type already exists. Open the existing qualification below instead of creating a duplicate.")
      } else {
        setError(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil((pagination.count || 0) / pagination.limit))
  const approvedCount = countByStatus(qualifications, "approved")
  const pendingCount = qualifications.filter((qualification) => ["created", "submitted", "revised"].includes(qualification.status)).length
  const rejectedCount = countByStatus(qualifications, "rejected")

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Qualifications</h1>
          <p className="mt-2 text-muted-foreground">
            View all of your qualifications, including approved ones, continue editing existing requests, or create a new one for a visible position type you have not already requested.
          </p>
        </div>
        <Badge variant="secondary">Regular</Badge>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Approved</CardTitle>
            <CardDescription>Qualifications you can already use.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>In Progress</CardTitle>
            <CardDescription>Created, submitted, or revised.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Rejected</CardTitle>
            <CardDescription>Requests that may need revision.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Existing Qualifications</CardTitle>
          <CardDescription>
            Approved qualifications are shown here together with created, submitted, revised, and rejected requests. Open any qualification to update its note, upload or replace the document, and perform the next allowed action.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingQualifications ? (
            <div className="text-sm text-muted-foreground">Loading your qualifications...</div>
          ) : qualifications.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              You do not have any qualification requests yet.
            </div>
          ) : (
            <div className="space-y-3">
              {qualifications.map((qualification) => {
                const documentUrl = resolveApiUrl(qualification.document)
                return (
                  <div
                    key={qualification.id}
                    className="flex flex-col gap-4 rounded-2xl border px-4 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium">{qualification.position_type?.name || "Unknown position type"}</div>
                        <Badge variant={badgeVariant(qualification.status)}>{qualification.status}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Updated {formatDateTime(qualification.updatedAt)}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {qualification.note || "No note added yet."}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {documentUrl ? (
                        <Button asChild type="button" variant="outline">
                          <a href={documentUrl} target="_blank" rel="noreferrer">
                            Open Document
                          </a>
                        </Button>
                      ) : null}
                      <Button type="button" onClick={() => navigate(`/qualifications/${qualification.id}`)}>
                        Edit Qualification
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-sm text-muted-foreground">
              {pagination.count} total qualification{pagination.count === 1 ? "" : "s"}
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="qualification-limit" className="text-sm">Per page</Label>
              <select
                id="qualification-limit"
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={pagination.limit}
                onChange={(event) => loadQualifications(1, Number(event.target.value))}
              >
                {[5, 10, 20].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                disabled={pagination.page <= 1 || isLoadingQualifications}
                onClick={() => loadQualifications(pagination.page - 1, pagination.limit)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={pagination.page >= totalPages || isLoadingQualifications}
                onClick={() => loadQualifications(pagination.page + 1, pagination.limit)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Qualification</CardTitle>
          <CardDescription>
            Matches <code>POST /qualifications</code> and optionally uploads a PDF through <code>PUT /qualifications/:qualificationId/document</code>. Position types that already have a qualification are removed from the create list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="position_type_id">Position Type</Label>
              <select
                id="position_type_id"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.position_type_id}
                onChange={(event) => setForm((current) => ({ ...current, position_type_id: event.target.value }))}
                disabled={isLoadingTypes || isSubmitting}
              >
                <option value="">Select a visible position type</option>
                {availablePositionTypes.map((positionType) => (
                  <option key={positionType.id} value={positionType.id}>
                    {positionType.name}
                  </option>
                ))}
              </select>
              {availablePositionTypes.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  You already have a qualification for every visible position type.
                </p>
              ) : null}
            </div>

            {duplicateQualification ? (
              <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
                A qualification for this position type already exists with status <span className="font-medium">{duplicateQualification.status}</span>.
                <div className="mt-3">
                  <Button type="button" variant="outline" onClick={() => navigate(`/qualifications/${duplicateQualification.id}`)}>
                    Open Existing Qualification
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                rows={6}
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Add supporting notes for your qualification request."
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">Supporting PDF</Label>
              <Input
                id="document"
                type="file"
                accept="application/pdf"
                disabled={isSubmitting}
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Optional. Upload a PDF certificate or supporting document.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting || isLoadingTypes || availablePositionTypes.length === 0}>
                {isSubmitting ? "Creating..." : "Create Qualification"}
              </Button>
              {createdQualification ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/qualifications/${createdQualification.id}`)}
                >
                  Open Latest Request
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
