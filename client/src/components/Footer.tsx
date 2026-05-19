import React from "react";
import { Link } from "wouter";
import {
  Github,
  Linkedin,
  Twitter,
  Mail,
  Phone,
  MapPin,
  Leaf
} from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-border/50 mt-auto w-full bg-gradient-to-br from-white via-green-50/40 to-emerald-100/30 dark:from-[#07110a] dark:via-[#0b1b12] dark:to-[#102017]">

      {/* Background Glow Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        <div className="absolute top-0 left-0 w-[350px] h-[350px] bg-green-400/10 blur-3xl rounded-full" />

        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-emerald-500/10 blur-3xl rounded-full" />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-lime-300/5 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-12 pb-6">

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

          {/* Brand Section */}
          <div className="flex flex-col space-y-4">

            <Link
              href="/"
              className="flex items-center gap-3 cursor-pointer w-fit group"
            >
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20 group-hover:scale-105 transition-transform duration-300">
                <Leaf className="w-5 h-5 text-white" />
              </div>

              <span className="text-xl font-bold bg-gradient-to-r from-green-700 via-emerald-600 to-lime-600 dark:from-green-300 dark:via-emerald-400 dark:to-lime-300 bg-clip-text text-transparent">
                KrishiSetu
              </span>
            </Link>

            <p className="text-sm leading-6 text-muted-foreground max-w-xs">
              Empowering farmers with transparent supply chain visibility and smart agricultural tracking from farm to market.
            </p>

          </div>

          {/* Quick Links */}
          <div className="flex flex-col space-y-4">

            <h3 className="text-base font-semibold text-foreground">
              Quick Links
            </h3>

            <ul className="space-y-2 text-sm">

              {[
                ["Dashboard", "/dashboard"],
                ["How It Works", "/HowItWorks"],
                ["About Us", "/about"],
                ["Contact", "/contact"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="
                      relative
                      w-fit
                      text-muted-foreground
                      hover:text-green-600
                      dark:hover:text-green-400
                      transition-all
                      duration-300

                      after:content-['']
                      after:absolute
                      after:left-1/2
                      after:-bottom-1
                      after:h-[2px]
                      after:w-[75%]
                      after:-translate-x-1/2
                      after:scale-x-0
                      after:rounded-full
                      after:bg-gradient-to-r
                      after:from-green-700
                      after:via-emerald-500
                      after:to-lime-400
                      after:transition-transform
                      after:duration-300

                      hover:after:scale-x-100
                    "
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col space-y-4">

            <h3 className="text-base font-semibold text-foreground">
              Contact
            </h3>

            <ul className="space-y-3 text-sm text-muted-foreground">

              <li className="flex items-start gap-3 group">

                <div className="mt-0.5 p-1.5 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <Mail className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>

                <a
                  href="mailto:support@KrishiSetu.com"
                  className="hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  support@KrishiSetu.com
                </a>
              </li>

              <li className="flex items-start gap-3 group">

                <div className="mt-0.5 p-1.5 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>

                <span>+91 98765 43210</span>
              </li>

              <li className="flex items-start gap-3 group">

                <div className="mt-0.5 p-1.5 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>

                <span className="leading-relaxed">
                  Gurugram, India
                </span>
              </li>

            </ul>
          </div>

          {/* Open Source */}
          <div className="flex flex-col space-y-4">

            <h3 className="text-base font-semibold text-foreground">
              Open Source
            </h3>

            <p className="text-sm text-muted-foreground leading-6">
              KrishiSetu is open source and community driven. Contributions are always welcome 🌱
            </p>

            <div className="flex gap-3">

              {[
                {
                  icon: Github,
                  href: "https://github.com/aditiraj2006/KrishiSetu",
                },
                {
                  icon: Linkedin,
                  href: "https://linkedin.com",
                },
                {
                  icon: Twitter,
                  href: "https://twitter.com",
                },
              ].map(({ icon: Icon, href }, index) => (
                <a
                  key={index}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="
                    group
                    relative
                    overflow-hidden

                    w-10
                    h-10

                    rounded-xl

                    bg-white/70
                    dark:bg-white/5

                    border
                    border-green-500/10

                    backdrop-blur-sm

                    flex
                    items-center
                    justify-center

                    hover:scale-105
                    hover:-translate-y-1

                    transition-all
                    duration-300
                  "
                >
                  {/* Glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-green-500/20 via-emerald-400/20 to-lime-300/20" />

                  <Icon className="relative z-10 w-4 h-4 text-muted-foreground group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300" />
                </a>
              ))}

            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-green-500/30 to-transparent mb-6" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">

          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {currentYear} KrishiSetu. Built for transparent agriculture 🌾
          </p>

          <div className="flex gap-5 text-sm">

            <span className="cursor-pointer text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors">
              Privacy Policy
            </span>

            <span className="cursor-pointer text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors">
              Terms of Service
            </span>

          </div>
        </div>
      </div>
    </footer>
  );
}