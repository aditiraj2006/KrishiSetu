import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import LandingNavbar from "../components/LandingNavbar";
import { 
  Leaf, 
  ArrowRight, 
  Search, 
  ShieldCheck, 
  BarChart3, 
  ChevronUp, 
  MoveRight 
} from "lucide-react";
import "./LandingPage.css";
import UXMarquee from "../components/UXMarquee";

interface SupplyChainStep {
  id: string;
  name: string;
  desc: string;
  detail: string;
  icon: string;
}

const LandingPage = () => {
  const [, setLocation] = useLocation();
  const [showButton, setShowButton] = useState(false);
  const [activeStep, setActiveStep] = useState<string>("shipment");

  const handleGetStarted = () => {
    setLocation("/dashboard");
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 150);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (window.location.hash !== "#features") {
      return;
    }

    const element = document.getElementById("features");
    if (!element) {
      return;
    }

    const nav = document.querySelector<HTMLElement>(".landing-navbar");
    const navHeight = nav?.offsetHeight ?? 0;
    const targetTop = element.getBoundingClientRect().top + window.scrollY - navHeight - 12;
    window.scrollTo({ top: targetTop, behavior: "smooth" });
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const supplyChainSteps: SupplyChainStep[] = [
    { 
      id: "shipment", 
      name: "Shipment", 
      desc: "Register Produce", 
      detail: "Farmers record crop details and generate secure batch QR codes for tracking origin and specifications.",
      icon: "/shipment-icon.png" 
    },
    { 
      id: "transport", 
      name: "Transport", 
      desc: "Live GPS updates", 
      detail: "Track shipping paths and environmental status to ensure freshness and prevent unauthorized stops.",
      icon: "/transport-icon.png" 
    },
    { 
      id: "storage", 
      name: "Storage", 
      desc: "Warehouse monitoring", 
      detail: "Crops are cataloged in smart storage warehouses with automated status logging and inventory logs.",
      icon: "/Storage-icon.png" 
    },
    { 
      id: "delivery", 
      name: "Delivery", 
      desc: "Market Handover", 
      detail: "Verify ownership transfers to distributors and retailers securely, resolving payouts and clearing cargo.",
      icon: "/Delivery-icon.png" 
    }
  ];

  return (
    <div className="landing-page">
      <LandingNavbar />

      {/* Hero Section */}
      <div className="hero-section">
        
        <h1>
          Track Your Produce,
          <br />
          Optimize Your <span>Profits.</span>
        </h1>
        
        <p className="hero-desc">
          Bridges the gap between fields and markets. We offer end-to-end real-time 
          supply chain tracking, automated condition logging, and verifiable trust for modern farmers.
        </p>
        
        <div className="hero-actions">
          <button className="primary-btn get-started" onClick={handleGetStarted}>
            Get Started <ArrowRight className="inline-block ml-2 w-4 h-4" />
          </button>
          
          <button className="secondary-btn explore" onClick={() => scrollToSection("timeline")}>
            Explore Platform
          </button>
        </div>
      </div>

      {/* Connected Visual Supply Chain Map (Interactive) */}
      <div id="timeline" className="timeline-map-container">
        <div className="timeline-header">
          <h3>Interactive Supply Chain Flow</h3>
          <p>Click on any logistics stage to see how KrishiSetu secures your harvest</p>
        </div>
        
        <div className="timeline-steps">
          {supplyChainSteps.map((step) => (
            <div 
              key={step.id} 
              className={`timeline-node ${activeStep === step.id ? "active" : ""}`}
              onClick={() => setActiveStep(step.id)}
            >
              <div className="timeline-circle">
                <img src={step.icon} alt={step.name} />
              </div>
              <h4>{step.name}</h4>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Dynamic Detail Card */}
        <div className="mt-8 p-6 bg-background/50 border border-border/60 rounded-xl text-center max-w-2xl mx-auto backdrop-blur-sm">
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full mb-3 uppercase tracking-wider">
            Stage Detail: {supplyChainSteps.find(s => s.id === activeStep)?.name}
          </span>
          <p className="text-sm md:text-base text-foreground/90 font-medium">
            {supplyChainSteps.find(s => s.id === activeStep)?.detail}
          </p>
        </div>
      </div>

      {/* Trust & Credibility Metrics */}
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-number">15K+</div>
          <div className="stat-label">Farmers Connected</div>
          <div className="stat-desc">Empowered with data ownership</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">99.9%</div>
          <div className="stat-label">Audit Accuracy</div>
          <div className="stat-desc">Secure QR chain of custody</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">30%</div>
          <div className="stat-label">Waste Reduction</div>
          <div className="stat-desc">Optimized cold chains & transit</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">24/7</div>
          <div className="stat-label">Live Monitoring</div>
          <div className="stat-desc">Constant status and alerts</div>
        </div>
      </div>

      {/* Core Pillars / Advanced Features */}
      <div id="features" className="features-section">
        <div className="features-header">
          <h2>Designed for the Modern Agricultural Ecosystem</h2>
          <p>Empowering farming communities with digital logistics tools that reduce intermediate friction.</p>
        </div>

        <div className="info-cards">
          <div className="card" onClick={handleGetStarted}>
            <div className="card-icon-wrap">
              <Search className="w-6 h-6" />
            </div>
            <h3>Real-Time Tracking</h3>
            <p>
              Monitor your crop packages at every coordinate. Get absolute visibility over temperature, handling, and ETA alerts from field to delivery point.
            </p>
          </div>
          
          <div className="card" onClick={handleGetStarted}>
            <div className="card-icon-wrap">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3>Smart Market Insights</h3>
            <p>
              Leverage detailed data analytics to analyze transit quality and optimize shipping routes to maximize your market margins and eliminate crop loss.
            </p>
          </div>
          
          <div className="card" onClick={handleGetStarted}>
            <div className="card-icon-wrap">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3>Verifiable Trust</h3>
            <p>
              Utilize cryptographically signed digital handovers to prove crop authenticity and secure transparent, immediate payouts when assets change hands.
            </p>
          </div>
        </div>
      </div>

      {/* User Experience Marquee */}
      <div className="ux-section">
        <UXMarquee />
      </div>

      {/* High-Impact Glassmorphic CTA Banner */}
      <div className="cta-section">
        <div className="cta-banner">
          <h2>Ready to Secure Your Agricultural Logistics?</h2>
          <p>
            Join the decentralized community of growers, shippers, and distributors who are establishing trust and optimizing agricultural margins.
          </p>
          <button className="cta-btn" onClick={handleGetStarted}>
            Launch Dashboard <MoveRight className="inline-block ml-2 w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Back To Top Action */}
      {showButton && (
        <button className="back-to-top" onClick={scrollToTop} aria-label="Scroll to top">
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default LandingPage;
