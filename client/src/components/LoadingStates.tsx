import { Card, CardContent } from '@/components/ui/card';
import { Sprout } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl border p-4 space-y-3"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="p-4 border-b">
        <Skeleton className="h-5 w-40" />
      </div>

      <div className="space-y-3 p-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-4 gap-4"
          >
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border p-4 space-y-4">
      <Skeleton className="h-40 w-full rounded-lg" />

      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <StatsSkeleton />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TableSkeleton />
        <TableSkeleton />
      </div>
    </div>
  );
}

export function LoadingStates() {
  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      data-testid="loading-overlay"
    >
      <Card className="shadow-lg border border-border">
        <CardContent className="p-8 text-center">
          <div className="loading-pulse w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-8 h-8 text-primary" />
          </div>
          <p className="text-foreground font-medium mb-2" data-testid="text-processing">
            Processing on Blockchain
          </p>
          <p className="text-sm text-muted-foreground" data-testid="text-wait-message">
            This may take a few moments...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
