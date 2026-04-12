import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
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

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [status, setStatus] = useState("idle")

  const token = searchParams.get("token") || ""
  const email = searchParams.get("email") || ""

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!token || !email) {
      setError("This reset link is missing the required account details.")
      return
    }

    setError("")
    setStatus("submitting")

    try {
      await authApi.resetPassword(token, email, password)
      setStatus("success")
    } catch (err) {
      setError(err.message || "Unable to reset the password.")
      setStatus("idle")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {status === "success" ? "Password updated" : "Reset password"}
          </CardTitle>
          <CardDescription>
            This page simulates the password reset email flow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border px-4 py-3 text-sm">
            <span className="font-medium">Email:</span> {email || "Missing"}
          </div>

          {status === "success" ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              The password was updated successfully. You can sign in with the new password now.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter a new password"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={status === "submitting"}>
                {status === "submitting" ? "Updating password..." : "Update password"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild variant={status === "success" ? "default" : "outline"} className="w-full">
            <Link to="/login">Go to login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
