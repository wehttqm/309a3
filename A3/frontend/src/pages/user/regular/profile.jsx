import { z } from "zod"
import { Profile } from "@/components/profile"

export const regularFields = [
  { label: "First Name", id: "first_name" },
  { label: "Last Name", id: "last_name" },
  { label: "Email", id: "email", type: "email" },
  { label: "Phone", id: "phone_number" },
  { label: "Address", id: "postal_address" },
  { label: "Birthday", id: "birthday", type: "date" },
  { label: "Biography", id: "biography" },
]

export const regularProfileSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  email: z.email("Invalid email"),
  phone_number: z.string().min(10, "Phone number must be 10 digits long"),
  postal_address: z.string().optional(),
  birthday: z.string().optional(),
  biography: z.string().max(500, "Max 500 chars").optional(),
})

export const RegularProfile = () => {
  return <Profile fields={regularFields} profileSchema={regularProfileSchema} />
}
