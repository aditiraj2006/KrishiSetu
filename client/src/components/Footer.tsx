import { Github, Leaf, Mail, MapPin, Phone } from "lucide-react";
import React from "react";
import { Link } from "wouter";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-auto pt-12 pb-6 relative z-10 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand & About */}
          <div className="flex flex-col space-y-4">
            <Link
              href="/"
              className="flex items-center gap-2 cursor-pointer w-fit group"
            >
              <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">
                KrishiSetu
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Empowering farmers with real-time supply chain visibility. Track
              your produce from field to market, reduce losses, and optimize
              profits.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-foreground font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-primary transition-colors cursor-pointer block"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/HowItWorks"
                  className="hover:text-primary transition-colors cursor-pointer block"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-primary transition-colors cursor-pointer block"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-primary transition-colors cursor-pointer block"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-foreground font-semibold">Contact</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 bg-primary/10 p-1.5 rounded-md">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <a
                  href="mailto:support@KrishiSetu.com"
                  className="hover:text-primary transition-colors mt-1"
                >
                  support@KrishiSetu.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 bg-primary/10 p-1.5 rounded-md">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <span className="mt-1">+91 98765 43210</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 bg-primary/10 p-1.5 rounded-md">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <span className="mt-1 leading-relaxed">
                  123 KrishiSetu,
                  <br />
                  Gurugram, India
                </span>
              </li>
            </ul>
          </div>

          {/* Community / Open Source */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-foreground font-semibold">Open Source</h3>
            <p className="text-sm text-muted-foreground mb-2">
              We are open source! Contributions are welcome.
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/aditiraj2006/KrishiSetu"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all hover-lift shadow-sm"
                aria-label="GitHub Repository"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} KrishiSetu. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="hover:text-primary transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-primary transition-colors cursor-pointer">
              Terms of Service
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
