import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router"

import "./index.css"
import { Landing } from "@/pages/public/landing.jsx"
import Layout from "@/layouts/layout"
import { AuthProvider } from "@/context/auth-context.jsx"
import { RegularRegister } from "./pages/user/regular/register"
import { BusinessRegister } from "./pages/user/business/register"
import { Login } from "./pages/auth/login"

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
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
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
