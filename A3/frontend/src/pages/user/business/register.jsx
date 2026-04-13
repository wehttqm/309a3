import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { notify } from "@/lib/notify"
import { ActivationLinkCard } from "@/components/auth/activation-link-card"

export const BusinessRegister = () => {
  const { registerBusiness } = useAuth()
  const [form, setForm] = useState({
    business_name: "",
    owner_name: "",
    email: "",
    password: "",
    phone_number: "",
    postal_address: "",
    lat: "",
    lon: "",
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdAccount, setCreatedAccount] = useState(null)

  const updateField = (key) => (event) => {
    setForm((current) => ({
      ...current,
      [key]: event.target.value,
    }))
  }

  const activationHref = useMemo(() => {
    if (!createdAccount?.resetToken || !createdAccount?.email) return ""

    const params = new URLSearchParams({
      token: createdAccount.resetToken,
      email: createdAccount.email,
      role: "business",
    })

    return `/activate-account?${params.toString()}`
  }, [createdAccount])

  const activationUrl = useMemo(() => {
    if (!activationHref) return ""

    if (typeof window === "undefined") return activationHref
    return `${window.location.origin}${activationHref}`
  }, [activationHref])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const created = await registerBusiness({
        business_name: form.business_name,
        owner_name: form.owner_name,
        email: form.email,
        password: form.password,
        phone_number: form.phone_number,
        postal_address: form.postal_address,
        location: {
          lat: Number(form.lat),
          lon: Number(form.lon),
        },
      })
      setCreatedAccount(created)
      notify.success("Business account created. Use the activation link to activate it.")
    } catch (err) {
      setError(err.message || "Unable to register business.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (createdAccount && activationHref) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
        <ActivationLinkCard
          title="Business account created"
          description="We generated a simulated activation email for this new business account."
          activationHref={activationHref}
          activationUrl={activationUrl}
          expiresAt={createdAccount.expiresAt}
          role="business"
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create business account</CardTitle>
          <CardDescription>
            Register your business to manage postings and staffing activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="business_name" className="text-sm font-medium">
                Business name
              </label>
              <input
                id="business_name"
                value={form.business_name}
                onChange={updateField("business_name")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="owner_name" className="text-sm font-medium">
                Owner name
              </label>
              <input
                id="owner_name"
                value={form.owner_name}
                onChange={updateField("owner_name")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={updateField("email")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                value={form.password}
                onChange={updateField("password")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="phone_number" className="text-sm font-medium">
                  Phone number
                </label>
                <input
                  id="phone_number"
                  value={form.phone_number}
                  onChange={updateField("phone_number")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="postal_address" className="text-sm font-medium">
                  Postal address
                </label>
                <input
                  id="postal_address"
                  value={form.postal_address}
                  onChange={updateField("postal_address")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="lat" className="text-sm font-medium">
                  Latitude
                </label>
                <input
                  id="lat"
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={updateField("lat")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lon" className="text-sm font-medium">
                  Longitude
                </label>
                <input
                  id="lon"
                  type="number"
                  step="any"
                  value={form.lon}
                  onChange={updateField("lon")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create business account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="ml-1 text-primary underline underline-offset-4"
          >
            Log in
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
