import React from "react";
import { useLocation } from "wouter"; // Wouter hook
import "./LandingPage.css";

const LandingPage = () => {
  const [, setLocation] = useLocation(); // Hook for navigation

  const handleGetStarted = () => {
    setLocation("/dashboard"); // Navigate to dashboard
  };

  const navigateTo = (path: string) => {
    setLocation(path);
  };

  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="logo">KrishiSetu</div>
        <ul className="nav-links">
          
          <li onClick={() => navigateTo("/HowItWorks")}>How it works</li>
          <li onClick={() => navigateTo("/about")}>About</li>
          <li onClick={() => navigateTo("/contact")}>Contact</li>
          
          
          
        </ul>
      </nav>

      <div className="hero-section">
        <div className="steps">
          <div className="step">
            <img src="/shipment-icon.png" alt="Shipment" />
            <p>Shipment</p>
          </div>
          <div className="step">
            <img src="/transport-icon.png" alt="Transport" />
            <p>Transport</p>
          </div>
          <div className="step">
            <img src="/Storage-icon.png" alt="Storage" />
            <p>Storage</p>
          </div>
          <div className="step">
            <img src="/Delivery-icon.png" alt="Delivery" />
            <p>Delivery</p>
          </div>
        </div>
        <h1>Track Your Produce,<br />Optimize Your Profits</h1>
        <p>From Shipment to Your Fields, We Provide Real-Time Supply Chain Visibility for Farmers</p>
        <button className="get-started" onClick={handleGetStarted}>
          Get Started
        </button>
      </div>

      <div className="info-cards">
        <div className="card">
          <img src="/tracking-icon.png" alt="Tracking" />
          <h3>Real-Time Tracking</h3>
          <p>Monitor your produce every step of the way with live GPS and supply chain visibility.</p>
        </div>
        <div className="card">
          <img src="/insights-icon.png" alt="Insights" />
          <h3>Smart Insights</h3>
          <p>Leverage data-driven analytics to reduce losses and optimize farm-to-market efficiency.</p>
        </div>
        <div className="card">
          <img src="/deliver-icon.png" alt="Delivery" />
          <h3>Seamless Deliveries</h3>
          <p>Ensure fast, efficient, and cost-effective deliveries with optimized logistics solutions.</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
