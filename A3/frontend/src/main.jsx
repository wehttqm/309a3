import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router-dom"

import "./index.css"
import { Landing } from "@/pages/public/landing.jsx"
import Layout from "@/layouts/layout"
import { ApiProvider } from "@/context/api-context.jsx"
import { AuthProvider } from "@/context/auth-context.jsx"
import { RegularRegister } from "./pages/user/regular/register"
import { BusinessRegister } from "./pages/user/business/register"
import { Login } from "./pages/auth/login"
import { RegularProfile } from "./pages/user/regular/profile"
import { BusinessProfile } from "./pages/user/business/profile"
import { ProtectedRoute } from "./components/protected-route.jsx"

const NotFound = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center text-2xl">
      404
    </div>
  )
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ApiProvider>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Landing />} />

              <Route element={<ProtectedRoute allowedRoles={["regular"]} />}>
                <Route path="/profile" element={<RegularProfile />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["business"]} />}>
                <Route path="/business/profile" element={<BusinessProfile />} />
              </Route>
            </Route>

            <Route path="/register/regular" element={<RegularRegister />} />
            <Route path="/register/business" element={<BusinessRegister />} />
            <Route path="/login" element={<Login />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ApiProvider>
    </BrowserRouter>
  </StrictMode>
)