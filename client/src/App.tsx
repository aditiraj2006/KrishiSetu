import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { Route, Switch } from "wouter";
import { Footer } from "@/components/Footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import about from "@/pages/about";
import Contact from "@/pages/contact";
import Dashboard from "@/pages/dashboard";
import HowItWorks from "@/pages/HowItWorks";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import ProductDetails from "@/pages/product-details";
import ProductRegistration from "@/pages/product-registration";
import ProfilePage from "@/pages/profile";
import QRScannerPage from "@/pages/qr-scanner";
import RegisteredProductsPage from "@/pages/registered-products";
import RequestProductsPage from "@/pages/request-products";
import ScannedProductsPage from "@/pages/scanned-products";
import { queryClient } from "./lib/queryClient";

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
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow flex flex-col relative">
            <Switch>
              <Route path="/" component={LandingPage} />
              <Route path="/contact" component={Contact} />
              <Route path="/about" component={about} />
              <Route path="/howitworks" component={HowItWorks} />
              <Route path="/dashboard" component={Dashboard} />
              <Route
                path="/product-registration"
                component={ProductRegistration}
              />
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
          </main>
          <Footer />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
