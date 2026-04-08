import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const ActivationLinkCard = ({
  title,
  description,
  activationHref,
  activationUrl,
  expiresAt,
  role = "regular",
}) => {
  const roleLabel = role === "business" ? "business" : "worker"

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Your {roleLabel} account has been created. This simulates the activation
          email. Use the link below to activate the account.
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Activation link</p>
          <div className="rounded-lg border bg-muted/40 px-3 py-3 text-xs break-all text-muted-foreground">
            {activationUrl}
          </div>
          {expiresAt ? (
            <p className="text-xs text-muted-foreground">
              Link expires on {new Date(expiresAt).toLocaleString()}.
            </p>
          ) : null}
        </div>

        {role === "business" ? (
          <div className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">
            Activation lets you sign in. Your business still needs admin
            verification before you can post jobs.
          </div>
        ) : (
          <div className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">
            After activation, you can sign in and complete your profile,
            qualifications, and availability.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild>
          <Link to={activationHref}>Activate account</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/login">Back to login</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
