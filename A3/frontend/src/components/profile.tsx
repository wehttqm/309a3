import { useState, useEffect, useMemo, useRef } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/context/auth-context.jsx"
import { apiClient } from "@/lib/api/client"

// UI Components
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RoleBadge } from "@/components/role-badge.tsx"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

// Icons
import { Pencil, Check, X, Camera, Upload } from "lucide-react"
import { toast } from "sonner"

function getNestedValue(obj: any, path: string) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj)
}

export function Profile({
  fields,
  profileSchema,
}: {
  fields: Array<any>
  profileSchema: z.ZodObject<any>
}) {
  const { user, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  // Avatar dialog state
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  type ProfileFormValues = z.infer<typeof profileSchema>

  const dynamicDefaults = useMemo(
    () =>
      fields.reduce((acc: any, field: any) => {
        acc[field.id] = getNestedValue(user, field.id) ?? ""
        return acc
      }, {}),
    [fields, user]
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: dynamicDefaults,
  })

  useEffect(() => {
    if (user) reset(dynamicDefaults)
  }, [user, reset, dynamicDefaults])

  // Cleanup blob URL on unmount or file change
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return
    setIsSaving(true)
    setError("")

    try {
      if (user.role === "regular") {
        await apiClient.patchUsersMe({
          body: {
            first_name: (data as any).first_name,
            last_name: (data as any).last_name,
            phone_number: (data as any).phone_number,
            postal_address: (data as any).postal_address,
            birthday: (data as any).birthday,
            biography: (data as any).biography,
          },
        })
      } else if (user.role === "business") {
        const latValue = data.location?.lat ?? null
        const lonValue = data.location?.lon ?? null
        const payload: any = {
          business_name: data.business_name,
          owner_name: data.owner_name,
          phone_number: data.phone_number,
          postal_address: data.postal_address,
          biography: data.biography,
          location: {
            lat: latValue === "" ? null : latValue,
            lon: lonValue === "" ? null : lonValue,
          },
        }
        await apiClient.patchBusinessesMe({ body: payload })
      }

      await refreshUser()
      toast.success("Profile updated.")
      setIsEditing(false)
    } catch (err: any) {
      setError(err?.message || "Failed to update profile.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    setAvatarError(null)
    if (!selected) return

    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      setAvatarError("Only JPG, PNG, or WEBP images are accepted.")
      return
    }
    if (selected.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be under 5MB.")
      return
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(selected)
    setAvatarPreview(URL.createObjectURL(selected))
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return
    setAvatarUploading(true)
    setAvatarError(null)

    try {
      await apiClient.putUsersMeAvatar({
        body: {
          file: avatarFile,
        },
      })
      window.location.reload()
    } catch (err: any) {
      setAvatarError(err?.message ?? "Upload failed.")
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleAvatarDialogClose = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(null)
    setAvatarPreview(null)
    setAvatarError(null)
    setAvatarDialogOpen(false)
  }

  const displayName =
    user?.role === "business"
      ? user?.business_name || user?.owner_name || user?.email || "Business"
      : [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
        user?.email ||
        "?"

  const initials = displayName
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  if (!user || !user.role) {
    return (
      <div className="mt-20 flex items-center justify-center">
        No user found! Are you logged in?
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-200 space-y-8 px-6 py-10">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-8 flex items-center justify-between border-b pb-6">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    reset(dynamicDefaults)
                    setError("")
                    setIsEditing(false)
                  }}
                >
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  <Check className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
            )}
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="mb-8 flex flex-col items-center gap-y-4">
          {/* Clickable avatar */}
          <button
            type="button"
            className="group relative h-32 w-32 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setAvatarDialogOpen(true)}
            title="Change avatar"
          >
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-muted text-3xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-7 w-7 text-white" />
            </div>
          </button>

          <h2 className="text-4xl font-extrabold">{displayName}</h2>
          <RoleBadge role={user?.role} />
        </div>

        <Card className="overflow-hidden">
          <CardContent className="divide-y p-0">
            {fields.map((f: any) => (
              <div
                key={f.id}
                className="grid grid-cols-3 items-center px-6 py-4"
              >
                <span className="text-sm font-semibold text-muted-foreground">
                  {f.label}
                </span>
                <div className="col-span-2">
                  {isEditing ? (
                    <div className="space-y-1">
                      {f.type === "textarea" ? (
                        <Textarea
                          {...register(f.id as any)}
                          rows={f.rows || 4}
                        />
                      ) : (
                        <Input
                          type={f.type || "text"}
                          {...register(f.id as any)}
                          className="h-9"
                        />
                      )}
                      {errors[f.id as keyof ProfileFormValues] && (
                        <p className="text-xs text-destructive">
                          {String(
                            errors[f.id as keyof ProfileFormValues]?.message ||
                              ""
                          )}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm">
                      {String(getNestedValue(user, f.id) ?? "—")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </form>

      {/* Avatar Upload Dialog */}
      <Dialog
        open={avatarDialogOpen}
        onOpenChange={(open) => !open && handleAvatarDialogClose()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Avatar</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Preview */}
            <div className="flex justify-center">
              <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                <AvatarImage src={avatarPreview ?? user?.avatar} />
                <AvatarFallback className="bg-muted text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* File selector */}
            <label
              htmlFor="avatar-upload"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 px-6 py-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
            >
              <Upload className="h-6 w-6 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium">
                  {avatarFile ? avatarFile.name : "Click to select an image"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  JPG, PNG · Max 5MB
                </p>
              </div>
              <input
                ref={avatarInputRef}
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
            </label>

            {avatarError && (
              <p className="text-sm text-destructive">{avatarError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleAvatarDialogClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!avatarFile || avatarUploading}
              onClick={handleAvatarUpload}
            >
              {avatarUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
