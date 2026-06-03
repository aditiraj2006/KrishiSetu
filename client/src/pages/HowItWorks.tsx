import type React from "react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import "./HowItWorks.css";
import LandingNavbar from "@/components/LandingNavbar";
import { NavigationHeader } from "@/components/NavigationHeader";
import { useAuth } from "@/hooks/useAuth";

const roles = ["Farmer", "Retailer", "Distributor", "Consumer"] as const;
type Role = (typeof roles)[number];

type Step = {
  title: string;
  description: string;
};

const HowItWorks: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showButton, setShowButton] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => setShowButton(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const steps: Record<Role, Step[]> = {
    Farmer: [
      { title: "Register", description: "Create your farm profile to access tools and tracking services." },
      { title: "List Produce", description: "Add details of your produce including quantity, quality, and location." },
      { title: "Monitor Shipments", description: "Track shipments and deliveries in real-time using GPS-enabled logistics tools." },
      { title: "Manage Inventory", description: "Keep your produce stock updated and manage availability efficiently." },
      { title: "Get Insights", description: "Receive analytics and reports to optimize farm output and reduce losses." },
      { title: "Connect with Buyers", description: "Reach out to retailers, distributors, and consumers easily through verified channels." },
    ],
    Retailer: [
      { title: "Browse Produce", description: "Search for available farm produce from verified farmers nearby." },
      { title: "Place Orders", description: "Order directly through the platform for efficient logistics." },
      { title: "Track Supply", description: "Monitor delivery schedules to ensure timely stock management." },
    ],
    Distributor: [
      { title: "Connect", description: "Find supply chains that need transport and storage services." },
      { title: "Manage Deliveries", description: "Coordinate routes and schedules to optimize efficiency." },
      { title: "Track Performance", description: "Analyze delivery data and improve services for farmers and retailers." },
    ],
    Consumer: [
      { title: "Discover", description: "Find fresh farm produce available near you at the best prices." },
      { title: "Order", description: "Place orders easily and choose delivery preferences as per convenience." },
      { title: "Track", description: "Stay updated on the delivery process and expected arrival time." },
      { title: "Trace Origin", description: "Scan the QR code on the packet to know where it came from — farm details, registration date, and entire produce history." },
      { title: "Trusted Delivery", description: "See through which transport and distributor the product traveled, ensuring accountability at every step." },
    ],
  };

  return (
    <>
      {loading ? (
        <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm h-16 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">KrishiSetu...</div>
        </nav>
      ) : user ? (
        <NavigationHeader />
      ) : (
        <LandingNavbar />
      )}
      <div className="how-it-works-container">
        <h1>How KrishiSetu Works</h1>

      {!selectedRole ? (
        <div className="role-selection">
          <p>Select your role to see how KrishiSetu works for you:</p>
          <div className="role-buttons">
            {roles.map((role) => (
              <button key={role} onClick={() => setSelectedRole(role)} className="primary-btn role-button">
                {role}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="role-section">
          <h2>{selectedRole}</h2>
          <div className="steps-container">
            {steps[selectedRole].map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-number">{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setSelectedRole(null)} className="back-button primary-btn">
            ← Select Another Role
          </button>
        </div>
      )}

      <Link href={user ? "/dashboard" : "/"} className="back-link">
        ← Back
      </Link>

      {showButton && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            backgroundColor: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            fontSize: "24px",
            cursor: "pointer",
            zIndex: 1000,
          }}
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}
    </div>
    </>
  );
};

export default HowItWorks;