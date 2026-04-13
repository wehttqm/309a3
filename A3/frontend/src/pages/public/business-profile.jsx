import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { MapPin, Mail, Phone, ArrowLeft, Building2 } from "lucide-react"

import { PageShell } from "@/components/layout/page-shell"
import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/context/auth-context"
import { apiClient } from "@/lib/api/client"

function formatLocation(location) {
  if (!location) return "Unavailable"
  const hasLat = typeof location.lat === "number"
  const hasLon = typeof location.lon === "number"
  if (!hasLat || !hasLon) return "Unavailable"
  return `${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}`
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/70 px-4 py-3">
      <div className="mt-0.5 rounded-lg bg-primary/8 p-2 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 space-y-1">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="break-words text-sm text-foreground">{value || "—"}</div>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-72" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-10/12" />
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function BusinessProfilePage() {
  const { businessId } = useParams()
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  const [business, setBusiness] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let ignore = false

    async function loadBusiness() {
      setIsLoading(true)
      setError("")

      try {
        const data = await apiClient.getBusinessesBusinessId({
          pathParams: { businessId },
        })

        if (!ignore) {
          if (!data?.id) {
            setBusiness(null)
            setError("Business not found.")
          } else {
            setBusiness(data)
          }
        }
      } catch (err) {
        if (!ignore) {
          setBusiness(null)
          setError(err.message || "Failed to load business profile.")
        }
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    if (businessId) {
      loadBusiness()
    } else {
      setBusiness(null)
      setError("Business not found.")
      setIsLoading(false)
    }

    return () => {
      ignore = true
    }
  }, [businessId])

  const statusBadges = useMemo(() => {
    if (!business) return []
    const badges = [<Badge key="type" variant="secondary">Business</Badge>]

    if (isAdmin) {
      badges.push(
        <Badge key="activation" variant={business.activated ? "default" : "outline"}>
          {business.activated ? "Activated" : "Inactive"}
        </Badge>
      )
      badges.push(
        <Badge key="verification" variant={business.verified ? "default" : "secondary"}>
          {business.verified ? "Verified" : "Pending verification"}
        </Badge>
      )
    }

    return badges
  }, [business, isAdmin])

  return (
    <PageShell
      title={business?.business_name || "Business Profile"}
      description="Public business profile with contact details, business summary, and location information."
      actions={
        <Button asChild variant="outline">
          <Link to="/businesses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Directory
          </Link>
        </Button>
      }
    >
      {isLoading ? <ProfileSkeleton /> : null}

      {!isLoading && error ? (
        <Card className="border-destructive/20 bg-destructive/10 text-destructive shadow-none">
          <CardContent className="py-8 text-sm">{error}</CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && business ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="surface-enter border-border/70 bg-card/90 shadow-sm backdrop-blur-sm">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <UserAvatar
                  user={business}
                  className="h-20 w-20 border"
                  fallbackClassName="text-xl"
                  title={business.business_name || "Business avatar"}
                  showStatus={false}
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <CardTitle className="text-2xl">{business.business_name}</CardTitle>
                    <CardDescription className="mt-1 break-all">
                      {business.email || "No email provided"}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">{statusBadges}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="mb-2 text-sm font-medium text-foreground">Biography</div>
                <p className="text-sm leading-7 text-muted-foreground">
                  {business.biography || "This business has not added a biography yet."}
                </p>
              </div>

              {isAdmin && business.owner_name ? (
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="mb-2 text-sm font-medium text-foreground">Owner</div>
                  <p className="text-sm text-muted-foreground">{business.owner_name}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="surface-enter border-border/70 bg-card/90 shadow-sm backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Public Business Details</CardTitle>
              <CardDescription>
                Contact and location information available to visitors.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <InfoRow icon={Mail} label="Email" value={business.email} />
              <InfoRow icon={Phone} label="Phone" value={business.phone_number} />
              <InfoRow icon={MapPin} label="Address" value={business.postal_address} />
              <InfoRow icon={Building2} label="Coordinates" value={formatLocation(business.location)} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </PageShell>
  )
}
