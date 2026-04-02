import { z } from "zod"

export const BUSINESSFIELDS = [{ label: "Email", id: "email", type: "email" }]

export const businessProfileSchema = z.object({
  email: z.email("Invalid email"),
})
