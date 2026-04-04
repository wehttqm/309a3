import { z } from "zod"
import { Profile } from "@/components/profile"

const adminFields = [{ label: "Email", id: "email", type: "email", readOnly: true }]

const adminProfileSchema = z.object({
  email: z.string().email("Invalid email"),
})

export const AdminProfile = () => {
  return <Profile fields={adminFields} profileSchema={adminProfileSchema} />
}