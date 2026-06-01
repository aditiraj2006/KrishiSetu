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
      setTimeout(() => {
        const element = document.getElementById("features");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);
    }
  };

  const isAuthenticated = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    setLocation("/login");
  };

  return (
    <nav className="navbar">
      <div className="logo-container" onClick={() => navigateTo("/")}>
        <div className="logo-icon">
          <img
            src="/logo.svg"
            alt="KrishiSetu Logo"
            className="w-6 h-6 object-contain"
          />
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

          {isAuthenticated ? (
            <li onClick={handleLogout}>Logout</li>
          ) : (
            <li onClick={() => navigateTo("/login")}>Login / Signup</li>
          )}
        </ul>

        <ModeToggle />

        <button className="navbar-btn" onClick={handleGetStarted}>
          Launch App
        </button>
      </div>
    </nav>
  );
};

export default LandingNavbar;
