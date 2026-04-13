import { cn } from "@/lib/utils"

export function PageShell({ title, description, actions, children, className, contentClassName }) {
  return (
    <div className={cn("page-enter mx-auto max-w-6xl px-6 py-10", className)}>
      {(title || description || actions) ? (
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            {title ? <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1> : null}
            {description ? <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn("space-y-6", contentClassName)}>{children}</div>
    </div>
  )
}
