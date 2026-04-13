import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function JobCardSkeleton({ showActions = true }) {
  return (
    <Card className="overflow-hidden border-border/70 bg-card/85 shadow-sm backdrop-blur-sm">
      <CardHeader className="space-y-4 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-4 border-b border-border/50 py-2 last:border-b-0">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
        {showActions ? (
          <div className="flex flex-wrap gap-2 pt-2">
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function CandidateRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </div>
  )
}

export function DashboardSkeleton({ cards = 4 }) {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <Card className="overflow-hidden border-border/70 bg-card/85 shadow-sm backdrop-blur-sm">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-80 max-w-full" />
              <div className="flex flex-wrap gap-2 pt-1">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[28rem]">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-xl bg-muted/40 p-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="mt-3 h-5 w-12" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: cards }).map((_, index) => (
          <Card key={index} className="border-border/70 bg-card/85 shadow-sm backdrop-blur-sm">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-10/12" />
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {Array.from({ length: 3 }).map((__, rowIndex) => (
                <div key={rowIndex} className="rounded-xl border border-border/50 p-3">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="mt-2 h-3 w-28" />
                </div>
              ))}
              <Skeleton className="h-9 w-full rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function NegotiationPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <div className="space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Card className="border-border/70 bg-card/85 shadow-sm backdrop-blur-sm">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between gap-4 py-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-36" />
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-52 rounded-md" />
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="border-border/70 bg-card/85 shadow-sm backdrop-blur-sm">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {Array.from({ length: 3 }).map((__, rowIndex) => (
                <div key={rowIndex} className="rounded-xl border border-border/50 p-4">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="mt-2 h-3 w-24" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
