import { useCallback, useEffect, useMemo, useState } from "react"
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

export const ActivateAccountPage = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState("loading")
  const [message, setMessage] = useState("")

  const token = searchParams.get("token") || ""
  const email = searchParams.get("email") || ""
  const role = searchParams.get("role") || "regular"

  const title = useMemo(() => {
    if (status === "success") {
      return role === "business"
        ? "Business account activated"
        : "Worker account activated"
    }

    if (status === "error") {
      return "Activation link could not be completed"
    }

    return "Activating account"
  }, [role, status])

  const activate = useCallback(async () => {
    if (!token || !email) {
      setStatus("error")
      setMessage("This activation link is missing the required account details.")
      return
    }

    setStatus("loading")
    setMessage("")

    try {
      await authApi.activateAccount(token, email)
      setStatus("success")
      setMessage(
        role === "business"
          ? "Your business account is now active. You can sign in now, but an administrator still needs to verify the business before posting jobs."
          : "Your worker account is now active. You can sign in and continue setting up your profile."
      )
    } catch (error) {
      setStatus("error")
      setMessage(error.message || "Unable to activate this account.")
    }
  }, [email, role, token])

  useEffect(() => {
    activate()
  }, [activate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            This page simulates the email activation step for newly registered
            accounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border px-4 py-3 text-sm">
            <div>
              <span className="font-medium">Email:</span> {email || "Missing"}
            </div>
            <div>
              <span className="font-medium">Account type:</span>{" "}
              {role === "business" ? "Business" : "Worker"}
            </div>
          </div>

          {status === "loading" ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Processing the activation link now.
            </div>
          ) : null}

          {status === "success" ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {message}
            </div>
          ) : null}

          {status === "error" ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {message}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          {status === "error" ? (
            <Button onClick={activate}>Try activation again</Button>
          ) : (
            <Button asChild>
              <Link to="/login">Go to login</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to={role === "business" ? "/register/business" : "/register/regular"}>
              Back to registration
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
