import React, { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { NavigationHeader } from "@/components/NavigationHeader";
import LandingNavbar from "@/components/LandingNavbar";
import { useAuth } from "@/hooks/useAuth";

export default function Contact() {
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setToast({ show: false, message: '', type: '' });

    try {
      // Simulate API network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setToast({ show: true, message: "Message sent successfully! We'll get back to you soon.", type: "success" });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setToast({ show: true, message: "Failed to send message. Please try again.", type: "error" });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {loading ? (
        <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm h-16 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">KrishiSetu...</div>
        </nav>
      ) : user ? (
        <NavigationHeader />
      ) : (
        <LandingNavbar />
      )}

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-16">
        
        {/* 1. Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary mb-4">
            Get In Touch
          </h1>
          <p className="text-lg text-muted-foreground">
            Have questions, feedback, or need support? We'd love to hear from you.
          </p>
        </div>

        {/* 2. Contact Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          
          <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Email</h3>
            <a href="mailto:support@krishisetu.com" className="text-muted-foreground hover:text-primary transition-colors">
              support@krishisetu.com
            </a>
          </div>

          <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
              <Phone className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Phone</h3>
            <p className="text-muted-foreground">
              +91 98765 43210
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Address</h3>
            <p className="text-muted-foreground">
              New Delhi, India
            </p>
          </div>

        </div>

        {/* 3. Contact Form Section */}
        <div className="max-w-2xl mx-auto bg-card p-8 rounded-2xl shadow-sm border border-border">
          {toast.show && (
            <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'}`}>
              {toast.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Your Name</label>
                <input 
                  id="name"
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe" 
                  className="w-full bg-background border border-input p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Your Email</label>
                <input 
                  id="email"
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com" 
                  className="w-full bg-background border border-input p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">Subject</label>
              <input 
                id="subject"
                type="text" 
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="How can we help?" 
                className="w-full bg-background border border-input p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required 
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">Message</label>
              <textarea 
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Your message here..." 
                rows={5} 
                className="w-full bg-background border border-input p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                required
              ></textarea>
            </div>

            <button 
              type="submit" 
              className={`w-full p-4 rounded-lg text-white font-semibold transition-all ${isSubmitting ? 'bg-muted-foreground cursor-not-allowed opacity-70' : 'bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg'}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending Message...' : 'Send Message'}
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
