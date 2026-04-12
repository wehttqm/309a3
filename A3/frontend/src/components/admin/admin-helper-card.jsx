import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AdminHelperCard({ badge = "Helpful context", title, description, bullets = [] }) {
  return (
    <Card className="border-dashed bg-muted/20">
      <CardHeader className="gap-3">
        <Badge variant="outline" className="w-fit">{badge}</Badge>
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription className="mt-2">{description}</CardDescription> : null}
        </div>
      </CardHeader>
      {bullets.length ? (
        <CardContent>
          <ul className="space-y-2 pl-5 text-sm text-muted-foreground">
            {bullets.map((bullet) => (
              <li key={bullet} className="list-disc">{bullet}</li>
            ))}
          </ul>
        </CardContent>
      ) : null}
    </Card>
  )
}
