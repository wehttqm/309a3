import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router"

import "./index.css"
import { Landing } from "@/pages/public/landing.jsx"
import Layout from "@/layouts/layout"
import { AuthProvider } from "@/context/auth-context.jsx"
import { ApiProvider } from "@/context/api-context.jsx"
import { RegularRegister } from "./pages/user/regular/register"
import { BusinessRegister } from "./pages/user/business/register"
import { Login } from "./pages/auth/login"
import { Profile } from "./pages/user/common/profile"

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
      <ApiProvider>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Landing />} />

              {/* Common user */}
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Auth routes */}
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
