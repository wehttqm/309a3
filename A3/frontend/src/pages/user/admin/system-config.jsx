import { useEffect, useState } from "react"
import { notify } from "@/lib/notify"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { adminApi } from "@/lib/api/client"
import { AdminHelperCard } from "@/components/admin/admin-helper-card"

function SettingCard({
  title,
  description,
  field,
  placeholder,
  buttonLabel,
  helper,
  submit,
  load,
  validate,
}) {
  const [value, setValue] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [successValue, setSuccessValue] = useState(null)

  useEffect(() => {
    let ignore = false

    const loadCurrentValue = async () => {
      setError("")
      setIsLoading(true)

      try {
        const response = await load()
        if (!ignore) {
          setSuccessValue(response[field])
        }
      } catch (err) {
        const message = err.message || "Failed to load current setting."
        if (!ignore) {
          setError(message)
          notify.error(message)
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadCurrentValue()

    return () => {
      ignore = true
    }
  }, [field, load])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    const parsedValue = Number(value)
    if (value === "" || Number.isNaN(parsedValue)) {
      const message = "Enter a valid number."
      setError(message)
      notify.error(message)
      return
    }

    const validationError = validate?.(parsedValue)
    if (validationError) {
      setError(validationError)
      notify.error(validationError)
      return
    }

    setIsSaving(true)

    try {
      const response = await submit(parsedValue)
      const nextValue = response[field]
      setSuccessValue(nextValue)
      setValue("")
      notify.success(`${title} updated to ${nextValue}.`)
    } catch (err) {
      const message = err.message || "Failed to update setting."
      setError(message)
      notify.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const effectivePlaceholder =
    successValue !== null && successValue !== undefined
      ? String(successValue)
      : String(placeholder)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">New value</label>
            <Input
              type="number"
              step="1"
              min="0"
              placeholder={effectivePlaceholder}
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">{helper}</p>
          </div>

          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              Loading current value...
            </div>
          ) : successValue !== null ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Current value: <span className="font-medium">{successValue}</span>
            </div>
          ) : null}

          <Button type="submit" disabled={isSaving || isLoading}>
            {isSaving ? "Saving..." : buttonLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export const AdminSystemConfigPage = () => {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
          <p className="mt-2 text-muted-foreground">
            Update admin-controlled system timing settings.
          </p>
        </div>
        <Badge variant="secondary">Admin</Badge>
      </div>

      <div className="mb-6">
        <AdminHelperCard
          title="Change these settings carefully"
          description="These values affect live platform behavior for matching, resets, and negotiations. Small changes can have large workflow effects."
          bullets={[
            'Shorter timeouts make the system stricter and can remove users from discovery faster.',
            'Longer negotiation windows give both sides more time, but they also lock jobs and users for longer.',
            'Use these controls when you need to tune the platform, not for routine day-to-day review work.',
          ]}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SettingCard
          title="Reset Cooldown"
          description="Change the cooldown for password reset requests sent through /auth/resets."
          field="reset_cooldown"
          placeholder="1"
          buttonLabel="Update Reset Cooldown"
          helper="Value is in seconds. Must be zero or greater."
          load={() => adminApi.getResetCooldown()}
          submit={(nextValue) => adminApi.setResetCooldown(nextValue)}
          validate={(nextValue) =>
            nextValue < 0 ? "Enter a value greater than or equal to 0." : ""
          }
        />

        <SettingCard
          title="Negotiation Window"
          description="Change how long a negotiation remains open before it expires."
          field="negotiation_window"
          placeholder="900"
          buttonLabel="Update Negotiation Window"
          helper="Value is in seconds. Must be greater than zero."
          load={() => adminApi.getNegotiationWindow()}
          submit={(nextValue) => adminApi.setNegotiationWindow(nextValue)}
          validate={(nextValue) => (nextValue <= 0 ? "Enter a value greater than 0." : "")}
        />

        <SettingCard
          title="Job Start Window"
          description="Change how far ahead businesses may set a new job start time."
          field="job_start_window"
          placeholder="168"
          buttonLabel="Update Job Start Window"
          helper="Value is in hours. Must be greater than zero."
          load={() => adminApi.getJobStartWindow()}
          submit={(nextValue) => adminApi.setJobStartWindow(nextValue)}
          validate={(nextValue) => (nextValue <= 0 ? "Enter a value greater than 0." : "")}
        />

        <SettingCard
          title="Availability Timeout"
          description="Change how long an inactive regular user remains available before timing out."
          field="availability_timeout"
          placeholder="60"
          buttonLabel="Update Availability Timeout"
          helper="Value is in seconds. Must be greater than zero."
          load={() => adminApi.getAvailabilityTimeout()}
          submit={(nextValue) => adminApi.setAvailabilityTimeout(nextValue)}
          validate={(nextValue) => (nextValue <= 0 ? "Enter a value greater than 0." : "")}
        />
      </div>
    </div>
  )
}