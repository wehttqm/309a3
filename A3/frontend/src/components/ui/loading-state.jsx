import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function LoadingState({
  title = "Loading",
  description = "Please wait while we fetch the latest information.",
  className,
  compact = false,
  card = true,
}) {
  const content = (
    <div className={cn(
      "surface-enter flex flex-col items-center justify-center gap-3 text-center",
      compact ? "min-h-[16rem] px-6 py-10" : "min-h-[24rem] px-6 py-14",
      className
    )}>
      <div className="flex size-14 items-center justify-center rounded-full border border-primary/15 bg-primary/5 shadow-sm">
        <LoadingSpinner className="gap-0" />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold tracking-tight text-foreground">{title}</p>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  )

  if (!card) return content

  return (
    <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur-sm">
      <CardContent className="p-0">{content}</CardContent>
    </Card>
  )
}

export function InlineLoadingState({
  label = "Loading",
  className,
}) {
  return (
    <div className={cn("surface-enter inline-flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <LoadingSpinner />
      <span>{label}</span>
    </div>
  )
}

export function LoadingSection({
  title = "Loading section",
  description,
  className,
}) {
  return (
    <Card className={cn("border-dashed border-border/70 bg-card/70 shadow-none", className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <InlineLoadingState label="Updating content" />
      </CardContent>
    </Card>
  )
}
