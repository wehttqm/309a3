import { useAuth } from "@/context/auth-context"

export const BusinessProfile = () => {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Business Profile</h1>
      <div className="mt-6 rounded-lg border bg-card p-6 text-base">
        <p><span className="font-medium">Business:</span> {user?.name || "-"}</p>
        <p><span className="font-medium">Email:</span> {user?.email || "-"}</p>
        <p><span className="font-medium">Role:</span> {user?.role || "-"}</p>
      </div>
    </div>
  )
}
