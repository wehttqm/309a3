import { z } from "zod"
import { Profile } from "@/components/profile"

const businessFields = [{ label: "Email", id: "email", type: "email" }]

const businessProfileSchema = z.object({
  email: z.email("Invalid email"),
})

export const BusinessProfile = () => {
  return (
    <Profile fields={businessFields} profileSchema={businessProfileSchema} />
  )
}
