import React, { useEffect, useState } from "react";
import { useLocation } from "wouter"; // Wouter hook
import "./LandingPage.css";
import { ModeToggle } from "../components/mode-toggle";

const LandingPage = () => {
  const [, setLocation] = useLocation(); // Hook for navigation

  const handleGetStarted = () => {
    setLocation("/dashboard"); // Navigate to dashboard
  };
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const [location] = useLocation();

  const navigateTo = (path: string) => {
    setLocation(path);
  };

  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="logo">
          <div>
            <img src="/logo.svg" alt="" />
          </div>
          <div>
            <span className="logo1">Krishi</span>
            <span className="logo2">Setu</span>
          </div>
        </div>
        <ul className="nav-links">
          <li
            onClick={() => navigateTo("/HowItWorks")}
            className={location === "/HowItWorks" ? "active-link" : ""}
          >
            How it works
          </li>
          <li
            onClick={() => navigateTo("/about")}
            className={location === "/about" ? "active-link" : ""}
          >
            About
          </li>
          <li
            onClick={() => navigateTo("/contact")}
            className={location === "/contact" ? "active-link" : ""}
          >
            Contact
          </li>
        </ul>
      </nav>

      <div className="hero-section">
        <div className="farmerimg">
          <img
            src="https://st4.depositphotos.com/13187390/20841/i/450/depositphotos_208415896-stock-photo-indian-farmer-holding-crop-plant.jpg"
            alt=""
          />
        </div>
        <div className="heading1">
          <h1>Track Your Produce,</h1>
        </div>
        <div className="heading2">
          <h1>Optimize Your Profits</h1>
        </div>
        <div className="heading3">
          <h1>
            From Shipment to Your Fields, We Provide Real-Time Supply Chain
            Visibility for Farmers
          </h1>
        </div>
        <button className="primary-btn get-started" onClick={handleGetStarted}>
          Get Started →
        </button>
        <div className="steps">
          <div className="step">
            <img src="/shipment-icon.png" alt="Shipment" />
            <div className="step-heading">
              <h2>Shipment</h2>
              <p>
                Real-time tracking of your produce from origin to destination.
              </p>
            </div>
          </div>
          <div className="step">
            <img src="/transport-icon.png" alt="Transport" />
            <div className="step-heading">
              <h2>Trasport</h2>
              <p>
                Monitor transport status and get live updates at every step.
              </p>
            </div>
          </div>
          <div className="step">
            <img src="/Storage-icon.png" alt="Storage" />
            <div className="step-heading">
              <h2>Storage</h2>
              <p>
                Secure and efficient storage with climate-control monitoring.
              </p>
            </div>
          </div>
          <div className="step">
            <img src="/Delivery-icon.png" alt="Delivery" />
            <div className="step-heading">
              <h2>Dilevery</h2>
              <p>Fast and reliable delivery ensuring freshness to market.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="info-cards">
        <div className="card">
          <img src="/tracking-icon.png" alt="Tracking" />
          <h3>Real-Time Tracking</h3>
          <p>
            Monitor your produce every step of the way with live GPS and supply
            chain visibility.
          </p>
        </div>
        <div className="card">
          <img src="/insights-icon.png" alt="Insights" />
          <h3>Smart Insights</h3>
          <p>
            Leverage data-driven analytics to reduce losses and optimize
            farm-to-market efficiency.
          </p>
        </div>
        <div className="card">
          <img src="/deliver-icon.png" alt="Delivery" />
          <h3>Seamless Deliveries</h3>
          <p>
            Ensure fast, efficient, and cost-effective deliveries with optimized
            logistics solutions.
          </p>
        </div>
      </div>
      {showButton && (
        <button className="back-to-top" onClick={scrollToTop}>
          ↑
        </button>
      )}
    </div>
  );
};

export default LandingPage;
