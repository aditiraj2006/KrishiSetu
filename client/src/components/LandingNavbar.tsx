import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ModeToggle } from "./mode-toggle";
import { QuickLanguageSwitcher } from "./QuickLanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import "./LandingNavbar.css";


const LandingNavbar = () => {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
const { user, logout } = useAuth();
const isAuthenticated = !!user;
  

 const handleGetStarted = () => {
  setMenuOpen(false);

  if (isAuthenticated) {
    setLocation("/dashboard");
  } else {
    setLocation("/login");
  }
};

const navigateTo = (path: string) => {
  setMenuOpen(false);
  setLocation(path);
};

const scrollToFeatures = () => {
    const element = document.getElementById("features");
    if (!element) return;
    const navHeight = navRef.current?.offsetHeight ?? 0;
    const targetTop = element.getBoundingClientRect().top + window.scrollY - navHeight - 12;
    window.scrollTo({ top: targetTop, behavior: "smooth" });
  };

  const handleFeaturesClick = () => {
    setMenuOpen(false);
    if (location === "/" || location === "") {
      window.location.hash = "features";
      scrollToFeatures();
      return;
    }

    window.location.hash = "features";
    setLocation("/");
  };

  
  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    setLocation("/login");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        hamburgerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <nav
      ref={navRef}
      className={`navbar landing-navbar${isScrolled ? " scrolled" : ""}`}
      role="navigation"
      aria-label="Main navigation"
    >

      {/* ── Logo ── */}
      <div
        className="logo-container"
        onClick={() => navigateTo("/")}
        role="link"
        tabIndex={0}
        aria-label="KrishiSetu home"
        onKeyDown={(e) => e.key === "Enter" && navigateTo("/")}
      >
        <div className="logo-icon">
          <img src="/logo.svg" alt="KrishiSetu Logo" className="w-6 h-6 object-contain" />
        </div>
        <span className="logo">
          <span className="logo1">Krishi</span>
          <span className="logo2">Setu</span>
        </span>
      </div>

      {/* ── Desktop nav links (hidden on mobile) ── */}
      <ul className="nav-links" role="menubar">
        <li role="menuitem" tabIndex={0}
          onClick={handleFeaturesClick}
          onKeyDown={(e) => e.key === "Enter" && handleFeaturesClick()}>
          Features
        </li>
        <li role="menuitem" tabIndex={0}
          className={location === "/how-it-works" ? "active-link" : ""}
          onClick={() => navigateTo("/how-it-works")}
          onKeyDown={(e) => e.key === "Enter" && navigateTo("/how-it-works")}>
          How it works
        </li>
        <li role="menuitem" tabIndex={0}
          className={location === "/about" ? "active-link" : ""}
          onClick={() => navigateTo("/about")}
          onKeyDown={(e) => e.key === "Enter" && navigateTo("/about")}>
          About
        </li>
        <li role="menuitem" tabIndex={0}
          className={location === "/contact" ? "active-link" : ""}
          onClick={() => navigateTo("/contact")}
          onKeyDown={(e) => e.key === "Enter" && navigateTo("/contact")}>
          Contact
        </li>
        <li role="menuitem" tabIndex={0}
          className={location === "/mini-game" ? "active-link" : ""}
          onClick={() => navigateTo("/mini-game")}
          onKeyDown={(e) => e.key === "Enter" && navigateTo("/mini-game")}>
          Mini Game 🌾
        </li>
        {isAuthenticated ? (
          <li role="menuitem" tabIndex={0}
            onClick={handleLogout}
            onKeyDown={(e) => e.key === "Enter" && handleLogout()}>
            Logout
          </li>
        ) : (
          <li role="menuitem" tabIndex={0}
            onClick={() => navigateTo("/login")}
            onKeyDown={(e) => e.key === "Enter" && navigateTo("/login")}>
            Login / Signup
          </li>
        )}
      </ul>

      {/* ── Right side controls — single group, always visible ── */}
      <div className="navbar-right">
        {/* ModeToggle — always shown, only ONE instance */}
        <ModeToggle />

        {/* Launch App — hidden on mobile (lives in drawer instead) */}
        <button className="navbar-btn desktop-only" onClick={handleGetStarted}>
          Launch App
        </button>

        {/* Hamburger — shown only on mobile */}
        <button
          ref={hamburgerRef}
          className={`hamburger-btn mobile-only${menuOpen ? " open" : ""}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
        </button>
      </div>

      {/* ── Mobile overlay ── */}
      <div
        className={`mobile-overlay${menuOpen ? " visible" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ── Mobile drawer ── */}
      <div
        id="mobile-menu"
        ref={menuRef}
        className={`mobile-drawer${menuOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Drawer header */}
        <div className="drawer-header">
          <div className="logo-container" onClick={() => navigateTo("/")}>
            <div className="logo-icon">
              <img src="/logo.svg" alt="KrishiSetu Logo" className="w-6 h-6 object-contain" />
            </div>
            <span className="logo">
              <span className="logo1">Krishi</span>
              <span className="logo2">Setu</span>
            </span>
          </div>
          <button
            className="drawer-close-btn"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Drawer links */}
        <ul className="mobile-nav-links" role="menu">
          <li role="menuitem">
            <button onClick={handleFeaturesClick} className="drawer-link">
              <span className="drawer-link-icon">⚡</span> Features
            </button>
          </li>
          <li role="menuitem">
            <button
              onClick={() => navigateTo("/how-it-works")}
              className={`drawer-link${location === "/how-it-works" ? " active-link" : ""}`}
            >
              <span className="drawer-link-icon">🔄</span> How it works
            </button>
          </li>
          <li role="menuitem">
            <button
              onClick={() => navigateTo("/about")}
              className={`drawer-link${location === "/about" ? " active-link" : ""}`}
            >
              <span className="drawer-link-icon">🌱</span> About
            </button>
          </li>
          <li role="menuitem">
            <button
              onClick={() => navigateTo("/contact")}
              className={`drawer-link${location === "/contact" ? " active-link" : ""}`}
            >
              <span className="drawer-link-icon">✉️</span> Contact
            </button>
          </li>
          <li role="menuitem">
            <button
              onClick={() => navigateTo("/mini-game")}
              className={`drawer-link${location === "/mini-game" ? " active-link" : ""}`}
            >
              <span className="drawer-link-icon">🎮</span> Mini Game
            </button>
          </li>
          {isAuthenticated ? (
            <li role="menuitem">
              <button onClick={handleLogout} className="drawer-link">
                <span className="drawer-link-icon">🚪</span> Logout
              </button>
            </li>
          ) : (
            <li role="menuitem">
              <button onClick={() => navigateTo("/login")} className="drawer-link">
                <span className="drawer-link-icon">👤</span> Login / Signup
              </button>
            </li>
          )}
        </ul>

        {/* Drawer CTA */}
        <div className="drawer-footer">
          <button className="navbar-btn drawer-cta-btn" onClick={handleGetStarted}>
            🚀 Launch App
          </button>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
