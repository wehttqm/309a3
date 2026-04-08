import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { positionTypeApi, qualificationApi, resolveApiUrl } from "@/lib/api/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

function isPendingStatus(status) {
  return ["created", "submitted", "revised"].includes(status)
}

function statusLabel(status) {
  switch (status) {
    case "created":
      return "Draft"
    case "submitted":
      return "Under review"
    case "revised":
      return "Updated"
    case "approved":
      return "Approved"
    case "rejected":
      return "Changes needed"
    default:
      return status || "Unknown"
  }
}

function statusHelpText(status) {
  switch (status) {
    case "created":
      return "Finish the details and submit it when you are ready."
    case "submitted":
      return "Your request has been sent and is waiting for review."
    case "revised":
      return "Your updated request is waiting for another review."
    case "approved":
      return "You can use this qualification for matching positions."
    case "rejected":
      return "Open it to update your note or document and send a revised version."
    default:
      return ""
  }
}

function sortQualifications(items) {
  return [...items].sort((a, b) => {
    const aPending = isPendingStatus(a.status)
    const bPending = isPendingStatus(b.status)

    if (aPending !== bPending) {
      return aPending ? -1 : 1
    }

    const aTime = new Date(a.updatedAt || 0).getTime()
    const bTime = new Date(b.updatedAt || 0).getTime()
    return bTime - aTime
  })
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
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

  const sortedQualifications = useMemo(() => sortQualifications(qualifications), [qualifications])
  const pendingQualifications = useMemo(
    () => sortedQualifications.filter((qualification) => isPendingStatus(qualification.status)),
    [sortedQualifications],
  )
  const otherQualifications = useMemo(
    () => sortedQualifications.filter((qualification) => !isPendingStatus(qualification.status)),
    [sortedQualifications],
  )

  const resetCreateForm = () => {
    setForm({ position_type_id: "", note: "" })
    setSelectedFile(null)
  }

  const handleCreateModalChange = (open) => {
    setIsCreateModalOpen(open)
    if (!open) {
      resetCreateForm()
      setError("")
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.position_type_id) {
      setError("Please choose the position you want to add.")
      return
    }

    if (duplicateQualification) {
      setError("You already have a qualification for this position. Open the existing one instead.")
      return
    }

    setIsSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const qualification = await qualificationApi.create({
        position_type_id: Number(form.position_type_id),
        note: form.note,
      })

      if (selectedFile) {
        await qualificationApi.uploadDocument(qualification.id, { file: selectedFile })
      }

      setCreatedQualification(qualification)
      setSuccess("Qualification created. You can open it any time to upload documents, update your note, or submit it for review.")
      handleCreateModalChange(false)
      await loadQualifications(1, pagination.limit)
    } catch (err) {
      const message = err.message || "Failed to create qualification."
      if (message.toLowerCase().includes("already exists")) {
        setError("You already have a qualification for this position. Open the existing one below instead of creating a duplicate.")
      } else {
        setError(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil((pagination.count || 0) / pagination.limit))
  const approvedCount = countByStatus(qualifications, "approved")
  const pendingCount = qualifications.filter((qualification) => isPendingStatus(qualification.status)).length
  const rejectedCount = countByStatus(qualifications, "rejected")

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Qualifications</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Keep track of your qualifications, see what still needs attention, and add new qualifications when you are ready.
          </p>
        </div>
        <div className="flex items-center gap-3">   
          <Button type="button" onClick={() => handleCreateModalChange(true)}>
            Add Qualification
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span>{success}</span>
          {createdQualification ? (
            <Button type="button" variant="outline" onClick={() => navigate(`/qualifications/${createdQualification.id}`)}>
              Open latest qualification
            </Button>
          ) : null}
        </div>
      ) : null}

      {pendingQualifications.length > 0 ? (
        <Card className="mb-6 border-primary/15 bg-primary/5">
          <CardHeader>
            <CardTitle>Pending Qualifications</CardTitle>
            <CardDescription>
              These are the items that still need action from you or are waiting for review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingQualifications ? (
              <div className="text-sm text-muted-foreground">Loading your qualifications...</div>
            ) : (
              <div className="space-y-3">
                {pendingQualifications.map((qualification) => {
                  const documentUrl = resolveApiUrl(qualification.document)
                  return (
                    <div
                      key={qualification.id}
                      className="flex flex-col gap-4 rounded-2xl border bg-background px-4 py-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium">{qualification.position_type?.name || "Unknown position"}</div>
                          <Badge variant={badgeVariant(qualification.status)}>{statusLabel(qualification.status)}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{statusHelpText(qualification.status)}</div>
                        <div className="text-sm text-muted-foreground">Last updated {formatDateTime(qualification.updatedAt)}</div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {documentUrl ? (
                          <Button asChild type="button" variant="outline">
                            <a href={documentUrl} target="_blank" rel="noreferrer">
                              Open document
                            </a>
                          </Button>
                        ) : null}
                        <Button type="button" onClick={() => navigate(`/qualifications/${qualification.id}`)}>
                          Continue
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Approved and Previous Qualifications</CardTitle>
          <CardDescription>
            Review approved qualifications and any items that were previously sent back for changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingQualifications ? (
            <div className="text-sm text-muted-foreground">Loading your qualifications...</div>
          ) : qualifications.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              You have not added any qualifications yet.
            </div>
          ) : otherQualifications.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Your non-pending qualifications will appear here once they are approved or sent back for changes.
            </div>
          ) : (
            <div className="space-y-3">
              {otherQualifications.map((qualification) => {
                const documentUrl = resolveApiUrl(qualification.document)
                return (
                  <div
                    key={qualification.id}
                    className="flex flex-col gap-4 rounded-2xl border px-4 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium">{qualification.position_type?.name || "Unknown position"}</div>
                        <Badge variant={badgeVariant(qualification.status)}>{statusLabel(qualification.status)}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{statusHelpText(qualification.status)}</div>
                      <div className="text-sm text-muted-foreground">Last updated {formatDateTime(qualification.updatedAt)}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {qualification.note || "No note added yet."}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {documentUrl ? (
                        <Button asChild type="button" variant="outline">
                          <a href={documentUrl} target="_blank" rel="noreferrer">
                            Open document
                          </a>
                        </Button>
                      ) : null}
                      <Button type="button" onClick={() => navigate(`/qualifications/${qualification.id}`)}>
                        Revise
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

      <Dialog open={isCreateModalOpen} onOpenChange={handleCreateModalChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Qualification</DialogTitle>
            <DialogDescription>
              Add a new qualification for a position you want to work in. You can upload your PDF now or later.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="position_type_id">Position</Label>
              <select
                id="position_type_id"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.position_type_id}
                onChange={(event) => setForm((current) => ({ ...current, position_type_id: event.target.value }))}
                disabled={isLoadingTypes || isSubmitting}
              >
                <option value="">Choose a position</option>
                {availablePositionTypes.map((positionType) => (
                  <option key={positionType.id} value={positionType.id}>
                    {positionType.name}
                  </option>
                ))}
              </select>
              {availablePositionTypes.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  You already have a qualification for every visible position right now.
                </p>
              ) : null}
            </div>

            {duplicateQualification ? (
              <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
                You already have a qualification for this position.
                <div className="mt-3">
                  <Button type="button" variant="outline" onClick={() => navigate(`/qualifications/${duplicateQualification.id}`)}>
                    Open existing qualification
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="note">Notes</Label>
              <Textarea
                id="note"
                rows={6}
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Add anything you want the reviewer to know."
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
                Optional. Upload a certificate or supporting document as a PDF.
              </p>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || isLoadingTypes || availablePositionTypes.length === 0}>
                {isSubmitting ? "Creating..." : "Create qualification"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
