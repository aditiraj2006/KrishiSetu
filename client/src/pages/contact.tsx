// pages/Contact.tsx
import React from "react";
import { Link } from "wouter";
import "./contact.css";

const Contact: React.FC = () => {
  return (
    <div className="contact-container">
      <h1>Get in Touch</h1>
      <p>We’d love to hear from you! Reach out with your questions or feedback and we’ll respond as soon as possible.</p>

      <div className="contact-cards">
        <div className="contact-card">
          <span className="icon">📧</span>
          <h3>Email</h3>
          <p>support@KrishiSetu.com</p>
        </div>
        <div className="contact-card">
          <span className="icon">📞</span>
          <h3>Phone</h3>
          <p>+91 98765 43210</p>
        </div>
        <div className="contact-card">
          <span className="icon">📍</span>
          <h3>Address</h3>
          <p>123 KrishiSetu , Gururgram, India</p>
        </div>
      </div>

      <div className="form-section">
        <h2>Send us a message</h2>
        <form className="contact-form">
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
          <textarea placeholder="Your Message" rows={5} required></textarea>
          <button type="submit">Send Message</button>
        </form>
      </div>

      <Link href="/" className="back-link">← Back </Link>
    </div>
  );
};

export default Contact;
