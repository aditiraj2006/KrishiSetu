import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { User } from "@shared/schema";
import { OwnershipManagementPanel } from "@/components/OwnershipManagementPanel";
import {
  Sprout,
  Truck,
  Store,
  Users,
  TrendingUp,
  Package,
  MapPin,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Target,
  Award,
  Leaf,
} from "lucide-react";

interface RoleDashboardProps {
  user: User;
  onRegisterProduct?: () => void;
  onScanQR?: () => void;
}

export function RoleDashboard({
  user,
  onRegisterProduct,
  onScanQR,
}: RoleDashboardProps) {
  const { role } = user;

  // Mock data - in real app this would come from API
  const mockStats = {
    farmer: {
      totalProducts: 24,
      activeHarvests: 3,
      qualityScore: 92,
      monthlyRevenue: "$12,450",
      pendingOrders: 7,
      certifications: ["Organic", "Fair Trade"],
      seasonalTips: "Consider planting winter crops for continuous harvest",
    },
    distributor: {
      totalShipments: 156,
      activeRoutes: 8,
      onTimeDelivery: 94,
      monthlyVolume: "2,340 kg",
      pendingPickups: 12,
      vehicles: ["Truck A", "Truck B", "Van C"],
      alerts: "Temperature alert on Route 3",
    },
    retailer: {
      totalProducts: 89,
      dailySales: 47,
      inventoryTurnover: 87,
      customerSatisfaction: 4.6,
      lowStockItems: 5,
      topCategories: ["Vegetables", "Fruits", "Herbs"],
      promotion: "15% off organic produce this week",
    },
    consumer: {
      scannedProducts: 18,
      favoriteOrigins: ["Local Farm Co", "Green Valley"],
      sustainabilityScore: 85,
      monthlySpending: "$340",
      trackedItems: 6,
      impactReduction: "12% less CO2 this month",
      recommendations: "Try locally grown tomatoes",
    },
  };

  const stats = mockStats[role as keyof typeof mockStats] || mockStats.farmer;

  const renderFarmerDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {/* Active Harvests */}
      <Card className="col-span-1 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Sprout className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            Active Harvests
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm truncate">Organic Tomatoes</span>
              <Badge variant="outline" className="bg-primary/10 text-primary text-xs whitespace-nowrap flex-shrink-0">
                Ready in 5 days
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm truncate">Sweet Corn</span>
              <Badge variant="outline" className="bg-warning/10 text-warning text-xs whitespace-nowrap flex-shrink-0">
                Harvesting
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm truncate">Bell Peppers</span>
              <Badge variant="outline" className="bg-accent/10 text-accent text-xs whitespace-nowrap flex-shrink-0">
                Growing
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card className="col-span-1 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Shield className="h-4 w-4 md:h-5 md:w-5 text-verified" />
            Certifications
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-2 md:space-y-2">
            {(stats as any).certifications.map((cert: string) => (
              <Badge
                key={cert}
                className="bg-verified text-white justify-center text-xs md:text-sm py-1"
              >
                {cert}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDistributorDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {/* Active Routes */}
      <Card className="col-span-1 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <MapPin className="h-4 w-4 md:h-5 md:w-5 text-accent" />
            Active Routes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm truncate">Farm → Warehouse</span>
              <Badge className="bg-verified text-white text-xs whitespace-nowrap flex-shrink-0">In Transit</Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm truncate">Warehouse → Market</span>
              <Badge className="bg-warning text-white text-xs whitespace-nowrap flex-shrink-0">Loading</Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm truncate">Market → Store</span>
              <Badge className="bg-accent text-white text-xs whitespace-nowrap flex-shrink-0">Scheduled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card className="col-span-1 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-warning" />
            Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground break-words">
            {(stats as any).alerts}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRetailerDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {/* Top Categories */}
      <Card className="col-span-1 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Store className="h-4 w-4 md:h-5 md:w-5 text-accent" />
            Top Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {(stats as any).topCategories.map(
              (category: string, index: number) => (
                <div
                  key={category}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="font-medium text-sm truncate">{category}</span>
                  <Badge
                    variant="outline"
                    className={`text-xs whitespace-nowrap flex-shrink-0 ${
                      index === 0
                        ? "bg-primary/10 text-primary"
                        : index === 1
                        ? "bg-verified/10 text-verified"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    Best Seller
                  </Badge>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Promotion */}
      <Card className="col-span-1 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-warning" />
            Active Promotion
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground break-words">
            {(stats as any).promotion}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderConsumerDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {/* Favorite Origins */}
      <Card className="col-span-1 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            Favorite Origins
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {(stats as any).favoriteOrigins.map((origin: string) => (
              <div key={origin} className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm truncate">{origin}</span>
                <Badge
                  variant="outline"
                  className="bg-verified/10 text-verified text-xs whitespace-nowrap flex-shrink-0"
                >
                  Trusted
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Impact */}
      <Card className="col-span-1 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Leaf className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            Impact
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground break-words">
            {(stats as any).impactReduction}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const getRoleIcon = () => {
    switch (role) {
      case "farmer":
        return <Sprout className="w-4 h-4 md:w-5 md:h-5" />;
      case "distributor":
        return <Truck className="w-4 h-4 md:w-5 md:h-5" />;
      case "retailer":
        return <Store className="w-4 h-4 md:w-5 md:h-5" />;
      case "consumer":
        return <Users className="w-4 h-4 md:w-5 md:h-5" />;
      default:
        return <Sprout className="w-4 h-4 md:w-5 md:h-5" />;
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case "farmer":
        return "Farmer Dashboard";
      case "distributor":
        return "Distributor Dashboard";
      case "retailer":
        return "Retailer Dashboard";
      case "consumer":
        return "Consumer Dashboard";
      default:
        return "Dashboard";
    }
  };

  const getRoleDescription = () => {
    switch (role) {
      case "farmer":
        return "Manage your harvests, track quality, and register new products";
      case "distributor":
        return "Monitor shipments, optimize routes, and track deliveries";
      case "retailer":
        return "Manage inventory, track sales, and verify product authenticity";
      case "consumer":
        return "Trace product origins, track sustainability, and verify authenticity";
      default:
        return "Welcome to your dashboard";
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Role Header */}
      <Card className="border-l-4 border-l-primary overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {getRoleIcon()}
              <div>
                <CardTitle className="text-lg md:text-xl">{getRoleTitle()}</CardTitle>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  {getRoleDescription()}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              {(role === "farmer" || role === "distributor" || role =="retailer")  &&
                onRegisterProduct && (
                  <Button
                    onClick={onRegisterProduct}
                    data-testid="button-register-product"
                    className="w-full sm:w-auto text-xs md:text-sm py-1 h-9 md:h-10"
                    size="sm"
                  >
                    <Package className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Register Product
                  </Button>
                )}
              {(role === "farmer" || role !== "farmer") && onScanQR && (
                <Button
                  variant="outline"
                  onClick={onScanQR}
                  data-testid="button-scan-qr"
                  className="w-full sm:w-auto text-xs md:text-sm py-1 h-9 md:h-10"
                  size="sm"
                >
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Scan QR
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Ownership Management Panel - Show for roles that can transfer ownership */}
      {(role === "farmer" || role === "distributor" || role === "retailer") && (
        <div className="mb-4 md:mb-6">
          <OwnershipManagementPanel />
        </div>
      )}

      {/* Role-specific Content */}
      {role === "farmer" && renderFarmerDashboard()}
      {role === "distributor" && renderDistributorDashboard()}
      {role === "retailer" && renderRetailerDashboard()}
      {role === "consumer" && renderConsumerDashboard()}
    </div>
  );
}