import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/auth-context"
import { useSocket } from "@/context/socket-context"
import { getUserDisplayName } from "@/lib/user-status"
import { Bell, BellRing, ChevronDown } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

function NegotiationLink({ hasActiveNegotiation, onClick, label = "Negotiation" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 transition-colors hover:text-foreground ${hasActiveNegotiation ? "text-primary" : ""}`}
    >
      {hasActiveNegotiation ? <BellRing className="h-4 w-4 animate-bounce" /> : null}
      <span>{label}</span>
      {hasActiveNegotiation ? <span className="inline-flex h-2 w-2 rounded-full bg-primary animate-pulse" /> : null}
    </button>
  )
}

export default function Navbar() {
  const { user, logout, isLoading } = useAuth()
  const { notifications, unreadCount, openNegotiation, hasActiveNegotiation } = useSocket()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const handleNotificationOpen = (item) => {
    if (item?.negotiation_id) {
      navigate("/negotiations")
      openNegotiation()
      return
    }

    navigate(item?.href || "/notifications")
  }

  const displayName = getUserDisplayName(user)
  const showRealtimeLinks = user?.role === "regular" || user?.role === "business"
  const recentNotifications = notifications.slice(0, 5)

  return (
    <div className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 px-0">
      <nav className="flex items-center justify-between rounded-full border border-blue-100/60 bg-white/75 px-6 py-2.5 shadow-sm backdrop-blur-md">
        <button
          onClick={() => navigate("/")}
          className="flex cursor-pointer items-center gap-2 text-sm text-foreground transition-colors hover:text-foreground"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="shrink-0"
          >
            <defs>
              <linearGradient id="dentallink-logo" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2563eb" />
                <stop offset="1" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
            <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#dentallink-logo)" />
            <path
              d="M23.91 15.38C19.72 15.38 16.25 18.56 16.25 23.54c0 3.71 1.57 6.18 3.11 8.56 1.4 2.19 2.73 4.26 2.73 6.95 0 4.92 2.91 9.56 6.82 9.56 2.32 0 3.31-1.81 3.91-3.82.65-2.17 1.01-4.52 2.68-4.52s2.03 2.35 2.68 4.52c.6 2.01 1.59 3.82 3.91 3.82 3.91 0 6.82-4.64 6.82-9.56 0-2.69 1.33-4.76 2.73-6.95 1.54-2.38 3.11-4.85 3.11-8.56 0-4.98-3.47-8.16-7.66-8.16-2.31 0-4.62.79-6.94 2.38-2.31-1.59-4.62-2.38-6.94-2.38Z"
              fill="white"
            />
          </svg>
          DentalLink
        </button>

        <div className="hidden items-center gap-4 text-sm text-foreground md:flex">
          {user?.role === "regular" && (
            <>
              <Link to="/" className="transition-colors hover:text-foreground">
                Dashboard
              </Link>
              <Link to="/jobs" className="transition-colors hover:text-foreground">
                Jobs
              </Link>
              <Link to="/my/qualifications" className="transition-colors hover:text-foreground">
                Qualifications
              </Link>
              <Link to="/my/jobs" className="transition-colors hover:text-foreground">
                My Jobs
              </Link>
            </>
          )}

          {user?.role === "business" && (
            <>
              <Link to="/" className="transition-colors hover:text-foreground">
                Dashboard
              </Link>
              <Link to="/business/jobs" className="transition-colors hover:text-foreground">
                My Postings
              </Link>
              </>
          )}

          {showRealtimeLinks ? (
            <NegotiationLink hasActiveNegotiation={hasActiveNegotiation} onClick={() => navigate("/negotiations")} label="Negotiations" />
          ) : null}

          {user?.role === "admin" && (
            <>
              <Link to="/admin/users" className="transition-colors hover:text-foreground">
                Users
              </Link>
              <Link to="/admin/businesses" className="transition-colors hover:text-foreground">
                Businesses
              </Link>
              <Link to="/admin/positions" className="transition-colors hover:text-foreground">
                Positions
              </Link>
              <Link to="/admin/qualifications" className="transition-colors hover:text-foreground">
                Qualifications
              </Link>
              <Link to="/admin/config" className="transition-colors hover:text-foreground">
                Config
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/businesses")}>
            Businesses Directory
          </Button>

          {showRealtimeLinks ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  {hasActiveNegotiation ? <BellRing className="h-4 w-4 animate-bounce" /> : <Bell className="h-4 w-4" />}
                  {unreadCount > 0 ? (
                    <span className="absolute top-1 right-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between gap-3">
                  <span>Notifications</span>
                  <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={() => navigate("/notifications")}>
                    View all
                  </Button>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {recentNotifications.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground">No notifications yet.</div>
                ) : (
                  recentNotifications.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      className="flex cursor-pointer flex-col items-start gap-1 whitespace-normal py-3"
                      onClick={() => handleNotificationOpen(item)}
                    >
                      <div className="flex w-full items-start justify-between gap-3">
                        <span className="font-medium text-foreground">{item.title}</span>
                        {!item.read ? <span className="mt-1 h-2 w-2 rounded-full bg-primary" /> : null}
                      </div>
                      <span className="text-xs text-muted-foreground">{item.message}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          {!user && !isLoading ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                Log In
              </Button>
              <Button size="sm" onClick={() => navigate("/register/regular")}>
                Sign Up
              </Button>
            </>
          ) : null}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <UserAvatar user={user} className="h-7 w-7" fallbackClassName="text-xs" />
                  <span className="hidden max-w-[140px] truncate text-sm md:inline">{displayName}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs font-normal text-foreground">
                  Signed in as <span className="font-medium text-foreground">{user.role}</span>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {user.role === "regular" && (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/profile")}>My Profile</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/resume")}>Upload Resume</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/notifications")}>Notifications</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/negotiations")}>
                      <div className="flex items-center gap-2">
                        {hasActiveNegotiation ? <BellRing className="h-4 w-4 animate-bounce" /> : null}
                        <span>Negotiations</span>
                      </div>
                    </DropdownMenuItem>
                  </>
                )}

                {user.role === "business" && (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/profile/business")}>Business Profile</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/notifications")}>Notifications</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/negotiations")}>
                      <div className="flex items-center gap-2">
                        {hasActiveNegotiation ? <BellRing className="h-4 w-4 animate-bounce" /> : null}
                        <span>Negotiations</span>
                      </div>
                    </DropdownMenuItem>
                  </>
                )}

                {user.role === "admin" && (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/profile/admin")}>Admin Profile</DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </nav>
    </div>
  )
}
