import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toLocalDateTimeInput } from "@/components/jobs/job-utils"

function getInitialForm(job) {
  return {
    position_type_id: job?.position_type?.id ? String(job.position_type.id) : "",
    salary_min: job?.salary_min ?? "",
    salary_max: job?.salary_max ?? "",
    start_time: toLocalDateTimeInput(job?.start_time),
    end_time: toLocalDateTimeInput(job?.end_time),
    note: job?.note || "",
  }
}

export function JobFormDialog({
  open,
  onOpenChange,
  mode = "create",
  job = null,
  positionTypes = [],
  onSubmit,
  isSaving = false,
}) {
  const [form, setForm] = useState(getInitialForm(job))
  const [error, setError] = useState("")
  const isEdit = mode === "edit"

  useEffect(() => {
    setForm(getInitialForm(job))
    setError("")
  }, [job, mode, open])

  const canEditPositionType = !isEdit

  const title = useMemo(() => (isEdit ? "Edit Job Posting" : "Post a Job"), [isEdit])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError("")

    const payload = {
      ...(canEditPositionType && { position_type_id: Number(form.position_type_id) }),
      salary_min: Number(form.salary_min),
      salary_max: Number(form.salary_max),
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      note: form.note || "",
    }

    if (!isEdit && !form.position_type_id) {
      setError("Position type is required.")
      return
    }

    if (!form.start_time || !form.end_time) {
      setError("Start and end times are required.")
      return
    }

    if (Number.isNaN(payload.salary_min) || Number.isNaN(payload.salary_max)) {
      setError("Salary values must be valid numbers.")
      return
    }

    try {
      await onSubmit?.(payload)
      onOpenChange(false)
    } catch (submitError) {
      setError(submitError.message || "Unable to save job.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the existing job posting."
              : "Create a new posting for a verified business account."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          {canEditPositionType ? (
            <div className="space-y-2">
              <Label>Position Type</Label>
              <Select
                value={form.position_type_id}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, position_type_id: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a position type" />
                </SelectTrigger>
                <SelectContent>
                  {positionTypes.map((positionType) => (
                    <SelectItem key={positionType.id} value={String(positionType.id)}>
                      {positionType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Position Type</Label>
              <Input value={job?.position_type?.name || "—"} disabled />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="salary_min">Minimum Salary</Label>
              <Input id="salary_min" name="salary_min" type="number" step="0.01" value={form.salary_min} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary_max">Maximum Salary</Label>
              <Input id="salary_max" name="salary_max" type="number" step="0.01" value={form.salary_max} onChange={handleChange} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input id="start_time" name="start_time" type="datetime-local" value={form.start_time} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input id="end_time" name="end_time" type="datetime-local" value={form.end_time} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" name="note" rows={4} value={form.note} onChange={handleChange} placeholder="Optional note for the posting" />
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Create Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
