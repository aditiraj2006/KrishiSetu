import { useLocation } from "wouter";
import { ModeToggle } from "./mode-toggle";

const LandingNavbar = () => {
  const [location, setLocation] = useLocation();

  //  Check if the user is authenticated by looking for the token
  const isAuthenticated = !!localStorage.getItem("token");

  //  Handle the logout flow safely
  const handleLogout = () => {
    localStorage.removeItem("token"); // Clear token from localStorage
    setLocation("/login");            // Redirect user to login view
  };

  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 50px",
      background: "rgba(15, 23, 42, 0.95)",
      position: "sticky",
      top: 0,
      zIndex: 1000,
      width: "100vw",
      marginLeft: "calc(-50vw + 50%)",
      boxSizing: "border-box",
    }}>
      <div style={{ fontSize: "28px", fontWeight: "bold", color: "#28a745", cursor: "pointer" }}
        onClick={() => setLocation("/")}>
        KrishiSetu
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