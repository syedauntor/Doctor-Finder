import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = (e) => { e.preventDefault(); setSent(true); };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-10" data-testid="contact-page">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h1>
        <p className="text-gray-700 mb-6">Have questions, feedback or partnership inquiries? We'd love to hear from you.</p>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-center gap-3"><Mail className="h-5 w-5 text-teal-600" /> contact@doctorfinder.bd</li>
          <li className="flex items-center gap-3"><Phone className="h-5 w-5 text-teal-600" /> +880 1700-000000</li>
          <li className="flex items-center gap-3"><MapPin className="h-5 w-5 text-teal-600" /> Dhaka, Bangladesh</li>
        </ul>
      </div>
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-2xl shadow space-y-4 border" data-testid="contact-form">
        <h2 className="text-2xl font-bold text-gray-900">Send a Message</h2>
        {sent && <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded" data-testid="contact-success">Thanks! We'll get back to you soon.</div>}
        <input required name="name" value={form.name} onChange={handle} placeholder="Your name" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500" data-testid="contact-name" />
        <input required type="email" name="email" value={form.email} onChange={handle} placeholder="Your email" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500" data-testid="contact-email" />
        <textarea required name="message" rows="5" value={form.message} onChange={handle} placeholder="Your message" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500" data-testid="contact-message" />
        <button type="submit" className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold" data-testid="contact-submit">
          <Send className="h-4 w-4" /> Send
        </button>
      </form>
    </div>
  );
}
