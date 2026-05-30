import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Doctor Directory</h3>
            <p className="text-sm text-gray-400">
              Find and connect with qualified medical professionals in your area. Your health is our priority.
            </p>
          </div>

          <div>
            <h3 className="text-white text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate?.('home')}
                  className="text-sm hover:text-teal-400 transition-colors text-left"
                >
                  Find Doctors
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('doctor-registration')}
                  className="text-sm hover:text-teal-400 transition-colors text-left"
                >
                  Doctor Registration
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('about')}
                  className="text-sm hover:text-teal-400 transition-colors text-left"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('contact')}
                  className="text-sm hover:text-teal-400 transition-colors text-left"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-lg font-bold mb-4">For Doctors</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate?.('doctor-registration')}
                  className="text-sm hover:text-teal-400 transition-colors text-left"
                >
                  Join Our Network
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('doctor-login')}
                  className="text-sm hover:text-teal-400 transition-colors text-left"
                >
                  Doctor Login
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('dashboard')}
                  className="text-sm hover:text-teal-400 transition-colors text-left"
                >
                  Doctor Dashboard
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-lg font-bold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-2 text-teal-400" />
                <span>+880 1XXX-XXXXXX</span>
              </div>
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2 text-teal-400" />
                <span>info@doctordirectory.com</span>
              </div>
              <div className="flex items-start text-sm">
                <MapPin className="h-4 w-4 mr-2 text-teal-400 mt-1" />
                <span>Dhaka, Bangladesh</span>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <a href="#" className="hover:text-teal-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-teal-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-teal-400 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-teal-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            &copy; {currentYear} Doctor Directory. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-sm hover:text-teal-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm hover:text-teal-400 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-sm hover:text-teal-400 transition-colors">
              Cookie Policy
            </a>
            <button
              onClick={() => onNavigate?.('admin-login')}
              className="text-sm hover:text-teal-400 transition-colors text-left"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
