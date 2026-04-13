import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/context/auth-context"
import { LoadingState } from "@/components/ui/loading-state"

export function ProtectedRoute({ allowedRoles = [] }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <LoadingState
          title="Checking your session"
          description="We are confirming your account and preparing the right workspace for this page."
          compact
        />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
