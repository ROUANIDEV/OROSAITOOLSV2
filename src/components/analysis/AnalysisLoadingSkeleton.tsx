import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type AnalysisLoadingSkeletonProps = {
  title?: string
  description?: string
}

export function AnalysisLoadingSkeleton({
  title = "Analyzing selected CSC...",
  description = "Preparing the result view. This can take a moment for large projects.",
}: AnalysisLoadingSkeletonProps) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-full" />

            <div className="space-y-2">
              <div className="text-sm font-medium">{title}</div>
              <div className="text-sm text-muted-foreground">{description}</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>

          <div className="space-y-3 rounded-xl border p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-72 max-w-full" />
              </div>

              <Skeleton className="hidden h-9 w-64 sm:block" />
            </div>

            <div className="space-y-2 pt-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-64 max-w-full" />
              </div>

              <Skeleton className="hidden h-9 w-64 sm:block" />
            </div>

            <div className="space-y-2 pt-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}