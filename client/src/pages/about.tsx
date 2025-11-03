// pages/About.tsx
import React from "react";
import { Link } from "wouter";
import "./about.css";

const About: React.FC = () => {
  return (
    <div className="about-container">
      <h1 className="fade-in">About KrishiSetu</h1>
      <p className="fade-in delay-1">
        KrishiSetu is a cutting-edge platform transforming the agricultural supply chain by providing real-time tracking, data-driven insights, and transparent interactions between farmers, retailers, distributors, and consumers.
      </p>

      <div className="about-sections fade-in delay-2">
        <section>
          <h2>Our Mission</h2>
          <p>
            Empower farmers by giving them the tools to manage produce efficiently, connect with buyers, and make informed decisions while fostering trust and transparency.
          </p>
        </section>

        <section>
          <h2>Our Vision</h2>
          <p>
            We aim to create a world where stakeholders collaborate seamlessly, reduce waste, improve logistics, and ensure healthy produce reaches consumers on time.
          </p>
        </section>

        <section>
          <h2>Why KrishiSetu?</h2>
          <ul>
            <li><strong>Transparency:</strong> Track every step of produce movement with verified data.</li>
            <li><strong>Data-Driven:</strong> Insights help farmers optimize productivity and minimize losses.</li>
            <li><strong>Real-Time Tracking:</strong> Monitor shipments, schedules, and deliveries instantly.</li>
            <li><strong>Trusted Network:</strong> Connect with verified partners, buyers, and distributors.</li>
            <li><strong>Consumer Assurance:</strong> QR-based tracking ensures product quality and origin verification.</li>
          </ul>
        </section>
      </div>

      <p className="fade-in delay-3">
        At KrishiSetu, we are passionate about leveraging technology to build a sustainable ecosystem where every stakeholder benefits — from farm to fork.
      </p>

      <Link href="/" className="back-link fade-in delay-4">← Back </Link>
    </div>
  );
};

export default About;
