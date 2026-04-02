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
import { ProtectedRoute } from "./components/protected-route"

import { RegularProfile } from "@/pages/user/regular/profile"
import { BusinessProfile } from "@/pages/user/business/profile"
import { AdminProfile } from "@/pages/user/admin/profile"

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

            <Route element={<ProtectedRoute />} allowedRoles={["regular"]}>
              <Route path="/profile/regular" element={<RegularProfile />} />
            </Route>

            <Route element={<ProtectedRoute />} allowedRoles={["business"]}>
              <Route path="/profile/business" element={<BusinessProfile />} />
            </Route>

            <Route element={<ProtectedRoute />} allowedRoles={["admin"]}>
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
