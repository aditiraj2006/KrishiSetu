import { useLocation } from "wouter";
import { ModeToggle } from "./mode-toggle";
import "./LandingNavbar.css";

const LandingNavbar = () => {
  const [location, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation("/dashboard");
  };

  const navigateTo = (path: string) => {
    setLocation(path);
  };

  const handleFeaturesClick = () => {
    if (location === "/") {
      const element = document.getElementById("features");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      setLocation("/");
      // Smooth scroll after navigation
      setTimeout(() => {
        const element = document.getElementById("features");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);
    }
  //  Check if the user is authenticated by looking for the token
  const isAuthenticated = !!localStorage.getItem("token");

  //  Handle the logout flow safely
  const handleLogout = () => {
    localStorage.removeItem("token"); // Clear token from localStorage
    setLocation("/login");            // Redirect user to login view
  };

  return (
    <nav className="navbar">
      <div className="logo-container" onClick={() => navigateTo("/")}>
        <div className="logo-icon">
          <img src="/logo.svg" alt="KrishiSetu Logo" className="w-6 h-6 object-contain" />
        </div>
        <span className="logo">
          <span className="logo1">Krishi</span>
          <span className="logo2">Setu</span>
        </span>
      </div>
      
      <div className="nav-actions">
        <ul className="nav-links">
          <li onClick={handleFeaturesClick}>Features</li>
          <li 
            onClick={() => navigateTo("/howitworks")}
            className={location === "/howitworks" ? "active-link" : ""}
          >How it works</li>
          <li 
            onClick={() => navigateTo("/about")}
            className={location === "/about" ? "active-link" : ""}
          >About</li>
          <li 
            onClick={() => navigateTo("/contact")}
            className={location === "/contact" ? "active-link" : ""}
          >Contact</li>
        </ul>
        
        <ModeToggle />
        <button className="navbar-btn" onClick={handleGetStarted}>
          Launch App
        </button>
      </div>
      <ModeToggle />
      <ul style={{ listStyle: "none", display: "flex", gap: "24px", margin: 0, padding: 0, alignItems: "center" }}>
        {[
          { label: "How it works", path: "/HowItWorks" },
          { label: "About", path: "/about" },
          { label: "Contact", path: "/contact" },
        ].map(({ label, path }) => (
          <li
            key={path}
            onClick={() => setLocation(path)}
            style={{
              cursor: "pointer",
              color: location === path ? "#4ade80" : "#cbd5e1",
              fontWeight: location === path ? "600" : "normal",
              borderBottom: location === path ? "2px solid #4ade80" : "2px solid transparent",
              paddingBottom: "4px",
              transition: "color 0.3s ease",
              fontSize: "16px",
            }}
          >
            {label}
          </li>
        ))}

        {/* 👉 FIX: Conditionally display Logout or Login depending on context status */}
        {isAuthenticated ? (
          <li
            onClick={handleLogout}
            style={{
              cursor: "pointer",
              color: "#f87171", // Soft red tint for logout action
              fontWeight: "600",
              fontSize: "16px",
              paddingBottom: "4px",
              borderBottom: "2px solid transparent",
              transition: "color 0.3s ease",
            }}
          >
            Logout
          </li>
        ) : (
          <li
            onClick={() => setLocation("/login")}
            style={{
              cursor: "pointer",
              color: location === "/login" ? "#4ade80" : "#cbd5e1",
              fontWeight: location === "/login" ? "600" : "normal",
              fontSize: "16px",
              paddingBottom: "4px",
              borderBottom: location === "/login" ? "2px solid #4ade80" : "2px solid transparent",
              transition: "color 0.3s ease",
            }}
          >
            Login / Signup
          </li>
        )}
      </ul>
    </nav>
  );
};

export default LandingNavbar;