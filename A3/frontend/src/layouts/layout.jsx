import Navbar from "@/components/navbar"
import { Outlet } from "react-router-dom"

export default function Layout() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        CSC309 Winter 2026 - Assignment 3
      </footer>
    </div>
  )
}
