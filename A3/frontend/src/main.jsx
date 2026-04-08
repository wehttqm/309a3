import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router-dom"

import { AuthProvider } from "@/context/auth-context.jsx"
import Layout from "@/layouts/layout"
import { Businesses } from "@/pages/public/businesses.jsx"
import { Landing } from "@/pages/public/landing.tsx"
import { ProtectedRoute } from "./components/protected-route"
import "./index.css"
import { Login } from "./pages/auth/login"
import { ActivateAccountPage } from "./pages/auth/activate-account"
import { RequestPasswordResetPage } from "./pages/auth/request-password-reset"
import { ResetPasswordPage } from "./pages/auth/reset-password"
import { BusinessRegister } from "./pages/user/business/register"
import { CommonJobs } from "./pages/user/common/jobs"
import { CommonProfile } from "./pages/user/common/profile"
import { RegularRegister } from "./pages/user/regular/register"

import { AdminBusinessesPage } from "@/pages/user/admin/businesses"
import { AdminProfile } from "@/pages/user/admin/profile"

import { AdminUsersPage } from "@/pages/user/admin/users"
import { BusinessJobs } from "@/pages/user/business/jobs"
import { AdminPositionTypesPage } from "@/pages/user/admin/position-types"
import { AdminQualificationsPage } from "@/pages/user/admin/qualifications"
import { AdminSystemConfigPage } from "@/pages/user/admin/system-config"
import { BusinessJobsCreate } from "@/pages/user/business/jobs-create"
import { BusinessProfile } from "@/pages/user/business/profile"
import { RegularInterests } from "@/pages/user/regular/interests"
import { RegularInvitations } from "@/pages/user/regular/invitations"
import { RegularMyJobsPage } from "@/pages/user/regular/my-jobs"
import { RegularQualificationsPage } from "@/pages/user/regular/qualifications"
import { QualificationDetailsPage } from "@/pages/user/common/qualification-details"
import { RegularJobs } from "@/pages/user/regular/jobs"
import { RegularProfile } from "@/pages/user/regular/profile"
import ResumeUpload from "./pages/user/regular/resume-upload"

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
            <Route path="/businesses" element={<Businesses />} />
            <Route path="/jobs" element={<CommonJobs />} />

            <Route element={<ProtectedRoute />}><Route path="/qualifications/:qualificationId" element={<QualificationDetailsPage />} /></Route>

            <Route element={<ProtectedRoute allowedRoles={["regular"]} />}>
              <Route path="/profile/regular" element={<RegularProfile />} />
              <Route path="/jobs/browse" element={<RegularJobs />} />
              <Route path="/my/interests" element={<RegularInterests />} />
              <Route path="/my/invitations" element={<RegularInvitations />} />
              <Route path="/my/jobs" element={<RegularMyJobsPage />} />
              <Route path="/my/qualifications" element={<RegularQualificationsPage />} />
              <Route path="/resume" element={<ResumeUpload/>} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["business"]} />}>
              <Route path="/profile/business" element={<BusinessProfile />} />
              <Route path="/business/jobs" element={<BusinessJobs />} />
              <Route path="/business/jobs/create" element={<BusinessJobsCreate />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/profile/admin" element={<AdminProfile />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/businesses" element={<AdminBusinessesPage />} />
              <Route path="/admin/positions" element={<AdminPositionTypesPage />} />
              <Route path="/admin/qualifications" element={<AdminQualificationsPage />} />
              <Route path="/admin/config" element={<AdminSystemConfigPage />} />
            </Route>
          </Route>
          <Route path="/register/regular" element={<RegularRegister />} />
          <Route path="/register/business" element={<BusinessRegister />} />
          <Route path="/login" element={<Login />} />
          <Route path="/activate-account" element={<ActivateAccountPage />} />
          <Route path="/forgot-password" element={<RequestPasswordResetPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)