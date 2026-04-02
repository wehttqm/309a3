import { Outlet } from "react-router"

export default function Layout() {
  return (
    <div className="h-screen w-full p-1 text-xl">
      <Outlet />
    </div>
  )
}
