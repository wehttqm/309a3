import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router-dom"

import "./index.css"
import { Landing } from "@/pages/public/landing.jsx"
import Layout from "@/layouts/layout"
import { AuthProvider } from "@/context/auth-context.jsx"
import { RegularRegister } from "./pages/user/regular/register"
import { BusinessRegister } from "./pages/user/business/register"
import { Login } from "./pages/auth/login"
import { CommonProfile } from "./pages/user/common/profile"
import { CommonJobs } from "./pages/user/common/jobs"
import { ProtectedRoute } from "./components/protected-route"

import { RegularProfile } from "@/pages/user/regular/profile"
import { BusinessProfile } from "@/pages/user/business/profile"
import { AdminProfile } from "@/pages/user/admin/profile"
import { RegularJobs } from "@/pages/user/regular/jobs"
import { RegularInterests } from "@/pages/user/regular/interests"
import { RegularInvitations } from "@/pages/user/regular/invitations"
import { BusinessJobs } from "@/pages/user/business/jobs"
import { BusinessJobsCreate } from "@/pages/user/business/jobs-create"

const NotFound = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center text-2xl">
      404 Not Found
    </div>
  )
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />

            <Route path="/profile" element={<CommonProfile />} />
            <Route path="/jobs" element={<CommonJobs />} />

            <Route element={<ProtectedRoute allowedRoles={["regular"]} />}>
              <Route path="/profile/regular" element={<RegularProfile />} />
              <Route path="/jobs/browse" element={<RegularJobs />} />
              <Route path="/my/interests" element={<RegularInterests />} />
              <Route path="/my/invitations" element={<RegularInvitations />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["business"]} />}>
              <Route path="/profile/business" element={<BusinessProfile />} />
              <Route path="/business/jobs" element={<BusinessJobs />} />
              <Route path="/business/jobs/create" element={<BusinessJobsCreate />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/profile/admin" element={<AdminProfile />} />
            </Route>
          </Route>

          <Route path="/register/regular" element={<RegularRegister />} />
          <Route path="/register/business" element={<BusinessRegister />} />
          <Route path="/login" element={<Login />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
