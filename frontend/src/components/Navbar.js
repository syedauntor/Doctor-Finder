import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Stethoscope, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "../AuthContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const items = [
    { name: "Home", to: "/" },
    { name: "About", to: "/about" },
    { name: "Contact", to: "/contact" },
  ];

  const linkClass = ({ isActive }) =>
    `px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? "text-teal-600 border-b-2 border-teal-600" : "text-gray-600 hover:text-teal-600"
    }`;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50" data-testid="main-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center" data-testid="navbar-logo">
            <Stethoscope className="h-8 w-8 text-teal-600" />
            <span className="ml-2 text-xl font-bold text-gray-800">Doctor Finder</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {items.map((i) => (
              <NavLink key={i.to} to={i.to} className={linkClass} data-testid={`nav-${i.name.toLowerCase()}`}>
                {i.name}
              </NavLink>
            ))}
            {user?.role === "doctor" && (
              <NavLink to="/doctor/dashboard" className={linkClass} data-testid="nav-doctor-dashboard">
                <span className="inline-flex items-center gap-1"><LayoutDashboard className="h-4 w-4" />Dashboard</span>
              </NavLink>
            )}
            {user?.role === "admin" && (
              <NavLink to="/admin/dashboard" className={linkClass} data-testid="nav-admin-dashboard">
                <span className="inline-flex items-center gap-1"><LayoutDashboard className="h-4 w-4" />Admin</span>
              </NavLink>
            )}
            {!user && (
              <NavLink to="/doctor/login" className={linkClass} data-testid="nav-doctor-login">
                Doctor Login
              </NavLink>
            )}
            {user && (
              <button onClick={handleLogout} className="px-3 py-2 text-sm text-gray-600 hover:text-red-600 inline-flex items-center gap-1" data-testid="navbar-logout-btn">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            )}
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)} data-testid="mobile-menu-toggle">
            {open ? <X className="h-6 w-6 text-gray-600" /> : <Menu className="h-6 w-6 text-gray-600" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {items.map((i) => (
              <NavLink
                key={i.to}
                to={i.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-base font-medium ${
                    isActive ? "bg-teal-50 text-teal-600" : "text-gray-600 hover:bg-gray-50"
                  }`
                }
                data-testid={`mobile-nav-${i.name.toLowerCase()}`}
              >
                {i.name}
              </NavLink>
            ))}
            {!user && (
              <NavLink to="/doctor/login" onClick={() => setOpen(false)} className="block px-3 py-2 text-gray-600">Doctor Login</NavLink>
            )}
            {user?.role === "doctor" && (
              <NavLink to="/doctor/dashboard" onClick={() => setOpen(false)} className="block px-3 py-2 text-gray-600">Dashboard</NavLink>
            )}
            {user?.role === "admin" && (
              <NavLink to="/admin/dashboard" onClick={() => setOpen(false)} className="block px-3 py-2 text-gray-600">Admin Dashboard</NavLink>
            )}
            {user && (
              <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-red-600">Logout</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
