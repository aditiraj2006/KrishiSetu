import { useStats } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  ShieldCheck,
  Truck,
  Medal,
  TrendingUp,
  ArrowRightLeft,
} from "lucide-react";

export function StatsOverview() {
  const { user } = useAuth();
  const userId = user && user.role !== "consumer" ? user.id : undefined;
  const { data: stats, isLoading, error } = useStats(userId);

  console.log("StatsOverview - user:", user?.id, "stats:", stats);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="hover-lift">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="text-destructive text-sm">Failed to load stats</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  console.log(
    "Rendering stats:",
    stats.totalProducts,
    stats.verifiedBatches,
    stats.activeShipments,
    stats.averageQualityScore
  );

  const statCards =
    user && user.role !== "consumer"
      ? [
          {
            label: "My Products",
            value: (stats.totalProducts ?? 0).toLocaleString(),
            icon: Package,
            trend: "Registered by you",
            trendIcon: Package,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
          },
          {
            label: "Active Transfers",
            value: (stats.activeTransfers ?? 0).toLocaleString(),
            icon: ArrowRightLeft,
            trend: "In progress",
            trendIcon: ArrowRightLeft,
            iconBg: "bg-accent/10",
            iconColor: "text-accent",
          },
          {
            label: "Completed Transfers",
            value: (stats.completedTransfers ?? 0).toLocaleString(),
            icon: ShieldCheck,
            trend: "Successfully completed",
            trendIcon: ShieldCheck,
            iconBg: "bg-verified/10",
            iconColor: "text-verified",
          },
          {
            label: "Average Rating",
            value: `${(stats.averageRating ?? 0).toFixed(1)}/5`,
            icon: Medal,
            trend: "User rating",
            trendIcon: Medal,
            iconBg: "bg-warning/10",
            iconColor: "text-warning",
          },
        ]
      : [
          {
            label: "Total Products",
            value: (stats.totalProducts ?? 0).toLocaleString(),
            icon: Package,
            trend: "+12% from last month",
            trendIcon: TrendingUp,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
          },
          {
            label: "Verified Batches",
            value: (stats.verifiedBatches ?? 0).toLocaleString(),
            icon: ShieldCheck,
            trend: "100% blockchain verified",
            trendIcon: ShieldCheck,
            iconBg: "bg-verified/10",
            iconColor: "text-verified",
          },
          {
            label: "Active Shipments",
            value: (stats.activeShipments ?? 0).toLocaleString(),
            icon: Truck,
            trend: "23 arriving today",
            trendIcon: Truck,
            iconBg: "bg-accent/10",
            iconColor: "text-accent",
          },
          {
            label: "Quality Score",
            value: `${(stats.averageQualityScore ?? 0).toFixed(1)}%`,
            icon: Medal,
            trend: "Excellent rating",
            trendIcon: Medal,
            iconBg: "bg-verified/10",
            iconColor: "text-verified",
          },
        ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover-lift transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm font-medium text-muted-foreground"
                  data-testid={`text-${stat.label
                    .toLowerCase()
                    .replace(" ", "-")}-label`}
                >
                  {stat.label}
                </p>
                <p
                  className="text-2xl font-bold text-foreground"
                  data-testid={`text-${stat.label
                    .toLowerCase()
                    .replace(" ", "-")}-value`}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-verified flex items-center gap-1 mt-1">
                  <stat.trendIcon className="w-3 h-3" />
                  <span
                    data-testid={`text-${stat.label
                      .toLowerCase()
                      .replace(" ", "-")}-trend`}
                  >
                    {stat.trend}
                  </span>
                </p>
              </div>
              <div className={`${stat.iconBg} p-3 rounded-lg`}>
                <stat.icon className={`${stat.iconColor} text-xl w-6 h-6`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
