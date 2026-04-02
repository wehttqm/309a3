import { z } from "zod"

export const ADMINFIELDS = [
  { label: "First Name", id: "first_name" },
  { label: "Last Name", id: "last_name" },
  { label: "Email", id: "email", type: "email" },
  { label: "Phone", id: "phone_number" },
  { label: "Address", id: "postal_address" },
  { label: "Birthday", id: "birthday", type: "date" },
]

export const adminProfileSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  email: z.email("Invalid email"),
  phone_number: z.string().optional(),
  postal_address: z.string().optional(),
  birthday: z.string().optional(),
  biography: z.string().max(500, "Max 500 chars").optional(),
})
