import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/context/auth-context.jsx"

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RoleBadge } from "@/components/role-badge"

// Icons
import { Pencil, Check, X } from "lucide-react"

// Fields (from admin, regular, business)
import { REGULARFIELDS, regularProfileSchema } from "../regular/profile.jsx"
import { BUSINESSFIELDS, businessProfileSchema } from "../business/profile.jsx"
import { ADMINFIELDS, adminProfileSchema } from "../admin/profile.jsx"

export function Profile() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  let fields = []
  let profileSchema = z.object({})

  if (user?.role === "regular") {
    fields = REGULARFIELDS
    profileSchema = regularProfileSchema
  } else if (user?.role === "business") {
    fields = BUSINESSFIELDS
    profileSchema = businessProfileSchema
  } else if (user?.role === "admin") {
    fields = ADMINFIELDS
    profileSchema = adminProfileSchema
  }

  type ProfileFormValues = z.infer<typeof profileSchema>

  const dynamicDefaults = fields.reduce(
    (acc: any, field: any) => {
      acc[field.id] = user?.[field.id] || ""
      return acc
    },
    { biography: user?.biography || "" }
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
    if (user) {
      reset(dynamicDefaults)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, reset])

  const onSubmit = (data: ProfileFormValues) => {
    console.log("Submit:", data)
    setIsEditing(false)
  }

  const initials =
    user?.first_name && user?.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
      : user?.email?.[0]?.toUpperCase() || "?"

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
        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b pb-6">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    reset()
                    setIsEditing(false)
                  }}
                >
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button type="submit">
                  <Check className="mr-2 h-4 w-4" /> Save
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

        {/* Hero */}
        <div className="mb-8 flex flex-col items-center gap-y-4">
          <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-muted text-3xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-4xl font-extrabold">
            {user?.first_name} {user?.last_name}
          </h2>
          <RoleBadge role={user?.role} />
        </div>

        {/* Table */}
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
                      <Input
                        type={f.type || "text"}
                        {...register(f.id as any)}
                        className="h-9"
                      />
                      {errors[f.id as keyof ProfileFormValues] && (
                        <p className="text-xs text-destructive">
                          {errors[f.id as keyof ProfileFormValues]?.message}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm">
                      {(user as any)?.[f.id] || "—"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
