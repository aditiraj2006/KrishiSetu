import React, { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
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
      
      // Show success toast
      setToast({ show: true, message: "Message sent successfully! We'll get back to you soon.", type: "success" });
      
      // Clear form fields
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      setToast({ show: true, message: "Failed to send message. Please try again.", type: "error" });
    } finally {
      setIsSubmitting(false);
      // Auto-hide toast after 4 seconds
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
    }
  };

  return (
    <div className="contact-page-container p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-[#2D8C4E]">Contact Us</h1>
      
      {toast.show && (
        <div className={`p-4 mb-4 rounded text-sm font-medium ${toast.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
          {toast.message}
        </div>
      )}

      <form className="contact-form flex flex-col gap-4" onSubmit={handleSubmit}>
        <input 
          type="text" 
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Your Name" 
          className="border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-[#2D8C4E]"
          required 
        />
        <input 
          type="email" 
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Your Email" 
          className="border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-[#2D8C4E]"
          required 
        />
        <textarea 
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Your Message" 
          rows={5} 
          className="border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-[#2D8C4E]"
          required
        ></textarea>
        <button 
          type="submit" 
          className={`primary-btn p-3 rounded text-white font-bold transition-colors ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#2D8C4E] hover:bg-green-700'}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}
