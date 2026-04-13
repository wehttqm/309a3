import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Bell,
  BellRing,
  Briefcase,
  Building2,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  LogIn,
  Menu,
  Settings2,
  ShieldCheck,
  Upload,
  UserCircle2,
  UserPlus,
  Users,
  X,
} from "lucide-react"

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
import { cn } from "@/lib/utils"
import { getUserDisplayName } from "@/lib/user-status"

function matchesPath(pathname, href, exact = false) {
  if (exact) {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

function isLinkActive(pathname, item) {
  if (item.matchers?.length) {
    return item.matchers.some((matcher) => matcher(pathname))
  }

  return matchesPath(pathname, item.href, item.exact)
}

function NavItem({ item, pathname, onClick, mobile = false }) {
  const active = isLinkActive(pathname, item)
  const Icon = item.icon

  return (
    <Button
      asChild
      variant="ghost"
      size={mobile ? "default" : "sm"}
      title={!mobile ? item.label : undefined}
      className={cn(
        "rounded-full text-sm text-muted-foreground hover:text-foreground",
        mobile ? "w-full justify-start px-3" : "h-9 w-9 justify-center px-0 lg:h-9 lg:w-auto lg:justify-start lg:px-3",
        active && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
      )}
    >
      <Link
        to={item.href}
        aria-current={active ? "page" : undefined}
        aria-label={item.label}
        onClick={onClick}
        className="inline-flex items-center gap-2"
      >
        {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
        <span className={cn(!mobile && "hidden lg:inline")}>{item.label}</span>
      </Link>
    </Button>
  )
}

function NegotiationButton({ pathname, hasActiveNegotiation, onClick, mobile = false }) {
  const active = matchesPath(pathname, "/negotiations")

  return (
    <Button
      type="button"
      variant="ghost"
      size={mobile ? "default" : "sm"}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label="Negotiations"
      title={!mobile ? "Negotiations" : undefined}
      className={cn(
        "rounded-full text-sm text-muted-foreground hover:text-foreground",
        mobile ? "w-full justify-start px-3" : "relative h-9 w-9 justify-center px-0 lg:h-9 lg:w-auto lg:justify-start lg:px-3",
        (active || hasActiveNegotiation) &&
          "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
      )}
    >
      <span className="inline-flex items-center gap-2">
        {hasActiveNegotiation ? <BellRing className="h-4 w-4 animate-bounce" /> : <Handshake className="h-4 w-4 shrink-0" />}
        <span className={cn(!mobile && "hidden lg:inline")}>Negotiations</span>
        {hasActiveNegotiation ? (
          <span className={cn("inline-flex h-2 w-2 rounded-full bg-primary animate-pulse", !mobile && "absolute right-2 top-2 lg:static") } />
        ) : null}
      </span>
    </Button>
  )
}

export default function Navbar() {
  const { user, logout, isLoading } = useAuth()
  const { notifications, unreadCount, openNegotiation, hasActiveNegotiation } = useSocket()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

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

  const navItems = useMemo(() => {
    const shared = [{ href: "/businesses", label: "Businesses", exact: true, icon: Building2 }]

    if (!user) {
      return shared
    }

    if (user.role === "regular") {
      return [
        { href: "/", label: "Dashboard", exact: true, icon: LayoutDashboard },
        {
          href: "/jobs",
          label: "Jobs",
          icon: Briefcase,
          matchers: [(pathname) => pathname === "/jobs" || pathname.startsWith("/jobs/")],
        },
        {
          href: "/my/qualifications",
          label: "Qualifications",
          icon: GraduationCap,
          matchers: [
            (pathname) =>
              pathname === "/my/qualifications" || pathname.startsWith("/qualifications/"),
          ],
        },
        {
          href: "/my/jobs",
          label: "My Jobs",
          icon: ClipboardList,
          matchers: [
            (pathname) =>
              pathname === "/my/jobs" ||
              pathname.startsWith("/my/interests") ||
              pathname.startsWith("/my/invitations"),
          ],
        },
        ...shared,
      ]
    }

    if (user.role === "business") {
      return [
        { href: "/", label: "Dashboard", exact: true, icon: LayoutDashboard },
        { href: "/business/jobs", label: "My Postings", icon: ClipboardList },
        ...shared,
      ]
    }

    if (user.role === "admin") {
      return [
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/businesses", label: "Businesses", icon: Building2 },
        { href: "/admin/positions", label: "Positions", icon: Briefcase },
        { href: "/admin/qualifications", label: "Qualifications", icon: GraduationCap },
        { href: "/admin/config", label: "Config", icon: Settings2 },
        ...shared,
      ]
    }

    return shared
  }, [user])

  return (
    <div className="fixed top-3 left-1/2 z-50 w-[calc(100%-1rem)] max-w-6xl -translate-x-1/2 px-0 sm:top-4 sm:w-[calc(100%-2rem)]">
      <nav className="rounded-3xl border border-blue-100/60 bg-white/85 px-3 py-2 shadow-sm backdrop-blur-md sm:px-4 lg:rounded-full lg:px-6 lg:py-2.5">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-foreground"
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
            <span className="hidden sm:inline">DentalLink</span>
          </button>

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 sm:flex">
            {navItems.map((item) => (
              <NavItem key={item.href} item={item} pathname={location.pathname} />
            ))}
            {showRealtimeLinks ? (
              <NegotiationButton
                pathname={location.pathname}
                hasActiveNegotiation={hasActiveNegotiation}
                onClick={() => navigate("/negotiations")}
              />
            ) : null}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {showRealtimeLinks ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="relative rounded-full" aria-label="Notifications">
                    {hasActiveNegotiation ? <BellRing className="h-4 w-4 animate-bounce" /> : <Bell className="h-4 w-4" />}
                    {unreadCount > 0 ? (
                      <span className="absolute top-1 right-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
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
              <div className="hidden items-center gap-2 sm:flex">
                <Button variant="ghost" size="sm" className={cn("gap-2", matchesPath(location.pathname, "/login", true) && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary")} onClick={() => navigate("/login")}>
                  <LogIn className="h-4 w-4" />
                  <span className="hidden lg:inline">Log In</span>
                </Button>
                <Button size="sm" className="gap-2" onClick={() => navigate("/register/regular")}>
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden lg:inline">Sign Up</span>
                </Button>
              </div>
            ) : null}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 rounded-full px-2 sm:px-3">
                    <UserAvatar user={user} className="h-7 w-7" fallbackClassName="text-xs" />
                    <span className="hidden max-w-[140px] truncate text-sm md:inline">{displayName}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs font-normal text-foreground">
                    Signed in as <span className="font-medium text-foreground">{user.role}</span>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  {user.role === "regular" && (
                    <>
                      <DropdownMenuItem onClick={() => navigate("/profile")}><UserCircle2 className="mr-2 h-4 w-4" />My Profile</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/resume")}><Upload className="mr-2 h-4 w-4" />Upload Resume</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/notifications")}><Bell className="mr-2 h-4 w-4" />Notifications</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/negotiations")}>
                        <div className="flex items-center gap-2">
                          {!hasActiveNegotiation ? <Handshake className="h-4 w-4" /> : null}
                          {hasActiveNegotiation ? <BellRing className="h-4 w-4 animate-bounce" /> : null}
                          <span>Negotiations</span>
                        </div>
                      </DropdownMenuItem>
                    </>
                  )}

                  {user.role === "business" && (
                    <>
                      <DropdownMenuItem onClick={() => navigate("/profile/business")}><Building2 className="mr-2 h-4 w-4" />Business Profile</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/notifications")}><Bell className="mr-2 h-4 w-4" />Notifications</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/negotiations")}>
                        <div className="flex items-center gap-2">
                          {!hasActiveNegotiation ? <Handshake className="h-4 w-4" /> : null}
                          {hasActiveNegotiation ? <BellRing className="h-4 w-4 animate-bounce" /> : null}
                          <span>Negotiations</span>
                        </div>
                      </DropdownMenuItem>
                    </>
                  )}

                  {user.role === "admin" && <DropdownMenuItem onClick={() => navigate("/profile/admin")}><ShieldCheck className="mr-2 h-4 w-4" />Admin Profile</DropdownMenuItem>}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}><LogIn className="mr-2 h-4 w-4 rotate-180" />Log Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full sm:hidden"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <div className="border-t border-border/60 pt-3 mt-3 sm:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavItem key={item.href} item={item} pathname={location.pathname} mobile onClick={() => setIsMobileMenuOpen(false)} />
              ))}
              {showRealtimeLinks ? (
                <NegotiationButton
                  pathname={location.pathname}
                  hasActiveNegotiation={hasActiveNegotiation}
                  mobile
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    navigate("/negotiations")
                  }}
                />
              ) : null}

              {!user && !isLoading ? (
                <>
                  <Button variant="ghost" className="justify-start rounded-full gap-2" onClick={() => navigate("/login")}>
                    <LogIn className="h-4 w-4" />
                    Log In
                  </Button>
                  <Button className="justify-start rounded-full gap-2" onClick={() => navigate("/register/regular")}>
                    <UserPlus className="h-4 w-4" />
                    Sign Up
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </nav>
    </div>
  )
}
