import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
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

export const RegularRegister = () => {
  const navigate = useNavigate()
  const { registerRegular } = useAuth()
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone_number: "",
    postal_address: "",
    birthday: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (key) => (event) => {
    setForm((current) => ({
      ...current,
      [key]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setSuccess("")
    setIsSubmitting(true)

    try {
      await registerRegular({
        ...form,
        phone_number: form.phone_number || undefined,
        postal_address: form.postal_address || undefined,
        birthday: form.birthday || undefined,
      })
      setSuccess("Account created. Activate the account before logging in.")
      navigate("/login", { replace: true })
    } catch (err) {
      setError(err.message || "Unable to register.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create worker account</CardTitle>
          <CardDescription>
            Register as a worker to manage your profile and participate in job matching.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="first_name" className="text-sm font-medium">First name</label>
                <input id="first_name" value={form.first_name} onChange={updateField("first_name")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="last_name" className="text-sm font-medium">Last name</label>
                <input id="last_name" value={form.last_name} onChange={updateField("last_name")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input id="email" type="email" value={form.email} onChange={updateField("email")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <input id="password" type="password" value={form.password} onChange={updateField("password")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="phone_number" className="text-sm font-medium">Phone</label>
                <input id="phone_number" value={form.phone_number} onChange={updateField("phone_number")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2">
                <label htmlFor="birthday" className="text-sm font-medium">Birthday</label>
                <input id="birthday" type="date" value={form.birthday} onChange={updateField("birthday")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="postal_address" className="text-sm font-medium">Postal address</label>
              <input id="postal_address" value={form.postal_address} onChange={updateField("postal_address")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>

            {error ? <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}
            {success ? <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">{success}</div> : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create worker account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="ml-1 text-primary underline underline-offset-4">Log in</Link>
        </CardFooter>
      </Card>
    </div>
  )
}
