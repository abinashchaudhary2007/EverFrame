import { useState } from "react";
import { submitContactForm } from "../services/api";
import toast from "react-hot-toast";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await submitContactForm(form);
    setSubmitting(false);
    if (result.success) {
      setSubmitted(true);
    } else {
      toast.error("Failed to send message. Please try again.");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "1.5px solid #e0dff0",
    fontSize: 14,
    color: "var(--text-primary)",
    background: "#fafafa",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "80vh", padding: "60px 20px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 3, color: "var(--primary)", textTransform: "uppercase", marginBottom: 12 }}>
            Get In Touch
          </p>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            Contact Us
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 16, fontSize: 16, maxWidth: 500, margin: "16px auto 0" }}>
            Have a question or a custom request? We would love to hear from you.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 48, alignItems: "start" }}>
          {/* Info Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { icon: "📍", title: "Our Location", detail: "Kathmandu, Nepal" },
              { icon: "📧", title: "Email Us", detail: "everframe.np@gmail.com" },
              { icon: "📞", title: "Call Us", detail: "+977 980-000-0000" },
              { icon: "🕐", title: "Working Hours", detail: "Sun - Fri: 9 AM - 6 PM" },
            ].map(({ icon, title, detail }) => (
              <div
                key={title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  background: "var(--bg-secondary, #f8f8fc)",
                  borderRadius: 16,
                  padding: "20px 24px",
                  boxShadow: "0 2px 12px rgba(80,60,180,0.07)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(80,60,180,0.13)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(80,60,180,0.07)"; }}
              >
                <span style={{ fontSize: 28 }}>{icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 2 }}>{title}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>{detail}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div style={{
            background: "#fff",
            borderRadius: 20,
            padding: "40px 36px",
            boxShadow: "0 4px 32px rgba(80,60,180,0.10)",
          }}>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                <h2 style={{ color: "var(--primary)", fontWeight: 800, marginBottom: 8 }}>Message Sent!</h2>
                <p style={{ color: "var(--text-secondary)" }}>Thank you for reaching out. We will get back to you within 24 hours.</p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 24 }}
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>Your Name</label>
                    <input name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>Email Address</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="john@example.com" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>Subject</label>
                  <input name="subject" value={form.subject} onChange={handleChange} required placeholder="How can we help you?" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>Message</label>
                  <textarea name="message" value={form.message} onChange={handleChange} required rows={5} placeholder="Tell us more about your query..." style={{ ...inputStyle, resize: "vertical", minHeight: 120 }} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%", padding: "14px", fontSize: 15, fontWeight: 700 }}>
                  {submitting ? "Sending..." : "Send Message →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
