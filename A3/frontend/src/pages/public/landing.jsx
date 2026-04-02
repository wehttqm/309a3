import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Briefcase,
  Users,
  ClipboardCheck,
  ArrowRight,
  Building2,
  UserCheck,
  ShieldCheck,
} from "lucide-react"

export const Landing = () => {
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (user?.role === "regular") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-5xl px-6 py-16">
          <Badge variant="secondary" className="mb-4">
            Worker Dashboard
          </Badge>

          <h1 className="mb-3 text-4xl font-bold tracking-tight">
            Welcome back{user.name ? `, ${user.name}` : ""}
          </h1>

          <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
            Manage your account, review your profile, and continue using the
            staffing platform from your worker workspace.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="flex flex-col">
              <CardHeader>
                <Users className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>My Profile</CardTitle>
                <CardDescription>
                  Review your worker information and keep your account details up
                  to date.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button className="w-full" onClick={() => navigate("/profile")}>
                  Go to Profile <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ClipboardCheck className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>What you can do next</CardTitle>
                <CardDescription>
                  As more worker routes are added, this homepage can surface jobs,
                  qualifications, invitations, and active work items.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </div>
    )
  }

  if (user?.role === "business") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-5xl px-6 py-16">
          <Badge variant="secondary" className="mb-4">
            Business Dashboard
          </Badge>

          <h1 className="mb-3 text-4xl font-bold tracking-tight">
            Welcome back{user.name ? `, ${user.name}` : ""}
          </h1>

          <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
            Manage your business account and prepare your staffing workflow from
            your business workspace.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="flex flex-col">
              <CardHeader>
                <Building2 className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>
                  Review your business details and keep your organization profile
                  current.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button
                  className="w-full"
                  onClick={() => navigate("/business/profile")}
                >
                  Go to Business Profile <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Briefcase className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>What you can do next</CardTitle>
                <CardDescription>
                  Once business routes are mounted, this homepage can also surface
                  job postings, candidate discovery, and negotiation activity.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </div>
    )
  }

  if (user?.role === "admin") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-5xl px-6 py-16">
          <Badge variant="secondary" className="mb-4">
            Administrator
          </Badge>

          <h1 className="mb-3 text-4xl font-bold tracking-tight">
            Welcome back{user.name ? `, ${user.name}` : ""}
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground">
            Your admin session is active. Mount your admin routes before adding
            homepage shortcuts for qualification review, business verification,
            and system configuration.
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          Temporary Staffing Platform
        </Badge>
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Connect Businesses with Qualified Workers
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          A streamlined platform for posting jobs, verifying qualifications, and
          managing temporary staffing from start to finish.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={() => navigate("/register/regular")}>
            Join as Worker <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/register/business")}
          >
            Join as Business
          </Button>
          <Button size="lg" variant="ghost" onClick={() => navigate("/login")}>
            Log In
          </Button>
        </div>
      </section>

      <Separator />

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-10 text-center text-2xl font-semibold">
          How It Works
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <UserCheck className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">1. Create an Account</CardTitle>
              <CardDescription>
                Sign up as a worker or business. Workers submit qualifications;
                businesses get verified before posting jobs.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Briefcase className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">2. Match & Negotiate</CardTitle>
              <CardDescription>
                Businesses post jobs and invite candidates. Workers express
                interest. When both sides match, negotiation begins.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <ClipboardCheck className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">3. Get to Work</CardTitle>
              <CardDescription>
                Confirmed commitments are tracked on both sides. Completed jobs
                build your record on the platform.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <Separator />

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-10 text-center text-2xl font-semibold">
          Who Is This For?
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="flex flex-col">
            <CardHeader>
              <Users className="mb-1 h-7 w-7 text-primary" />
              <CardTitle>Workers</CardTitle>
              <CardDescription>
                Browse available jobs, submit qualification documents, and
                manage your schedule and commitments.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button
                className="w-full"
                onClick={() => navigate("/register/regular")}
              >
                Sign Up as Worker
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <Building2 className="mb-1 h-7 w-7 text-primary" />
              <CardTitle>Businesses</CardTitle>
              <CardDescription>
                Post job openings, search qualified candidates, and manage your
                temporary workforce in one place.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate("/register/business")}
              >
                Sign Up as Business
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <ShieldCheck className="mb-1 h-7 w-7 text-primary" />
              <CardTitle>Administrators</CardTitle>
              <CardDescription>
                Verify businesses, review qualification requests, manage
                position types, and configure system settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button
                className="w-full"
                variant="ghost"
                onClick={() => navigate("/login")}
              >
                Admin Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Businesses CTA */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="mb-1 text-2xl font-semibold">
              Browse Our Businesses
            </h2>
            <p className="text-muted-foreground">
              See verified businesses already using the platform.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/businesses")}>
            View Businesses <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  )
}