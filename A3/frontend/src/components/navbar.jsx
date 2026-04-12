import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { ChevronDown } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

export default function Navbar() {
  const { user, logout, isLoading } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  return (
    <div className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 px-0">
      <nav className="flex items-center justify-between rounded-full border border-blue-100/60 bg-white/75 px-6 py-2.5 shadow-sm backdrop-blur-md">
        {/* Left: Logo */}
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

        {/* Middle: Role-based links */}
        <div className="hidden items-center gap-4 text-sm text-foreground md:flex">
          {user?.role === "regular" && (
            <>
              <Link
                to="/"
                className="transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                to="/jobs"
                className="transition-colors hover:text-foreground"
              >
                Jobs
              </Link>
              <Link
                to="/my/qualifications"
                className="transition-colors hover:text-foreground"
              >
                Qualifications
              </Link>
              <Link
                to="/my/jobs"
                className="transition-colors hover:text-foreground"
              >
                My Jobs
              </Link>
            </>
          )}

          {user?.role === "business" && (
            <>
              <Link
                to="/"
                className="transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                to="/business/jobs"
                className="transition-colors hover:text-foreground"
              >
                My Postings
              </Link>
              <Link
                to="/business/jobs/create"
                className="transition-colors hover:text-foreground"
              >
                Post a Job
              </Link>
            </>
          )}

          {user?.role === "admin" && (
            <>
              <Link
                to="/admin/users"
                className="transition-colors hover:text-foreground"
              >
                Users
              </Link>
              <Link
                to="/admin/businesses"
                className="transition-colors hover:text-foreground"
              >
                Businesses
              </Link>
              <Link
                to="/admin/positions"
                className="transition-colors hover:text-foreground"
              >
                Positions
              </Link>
              <Link
                to="/admin/qualifications"
                className="transition-colors hover:text-foreground"
              >
                Qualifications
              </Link>
              <Link
                to="/admin/config"
                className="transition-colors hover:text-foreground"
              >
                Config
              </Link>
            </>
          )}
        </div>

        {/* Right: Auth + Businesses */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/businesses")}
          >
            Businesses Directory
          </Button>

          {!user && !isLoading ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
              >
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback className="text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm md:inline">{user.name}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs font-normal text-foreground">
                  Signed in as{" "}
                  <span className="font-medium text-foreground">
                    {user.role}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === "regular" && (
                  <div>
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      My Profile
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => navigate("/resume")}>
                      Upload Resume
                    </DropdownMenuItem>
                  </div>
                )}
                {user.role === "business" && (
                  <DropdownMenuItem
                    onClick={() => navigate("/profile/business")}
                  >
                    Business Profile
                  </DropdownMenuItem>
                )}
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => navigate("/profile/admin")}>
                    Admin Profile
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive"
                >
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </nav>
    </div>
  )
}
