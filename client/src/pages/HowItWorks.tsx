// pages/HowItWorks.tsx
import React, { useState } from "react";
import { Link } from "wouter";
import "./HowItWorks.css";

// Define the possible roles as a constant array
const roles = ["Farmer", "Retailer", "Distributor", "Consumer"] as const;
type Role = typeof roles[number]; // "Farmer" | "Retailer" | "Distributor" | "Consumer"

// Define the structure of each step
type Step = {
  title: string;
  description: string;
};

const HowItWorks: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

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
    <div className="how-it-works-container">
      <h1>How KrishiSetu Works</h1>

      {!selectedRole ? (
        <div className="role-selection">
          <p>Select your role to see how KrishiSetu works for you:</p>
          <div className="role-buttons">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className="role-button"
              >
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
          <button onClick={() => setSelectedRole(null)} className="back-button">
            ← Select Another Role
          </button>
        </div>
      )}

      <Link href="/" className="back-link">← Back</Link>
    </div>
  );
};

export default HowItWorks;
