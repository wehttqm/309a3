import { useAuth } from "@/context/auth-context"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export const CommonProfile = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user || !user.role) {
      navigate("/login", { replace: true })
      return
    }

    if (user.role === "regular") {
      navigate("/profile/regular", { replace: true })
    } else if (user.role === "business") {
      navigate("/profile/business", { replace: true })
    } else if (user.role === "admin") {
      navigate("/profile/admin", { replace: true })
    }
  }, [user, navigate])

  return null
}