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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl px-0">
      <nav className="flex items-center justify-between rounded-full border border-blue-100/60 bg-white/75 px-6 py-2.5 shadow-sm backdrop-blur-md">

        {/* Left: Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center cursor-pointer gap-2 text-sm text-foreground transition-colors hover:text-foreground"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="5.5" cy="9" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12.5" cy="9" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          StaffLink
        </button>

        {/* Middle: Role-based links */}
        <div className="hidden items-center gap-4 text-sm text-foreground md:flex">
          {user?.role === "regular" && (
            <>
              <Link to="/jobs" className="transition-colors hover:text-foreground">Jobs</Link>
              <Link to="/my/qualifications" className="transition-colors hover:text-foreground">Qualifications</Link>
              <Link to="/my/interests" className="transition-colors hover:text-foreground">Interests</Link>
              <Link to="/my/invitations" className="transition-colors hover:text-foreground">Invitations</Link>
              <Link to="/my/jobs" className="transition-colors hover:text-foreground">My Jobs</Link>
            </>
          )}

          {user?.role === "business" && (
            <>
              <Link to="/business/jobs" className="transition-colors hover:text-foreground">My Postings</Link>
              <Link to="/business/jobs/create" className="transition-colors hover:text-foreground">Post a Job</Link>
            </>
          )}

          {user?.role === "admin" && (
            <>
              <Link to="/admin/users" className="transition-colors hover:text-foreground">Users</Link>
              <Link to="/admin/businesses" className="transition-colors hover:text-foreground">Businesses</Link>
              <Link to="/admin/positions" className="transition-colors hover:text-foreground">Positions</Link>
              <Link to="/admin/qualifications" className="transition-colors hover:text-foreground">Qualifications</Link>
              <Link to="/admin/config" className="transition-colors hover:text-foreground">Config</Link>
            </>
          )}
        </div>

        {/* Right: Auth + Businesses */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/businesses")}>
            Businesses
          </Button>

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
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm md:inline">{user.name}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs font-normal text-foreground">
                  Signed in as{" "}
                  <span className="font-medium text-foreground">{user.role}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === "regular" && (
                  <DropdownMenuItem onClick={() => navigate("/profile")}>My Profile</DropdownMenuItem>
                )}
                {user.role === "business" && (
                  <DropdownMenuItem onClick={() => navigate("/profile/business")}>Business Profile</DropdownMenuItem>
                )}
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => navigate("/profile/admin")}>Admin Profile</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
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