import { useAuth } from "@/context/auth-context"
import { useEffect } from "react"
import { useNavigate } from "react-router"

export const CommonProfile = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user || !user.role) {
      navigate("/login")
      return
    }
    if (user.role === "regular") {
      navigate("/profile/regular")
    } else if (user.role === "business") {
      navigate("/profile/business")
    } else if (user.role === "admin") {
      navigate("/profile/admin")
    }
  }, [])
}
