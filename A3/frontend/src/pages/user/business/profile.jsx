import { z } from "zod"
import { Profile } from "@/components/profile"

const businessFields = [
  { label: "Business Name", id: "business_name" },
  { label: "Owner Name", id: "owner_name" },
  { label: "Email", id: "email", type: "email", readOnly: true },
  { label: "Phone Number", id: "phone_number" },
  { label: "Postal Address", id: "postal_address" },
  { label: "Latitude", id: "location.lat", type: "number" },
  { label: "Longitude", id: "location.lon", type: "number" },
  { label: "Biography", id: "biography", type: "textarea", rows: 6 },
]

const nullableFloat = z.preprocess((value) => {
  if (value === "" || value == null) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? value : parsed
}, z.number().nullable())

const businessProfileSchema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  owner_name: z.string().min(1, "Owner name is required"),
  email: z.string().email("Invalid email"),
  phone_number: z.string().optional(),
  postal_address: z.string().optional(),
  ["location.lat"]: nullableFloat.optional(),
  ["location.lon"]: nullableFloat.optional(),
  biography: z.string().optional(),
})

export const BusinessProfile = () => {
  return (
    <Profile fields={businessFields} profileSchema={businessProfileSchema} />
  )
}