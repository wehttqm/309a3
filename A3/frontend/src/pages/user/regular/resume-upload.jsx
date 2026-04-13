import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api/client"
import { FileText, X, Upload, Eye } from "lucide-react"

const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export default function ResumeUpload() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [resumeUrl, setResumeUrl] = useState(null)

  useEffect(() => {
    async function fetchResume() {
      const user = await apiClient.getUsersMe()
      console.log(user)
      if (
        user.resume !== null &&
        user.resume !== undefined &&
        user.resume !== ""
      ) {
        setResumeUrl(user.resume + `?t=${Date.now()}`)
      }
    }
    fetchResume()
  }, [])

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    setError(null)
    setSuccess(false)
    setShowPreview(false)

    if (!selected) return

    if (selected.type !== "application/pdf") {
      setError("Only PDF files are accepted.")
      return
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB.")
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setError(null)
    setSuccess(false)
    setShowPreview(false)
  }

  const handleSubmit = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await apiClient.putUsersMeResume({
        body: {
          file,
        },
      })
      setResumeUrl(res.resume + `?t=${Date.now()}`)
      setSuccess(true)
      setFile(null)
    } catch (err) {
      setError(err?.message ?? "Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="page-enter mx-auto max-w-200 space-y-8 px-6 py-10">
      <div className="mb-8 flex items-center justify-between border-b pb-6">
        <h1 className="text-3xl font-bold">Resume Upload</h1>
      </div>
      <div className="flex flex-col gap-2">
        {/* Drop zone / file selector */}
        {!file ? (
          <label
            htmlFor="resume-upload"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
          >
            <Upload className="h-8 w-8 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium">Click to select a file</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                PDF only · Max 10MB
              </p>
            </div>
            <Input
              id="resume-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        ) : (
          <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
            {/* File info row */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Preview toggle */}
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Eye className="h-3.5 w-3.5" />
              {showPreview ? "Hide preview" : "Preview PDF"}
            </button>

            {/* Inline PDF preview */}
            {showPreview && (
              <iframe
                src={previewUrl}
                title="Resume Preview"
                className="w-full rounded-md border"
                style={{ height: "480px" }}
              />
            )}
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && (
          <p className="text-sm text-green-600">
            Resume uploaded successfully.
          </p>
        )}
        <Button
          type="button"
          size="sm"
          disabled={!file || uploading}
          onClick={handleSubmit}
          className="w-full sm:w-auto"
        >
          {uploading ? "Uploading..." : "Upload Resume"}
        </Button>
      </div>
      <div className="mb-8 flex items-center justify-between border-b pb-6">
        <h1 className="text-3xl font-bold">Your Resume</h1>
      </div>
      {resumeUrl ? (
        <div>
          <iframe
            key={resumeUrl}
            src={VITE_BACKEND_URL + resumeUrl}
            title="Resume Preview"
            className="w-full rounded-md border"
            style={{ height: "480px" }}
          />
        </div>
      ) : (
        <div>We couldn't find your resume! Have you uploaded one yet?</div>
      )}
    </div>
  )
}
