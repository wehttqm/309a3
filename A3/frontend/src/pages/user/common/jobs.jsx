import { useAuth } from "@/context/auth-context"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export const CommonJobs = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user?.role) {
      navigate("/login")
      return
    }

    if (user.role === "regular") {
      navigate("/jobs/browse", { replace: true })
      return
    }

    if (user.role === "business") {
      navigate("/business/jobs", { replace: true })
      return
    }

    navigate("/", { replace: true })
  }, [user, navigate])

  return null
}
