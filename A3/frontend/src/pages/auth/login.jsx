import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/context/auth-context"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Home } from "lucide-react"

export const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, user } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const intendedPath = location.state?.from?.pathname

  useEffect(() => {
    if (!isLoading && user) {
      navigate(intendedPath || "/", { replace: true })
    }
  }, [isLoading, user, navigate, intendedPath])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      await login(email.trim(), password)
      navigate(intendedPath || "/", { replace: true })
    } catch (err) {
      setError(err.message || "Unable to log in.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-enter flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="flex">
        <div className="p-2 pt-1">
          <div
            className="rounded-full border-2 bg-white p-2 transition hover:cursor-pointer hover:bg-blue-600 hover:text-white"
            onClick={() => navigate("/")}
          >
            <Home />
          </div>
        </div>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Log in</CardTitle>
            <CardDescription>
              Enter your email and password to access your account.
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Enter your password"
                  required
                />
                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary underline underline-offset-4"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (<><LoadingSpinner className="text-primary-foreground" /> Logging in...</>) : "Log in"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
            <p>
              Don&apos;t have an account?{" "}
              <Link
                to="/register/regular"
                className="text-primary underline underline-offset-4"
              >
                Register as a worker
              </Link>
            </p>
            <p>
              Need a business account?{" "}
              <Link
                to="/register/business"
                className="text-primary underline underline-offset-4"
              >
                Register as a business
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
