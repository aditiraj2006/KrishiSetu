import { useState } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { ProductRegistrationForm } from "@/components/ProductRegistrationForm";

export default function ProductRegistration() {
  const [showForm, setShowForm] = useState(true);

  return (
    <div className="min-h-screen bg-background font-sans">
      <NavigationHeader />

      {/* Floating Modal for Product Registration */}
      {showForm && (
        <div className="fixed inset-0 z-110 flex items-start justify-center">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setShowForm(false);
              window.history.back();
            }}
          />
          <div className="relative mt-12 max-h-[90vh] w-full max-w-4xl overflow-visible rounded-lg bg-white p-6 shadow-2xl z-110">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground">
                Product Registration
              </h2>
              <p className="text-muted-foreground mt-1">
                Register a new product batch and generate QR codes for tracking
              </p>
            </div>
            <ProductRegistrationForm
              isVisible={showForm}
              onClose={() => {
                setShowForm(false);
                window.history.back();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
