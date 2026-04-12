import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { authApi } from "@/lib/api/client"

export const RequestPasswordResetPage = () => {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetRequest, setResetRequest] = useState(null)

  const resetHref = useMemo(() => {
    if (!resetRequest?.resetToken || !email) return ""

    const params = new URLSearchParams({
      token: resetRequest.resetToken,
      email,
    })

    return `/reset-password?${params.toString()}`
  }, [email, resetRequest])

  const resetUrl = useMemo(() => {
    if (!resetHref) return ""
    if (typeof window === "undefined") return resetHref
    return `${window.location.origin}${resetHref}`
  }, [resetHref])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const response = await authApi.requestPasswordReset(normalizedEmail)
      setEmail(normalizedEmail)
      setResetRequest(response)
    } catch (err) {
      setError(err.message || "Unable to request a password reset.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (resetRequest && resetHref) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Password reset requested</CardTitle>
            <CardDescription>
              This simulates the password reset email described in the backend
              spec.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Use the reset link below to choose a new password for {email}.
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Reset link</p>
              <div className="rounded-lg border bg-muted/40 px-3 py-3 text-xs break-all text-muted-foreground">
                {resetUrl}
              </div>
              {resetRequest.expiresAt ? (
                <p className="text-xs text-muted-foreground">
                  Link expires on {new Date(resetRequest.expiresAt).toLocaleString()}.
                </p>
              ) : null}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button asChild>
              <Link to={resetHref}>Open reset link</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/login">Back to login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>
            Enter the account email and we will simulate a password reset email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="you@example.com"
                required
              />
            </div>

            {error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Generating reset link..." : "Generate reset link"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Back to login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
