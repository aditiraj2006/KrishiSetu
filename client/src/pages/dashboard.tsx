import { NavigationHeader } from "@/components/NavigationHeader";
import { StatsOverview } from "@/components/StatsOverview";
import { RecentProducts } from "@/components/RecentProducts";
import { QuickActionsPanel } from "@/components/QuickActionsPanel";
import { SupplyChainMap } from "@/components/SupplyChainMap";
import { ProductRegistrationForm } from "@/components/ProductRegistrationForm";
import { DistributorProductForm } from "../components/DistributorProductForm";
import { RetailerProductForm } from "../components/RetailerProductForm";
import { RoleSelection } from "@/components/RoleSelection";
import { RoleDashboard } from "@/components/RoleDashboard";
import { Button } from "@/components/ui/button";
import { QrCode, Plus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import React, { useState, useEffect, useRef } from "react";

export default function Dashboard() {
  const { user, loading, refreshUser } = useAuth();
  const [activeForm, setActiveForm] = useState<"farmer" | "distributor" | "retailer" | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const formRef = useRef<HTMLDivElement>(null); // Ref to scroll to form
  const [, navigate] = useLocation();

  // Show role selection if role not chosen
  useEffect(() => {
    if (user && !user.roleSelected) {
      setShowRoleSelection(true);
    }
  }, [user]);

  // Scroll to form when it becomes active
  useEffect(() => {
    if (activeForm) {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeForm]);

  // Handle register product button click
  const handleRegisterProduct = () => {
    if (!user) return;
    if (user.role === "farmer") {
      setActiveForm("farmer");
    }
    else if (user.role === "distributor") {
      setActiveForm("distributor");
    } else if (user.role === "retailer") {
      setActiveForm("retailer");
    }
  };

  // Close the currently open form
  const handleCloseForm = () => {
    setActiveForm(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <NavigationHeader />
        <main className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-muted-foreground">
            Loading dashboard...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <NavigationHeader />

      <main className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard header based on role */}
        {user?.roleSelected && (
          <div className="mb-8">
            <RoleDashboard
              user={user}
              onRegisterProduct={handleRegisterProduct}
              onScanQR={() => (window.location.href = "/qr-scanner")}
            />
          </div>
        )}

        {/* Quick actions for users without selected role */}
        {!user?.roleSelected && (
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-foreground">
                  Supply Chain Dashboard
                </h2>
                <p className="text-muted-foreground mt-1">
                  Track, verify, and manage your product journey
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/qr-scanner">
                  <Button
                    className="bg-accent text-accent-foreground hover:bg-accent/90 flex items-center gap-2 shadow-sm"
                    data-testid="button-scan-qr"
                  >
                    <QrCode className="w-4 h-4" />
                    Scan QR Code
                  </Button>
                </Link>
                {/* Only show register product for farmers */}
                {user && user.role === "farmer" && (
                  <Button
                    onClick={handleRegisterProduct}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 shadow-sm"
                    data-testid="button-register-product"
                  >
                    <Plus className="w-4 h-4" />
                    Register Product
                  </Button>
                )}
                {!user && (
                  <div className="bg-gradient-to-r from-primary/20 to-accent/20 text-foreground rounded-md px-3 py-2 text-sm flex items-center gap-1 shadow-sm border border-primary/20">
                    📝 Want to register a product? Log in first to continue.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <StatsOverview />

        {/* Grid sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <RecentProducts />
          <QuickActionsPanel />
        </div>

        {/* Supply Chain Map */}
        <div className="mt-8">
          <SupplyChainMap />
        </div>

        {/* Forms Section */}

        {/* Floating Modal for Farmer */}
        {activeForm === "farmer" && (
          <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-auto">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={handleCloseForm}
            />
            <div className="relative mt-12 mb-12 mx-4 max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-6 shadow-2xl z-[121]">
              <ProductRegistrationForm
                isVisible={true}
                onClose={handleCloseForm}
              />
            </div>
          </div>
        )}

        {/* Floating Modal for Distributor */}
        {activeForm === "distributor" && (
          <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-auto">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={handleCloseForm}
            />
            <div className="relative mt-12 mb-12 mx-4 max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-6 shadow-2xl z-[121]">
              <DistributorProductForm
                isVisible={true}
                onClose={handleCloseForm}
              />
            </div>
          </div>
        )}

        {/* Floating Modal for Retailer */}
        {activeForm === "retailer" && (
          <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-auto">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={handleCloseForm}
            />
            <div className="relative mt-12 mb-12 mx-4 max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-6 shadow-2xl z-[121]">
              <RetailerProductForm
                isVisible={true}
                onClose={handleCloseForm}
              />
            </div>
          </div>
        )}
      </main>

      {/* Role Selection Modal */}
      <RoleSelection
        isVisible={showRoleSelection}
        onRoleSelected={async () => {
          setShowRoleSelection(false);
          await refreshUser();
        }}
      />
    </div>
  );
}