import { Link } from "react-router-dom";
import { Stethoscope, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12" data-testid="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center mb-3">
            <Stethoscope className="h-8 w-8 text-teal-400" />
            <span className="ml-2 text-xl font-bold text-white">Doctor Finder</span>
          </div>
          <p className="text-sm text-gray-400">Connecting patients with verified healthcare professionals in Bangladesh.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-teal-400">Home</Link></li>
            <li><Link to="/about" className="hover:text-teal-400">About</Link></li>
            <li><Link to="/contact" className="hover:text-teal-400">Contact</Link></li>
            <li><Link to="/doctor/register" className="hover:text-teal-400">Register as Doctor</Link></li>
            <li><Link to="/admin/login" className="hover:text-teal-400" data-testid="footer-admin-link">Admin</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-teal-400" /> contact@doctorfinder.bd</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-teal-400" /> Emergency: 16263</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Doctor Finder. All rights reserved.
      </div>
    </footer>
  );
}
