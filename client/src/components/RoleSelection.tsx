import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sprout, Truck, Store, Users, Check } from "lucide-react";

const roles = [
  {
    id: "farmer",
    title: "Farmer",
    description:
      "Register products, track harvests, and manage supply chain origins",
    icon: Sprout,
    features: [
      "Product Registration",
      "QR Code Generation",
      "Market Price Alerts",
      "Climate Advisory",
    ],
    color: "bg-primary text-primary-foreground",
  },
  {
    id: "distributor",
    title: "Distributor",
    description:
      "Manage transportation and logistics between supply chain stages",
    icon: Truck,
    features: [
      "QR Code Scanning",
      "Transaction Recording",
      "Supply Chain Mapping",
      "Quality Assurance",
    ],
    color: "bg-accent text-accent-foreground",
  },
  {
    id: "retailer",
    title: "Retailer",
    description: "Verify products and manage final sales transactions",
    icon: Store,
    features: [
      "Product Verification",
      "Sales Analytics",
      "Certification Display",
      "Customer Management",
    ],
    color: "bg-warning text-white",
  },
  {
    id: "consumer",
    title: "Consumer",
    description: "Track product origins and verify authenticity",
    icon: Users,
    features: [
      "Product Traceability",
      "Origin Verification",
      "Feedback System",
      "Environmental Impact",
    ],
    color: "bg-verified text-white",
  },
];

interface RoleSelectionProps {
  isVisible: boolean;
  onRoleSelected: () => void;
}

export function RoleSelection({ isVisible, onRoleSelected }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { user, firebaseUser } = useAuth();
  const { toast } = useToast();

  if (!isVisible || !user || !firebaseUser) return null;

  const handleRoleSelection = async (roleId: string) => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await apiRequest(
        "PUT",
        "/api/user/role",
        { role: roleId },
        { "firebase-uid": firebaseUser.uid }
      );

      toast({
        title: "Role Updated",
        description: "Your role has been successfully updated.",
      });
      onRoleSelected();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card/95 shadow-2xl">
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
              <Sprout className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">KrishiSetu</h1>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              Choose Your Role
            </h2>
            <p className="text-muted-foreground">
              Select your role in the supply chain to customize your dashboard and features
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {roles.map((role) => {
                const IconComponent = role.icon;
                const isSelected = selectedRole === role.id;

                return (
                  <Card
                    key={role.id}
                    className={`cursor-pointer transition-all duration-200 border-2 bg-card hover:scale-[1.01] ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedRole(role.id)}
                    data-testid={`role-card-${role.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`${role.color} p-3 rounded-lg flex-shrink-0`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-foreground text-base sm:text-lg">
                              {role.title}
                            </h3>
                            {isSelected && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                            {role.description}
                          </p>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {role.features.map((feature) => (
                              <Badge
                                key={feature}
                                variant="secondary"
                                className="text-xs bg-muted text-muted-foreground"
                              >
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-center mt-8">
              <Button
                onClick={() => handleRoleSelection(selectedRole)}
                disabled={!selectedRole || isUpdating}
                className="px-6 py-2 sm:px-8 sm:py-3 text-base sm:text-lg w-full sm:w-auto"
                data-testid="button-confirm-role"
              >
                {isUpdating ? "Setting up your dashboard..." : "Continue"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

