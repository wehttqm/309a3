import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { qualificationApi, resolveApiUrl } from "@/lib/api/client"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

function formatDateTime(value) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString()
}

function statusVariant(status) {
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

function backPathForRole(role) {
  if (role === "admin") return "/admin/qualifications"
  if (role === "regular") return "/my/qualifications"
  return "/"
}

export const QualificationDetailsPage = () => {
  const { qualificationId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [qualification, setQualification] = useState(null)
  const [noteDraft, setNoteDraft] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingDocument, setIsUploadingDocument] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const canEditNote = user?.role === "regular" || user?.role === "admin"
  const documentUrl = useMemo(
    () => resolveApiUrl(qualification?.document),
    [qualification?.document],
  )

  const loadQualification = async () => {
    setIsLoading(true)
    setError("")

    try {
      const data = await qualificationApi.getById(Number(qualificationId))
      setQualification(data)
      setNoteDraft(data.note || "")
    } catch (err) {
       toast.error(err.message || "Failed to update qualification.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!qualificationId) return
    loadQualification()
  }, [qualificationId])

  const patchQualification = async (payload, successMessage) => {
    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      await qualificationApi.update(Number(qualificationId), payload)
      await loadQualification()
      setSuccess(successMessage)
    } catch (err) {
      setError(err.message || "Failed to update qualification.")
    } finally {
      setIsSaving(false)
    }
  }


  const uploadDocument = async () => {
    if (!selectedFile) return

    setIsUploadingDocument(true)
    setError("")
    setSuccess("")

    try {
      await qualificationApi.uploadDocument(Number(qualificationId), { file: selectedFile })
      setSelectedFile(null)
      await loadQualification()
      toast.success("Qualification document uploaded.")
    } catch (err) {
      toast.error(err.message || "Failed to upload qualification document.")
    } finally {
      setIsUploadingDocument(false)
    }
  }

  const saveNoteOnly = async () => {
    await patchQualification({ note: noteDraft }, "Note updated.")
  }

  const submitForReview = async () => {
    await patchQualification({ note: noteDraft, status: "submitted" }, "Qualification submitted for review.")
  }

  const markRevised = async () => {
    await patchQualification({ note: noteDraft, status: "revised" }, "Qualification marked as revised.")
  }

  const approveQualification = async () => {
    await patchQualification({ note: noteDraft, status: "approved" }, "Qualification approved.")
  }

  const rejectQualification = async () => {
    await patchQualification({ note: noteDraft, status: "rejected" }, "Qualification rejected.")
  }

  if (isLoading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Loading qualification...</div>
  }

  if (!qualification) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Qualification not found.</div>
  }

  const isRegular = user?.role === "regular"
  const isAdmin = user?.role === "admin"

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Qualification Request</h1>
          <p className="mt-2 text-muted-foreground">
            View qualification details and perform role-appropriate actions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {qualification.status ? (
            <Badge variant={statusVariant(qualification.status)}>{qualification.status}</Badge>
          ) : null}
          <Button type="button" variant="outline" onClick={() => navigate(backPathForRole(user?.role))}>
            Back
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className={`grid gap-6 ${isRegular ? "" : "lg:grid-cols-[1.2fr_0.8fr]"}`}>
        <Card>
          <CardHeader>
            <CardTitle>Qualification Details</CardTitle>
            <CardDescription>ID #{qualification.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Position Type</Label>
                <div className="mt-1 rounded-md border px-3 py-2 text-sm">
                  <div className="font-medium">{qualification.position_type?.name || "—"}</div>
                  <div className="text-muted-foreground">{qualification.position_type?.description || "—"}</div>
                </div>
              </div>
              <div>
                <Label>Updated</Label>
                <div className="mt-1 rounded-md border px-3 py-2 text-sm">{formatDateTime(qualification.updatedAt)}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualification-note">Note</Label>
              {canEditNote ? (
                <Textarea
                  id="qualification-note"
                  rows={8}
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  disabled={isSaving}
                />
              ) : (
                <div className="min-h-32 rounded-md border px-3 py-2 text-sm whitespace-pre-wrap">
                  {qualification.note || "—"}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Document</Label>
              {documentUrl ? (
                <Button asChild type="button" variant="outline">
                  <a href={documentUrl} target="_blank" rel="noreferrer">Open Document</a>
                </Button>
              ) : (
                <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">No document uploaded.</div>
              )}

              {isRegular ? (
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="application/pdf"
                    disabled={isUploadingDocument}
                    onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="outline" disabled={!selectedFile || isUploadingDocument} onClick={uploadDocument}>
                      {isUploadingDocument ? "Uploading..." : documentUrl ? "Replace Document" : "Upload Document"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            {canEditNote ? (
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={saveNoteOnly} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Note"}
                </Button>

                {isRegular && qualification.status === "created" ? (
                  <Button type="button" onClick={submitForReview} disabled={isSaving}>
                    Submit for Review
                  </Button>
                ) : null}

                {isRegular && ["approved", "rejected"].includes(qualification.status) ? (
                  <Button type="button" onClick={markRevised} disabled={isSaving}>
                    Mark as Revised
                  </Button>
                ) : null}

                {isAdmin && ["submitted", "revised"].includes(qualification.status) ? (
                  <>
                    <Button type="button" onClick={approveQualification} disabled={isSaving}>
                      Approve
                    </Button>
                    <Button type="button" variant="destructive" onClick={rejectQualification} disabled={isSaving}>
                      Reject
                    </Button>
                  </>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {!isRegular ? (
          <Card>
            <CardHeader>
              <CardTitle>User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-[140px_1fr] gap-3">
                <span className="text-muted-foreground">Name</span>
                <span>{qualification.user?.first_name} {qualification.user?.last_name}</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-3">
                <span className="text-muted-foreground">Role</span>
                <span>{qualification.user?.role || "—"}</span>
              </div>
              {qualification.user?.email ? (
                <div className="grid grid-cols-[140px_1fr] gap-3">
                  <span className="text-muted-foreground">Email</span>
                  <span>{qualification.user.email}</span>
                </div>
              ) : null}
              {qualification.user?.phone_number ? (
                <div className="grid grid-cols-[140px_1fr] gap-3">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{qualification.user.phone_number}</span>
                </div>
              ) : null}
              {qualification.user?.postal_address ? (
                <div className="grid grid-cols-[140px_1fr] gap-3">
                  <span className="text-muted-foreground">Address</span>
                  <span>{qualification.user.postal_address}</span>
                </div>
              ) : null}
              {qualification.user?.birthday ? (
                <div className="grid grid-cols-[140px_1fr] gap-3">
                  <span className="text-muted-foreground">Birthday</span>
                  <span>{qualification.user.birthday}</span>
                </div>
              ) : null}
              {typeof qualification.user?.activated === "boolean" ? (
                <div className="grid grid-cols-[140px_1fr] gap-3">
                  <span className="text-muted-foreground">Activated</span>
                  <span>{qualification.user.activated ? "Yes" : "No"}</span>
                </div>
              ) : null}
              {typeof qualification.user?.suspended === "boolean" ? (
                <div className="grid grid-cols-[140px_1fr] gap-3">
                  <span className="text-muted-foreground">Suspended</span>
                  <span>{qualification.user.suspended ? "Yes" : "No"}</span>
                </div>
              ) : null}
              {qualification.user?.createdAt ? (
                <div className="grid grid-cols-[140px_1fr] gap-3">
                  <span className="text-muted-foreground">Joined</span>
                  <span>{formatDateTime(qualification.user.createdAt)}</span>
                </div>
              ) : null}
              {qualification.user?.resume ? (
                <div className="pt-2">
                  <Button asChild type="button" variant="outline">
                    <a href={resolveApiUrl(qualification.user.resume)} target="_blank" rel="noreferrer">
                      Open Resume
                    </a>
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
