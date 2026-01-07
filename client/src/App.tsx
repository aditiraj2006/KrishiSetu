import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";

import LandingPage from "@/pages/LandingPage";
import Contact from "@/pages/contact";
import about from "@/pages/about";
import Dashboard from "@/pages/dashboard";
import HowItWorks from "@/pages/HowItWorks";
import ProductRegistration from "@/pages/product-registration";
import QRScannerPage from "@/pages/qr-scanner";
import ProductDetails from "@/pages/product-details";
import ProfilePage from "@/pages/profile";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import RegisteredProductsPage from "@/pages/registered-products";
import ScannedProductsPage from "@/pages/scanned-products";
import RequestProductsPage from "@/pages/request-products";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background:
                "linear-gradient(135deg, var(--verified), var(--primary))",
              color: "#fff",
              fontWeight: "bold",
              borderRadius: "0.5rem",
              padding: "12px 16px",
            },
            duration: 2000,
          }}
        />
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/contact" component={Contact} />
          <Route path="/about" component={about} />
          <Route path="/howitworks" component={HowItWorks} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/product-registration" component={ProductRegistration} />
          <Route path="/qr-scanner" component={QRScannerPage} />
          <Route path="/product/:id" component={ProductDetails} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/login" component={LoginPage} />
          <Route
            path="/registered-products"
            component={RegisteredProductsPage}
          />
          <Route path="/scanned-products" component={ScannedProductsPage} />
          <Route path="/request-products" component={RequestProductsPage} />
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
