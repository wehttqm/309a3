import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Briefcase, ChevronDown } from "lucide-react"

export default function Navbar() {
  const { user, logout } = useAuth()
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
    <nav className="flex items-center justify-between border-b bg-background px-6 py-3">
      {/* Left: Logo */}
      <Link to="/" className="flex items-center gap-2 text-base font-semibold">
        <Briefcase className="h-5 w-5 text-primary" />
        StaffingPlatform
      </Link>

      {/* Middle: Public links */}
      <div className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
        <Link
          to="/businesses"
          className="transition-colors hover:text-foreground"
        >
          Businesses
        </Link>

        {/* Worker links */}
        {user?.role === "regular" && (
          <>
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
              to="/my/interests"
              className="transition-colors hover:text-foreground"
            >
              Interests
            </Link>
            <Link
              to="/my/invitations"
              className="transition-colors hover:text-foreground"
            >
              Invitations
            </Link>
            <Link
              to="/my/jobs"
              className="transition-colors hover:text-foreground"
            >
              My Jobs
            </Link>
          </>
        )}

        {/* Business links */}
        {user?.role === "business" && (
          <>
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

        {/* Admin links */}
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

      {/* Right: Auth */}
      <div className="flex items-center gap-2">
        {!user ? (
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
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm md:inline">{user.name}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Signed in as{" "}
                <span className="font-medium text-foreground">{user.role}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {user.role === "regular" && (
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  My Profile
                </DropdownMenuItem>
              )}
              {user.role === "business" && (
                <DropdownMenuItem onClick={() => navigate("/business/profile")}>
                  Business Profile
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
        )}
      </div>
    </nav>
  )
}
