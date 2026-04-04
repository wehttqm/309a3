import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  ChevronDown,
  ClipboardCheck,
  Users
} from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

const steps = [
  {
    num: "01",
    title: "Create an Account",
    desc: "Sign up as a worker or business and complete your profile.",
    detail:
      "Workers fill out their profile, upload a resume, and submit qualification documents. Businesses register their organization and go through a quick verification process before they can post jobs. The whole thing takes under five minutes.",
  },
  {
    num: "02",
    title: "Match & Negotiate",
    desc: "Express interest, get invited, and negotiate terms when both sides align.",
    detail:
      "Workers browse open positions and express interest. Businesses can also proactively invite qualified candidates. When both sides show mutual interest, a negotiation window opens to agree on pay, hours, and start date before any commitment is made.",
  },
  {
    num: "03",
    title: "Get to Work",
    desc: "Track commitments on both sides and build your record.",
    detail:
      "Once terms are agreed, the job is confirmed and tracked on both dashboards. Workers show up, businesses confirm attendance, and completed jobs build a verifiable history on the platform — making future matches faster and more trustworthy.",
  },
]

function HowItWorksAccordion() {
  const [open, setOpen] = useState(null)

  return (
    <div className="flex flex-col divide-y divide-border">
      {steps.map(({ num, title, desc, detail }) => {
        const isOpen = open === num
        return (
          <div key={num}>
            <button
              className="flex w-full items-center gap-8 py-8 text-left"
              onClick={() => setOpen(isOpen ? null : num)}
            >
              <span className="w-12 shrink-0 text-3xl font-bold tracking-tight text-foreground/60">
                {num}
              </span>
              <div className="flex-1">
                <p className="mb-1 text-base font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <p className="pb-8 pl-20 pr-8 text-sm text-muted-foreground leading-relaxed">
                {detail}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

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
                  Review your worker information and keep your account details
                  up to date.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button className="w-full" onClick={() => navigate("/profile")}>
                  Go to Profile <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ClipboardCheck className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>What you can do next</CardTitle>
                <CardDescription>
                  As more worker routes are added, this homepage can surface
                  jobs, qualifications, invitations, and active work items.
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
                  Review your business details and keep your organization
                  profile current.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button className="w-full" onClick={() => navigate("/profile")}>
                  Go to Business Profile <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Briefcase className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>What you can do next</CardTitle>
                <CardDescription>
                  Once business routes are mounted, this homepage can also
                  surface job postings, candidate discovery, and negotiation
                  activity.
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
            Your admin session is active. Use the admin workspace to manage users and businesses.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => navigate("/admin/users")}>Manage Users</Button>
            <Button variant="outline" onClick={() => navigate("/admin/businesses")}>Manage Businesses</Button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground">
      <section className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden px-6 pt-[17vh] text-center">
        {/* Blue radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 38%, oklch(0.88 0.07 240) 0%, oklch(0.96 0.03 240) 40%, transparent 72%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-3xl">
          <h1 className="mb-4 text-6xl font-bold tracking-tight">
            Connect Businesses with Qualified Workers
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Post jobs, verify qualifications, and manage staffing — start to finish.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate("/register/regular")}
              className="group"
            >
              Join as Worker{" "}
              <ArrowUpRight className="ml-2 h-4 w-4 transition-transform duration-200 rotate-45 group-hover:rotate-0" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => navigate("/register/business")}
            >
              Join as Business
            </Button>
          </div>

          {/* Testimonial bar */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="flex items-center">
              {[
                "https://randomuser.me/api/portraits/women/44.jpg",
                "https://randomuser.me/api/portraits/men/32.jpg",
                "https://randomuser.me/api/portraits/women/68.jpg",
              ].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="h-9 w-9 rounded-full border-2 border-background object-cover"
                  style={{ marginLeft: i === 0 ? 0 : "-10px" }}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Trusted by <span className="font-semibold text-foreground">10,000+</span> businesses to find reliable staff
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-1 text-center text-3xl font-semibold tracking-tight">
          Here's how we make it easy
        </h2>
        <p className="mb-12 text-center text-sm text-muted-foreground">
          From signup to your first shift — a simple three-step process.
        </p>
        <HowItWorksAccordion />
      </section>

      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-xl">Looking for work?</CardTitle>
              <CardDescription>
                Browse open shifts, get matched with businesses, and start building your record.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="group"
                onClick={() => navigate("/register/regular")}
              >
                Find your next shift{" "}
                <ArrowUpRight className="ml-2 h-4 w-4 transition-transform duration-200 rotate-45 group-hover:rotate-0" />
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-xl">Need to hire?</CardTitle>
              <CardDescription>
                Post a job, browse qualified candidates, and fill your roster faster than traditional hiring.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => navigate("/register/business")}
              >
                Post your first job <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="mb-1 text-2xl font-semibold tracking-tight">
              Browse Our Businesses
            </h2>
            <p className="text-muted-foreground">
              See verified businesses already using the platform.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/businesses")}>
            View Businesses <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  )
}