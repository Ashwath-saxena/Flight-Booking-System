// frontend/src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/flight-status", label: "Flight Status" },
];

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Smooth scroll to anchor (for future anchor links)
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = (e.target as HTMLAnchorElement).getAttribute("href");
    if (href && href.startsWith("#")) {
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      setMenuOpen(false);
    }
  };

  return (
    <motion.nav
      className="bg-white/90 shadow-lg sticky top-0 z-50 backdrop-blur transition-all duration-300"
      initial={{ opacity: 0, y: -65 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      <div className="max-w-6xl mx-auto px-4 flex justify-between items-center h-16">
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-tight text-blue-700 hover:text-blue-900 flex items-center gap-2 transition duration-300"
        >
          <motion.span
            initial={{ rotate: -15 }}
            animate={{ rotate: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 8 }}
          >
            ✈️
          </motion.span>
          Flight Booker
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="relative text-gray-700 hover:text-blue-700 font-medium transition duration-300 px-2 py-1"
              onClick={handleSmoothScroll}
            >
              <motion.span
                whileHover={{
                  scale: 1.09,
                  color: "#2563eb",
                  letterSpacing: "0.04em",
                }}
                transition={{ duration: 0.17 }}
              >
                {label}
              </motion.span>
              <motion.span
                className="absolute left-0 -bottom-0.5 h-0.5 w-full bg-blue-500 rounded origin-left scale-x-0"
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.2 }}
              />
            </Link>
          ))}
          {user && (
            <>
              <Link
                href="/profile"
                className="relative text-gray-700 hover:text-blue-700 font-medium transition duration-300 px-2 py-1"
              >
                <motion.span whileHover={{ scale: 1.09, color: "#2563eb" }}>
                  Profile
                </motion.span>
              </Link>
              <Link
                href="/bookings"
                className="relative text-gray-700 hover:text-blue-700 font-medium transition duration-300 px-2 py-1"
              >
                <motion.span whileHover={{ scale: 1.09, color: "#2563eb" }}>
                  My Bookings
                </motion.span>
              </Link>
            </>
          )}
          {user ? (
            <>
              <span className="text-gray-500 px-2">
                Hi, {user.email?.split("@")[0]}
              </span>
              <motion.button
                whileHover={{ scale: 1.04, backgroundColor: "#2563eb" }}
                whileTap={{ scale: 0.98 }}
                onClick={signOut}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition-all duration-200"
              >
                Sign Out
              </motion.button>
            </>
          ) : (
            <div className="flex gap-2">
              <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/auth/login"
                  className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition-all duration-200"
                >
                  Sign In
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/auth/register"
                  className="bg-white border border-blue-500 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-semibold shadow transition-all duration-200"
                >
                  Register
                </Link>
              </motion.div>
            </div>
          )}
        </div>
        {/* Mobile menu button */}
        <motion.button
          className="md:hidden flex items-center"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open menu"
          whileTap={{ scale: 0.93 }}
        >
          <svg
            className={`w-8 h-8 transition-transform duration-300 ${menuOpen ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <motion.path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              initial={false}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.25 }}
            />
          </svg>
        </motion.button>
      </div>
      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="md:hidden bg-white/95 shadow-xl transition-all duration-400 origin-top"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.23 }}
          >
            <div className="flex flex-col items-start px-4 py-3 gap-2">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="w-full py-2 text-gray-700 hover:text-blue-700 font-medium transition duration-300"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              {user && (
                <>
                  <Link
                    href="/profile"
                    className="w-full py-2 text-gray-700 hover:text-blue-700 font-medium transition duration-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/bookings"
                    className="w-full py-2 text-gray-700 hover:text-blue-700 font-medium transition duration-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Bookings
                  </Link>
                </>
              )}
              {user ? (
                <>
                  <span className="text-gray-500 w-full py-2">
                    Hi, {user.email?.split("@")[0]}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.04, backgroundColor: "#2563eb" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setMenuOpen(false);
                      signOut();
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition-all duration-200"
                  >
                    Sign Out
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="w-full">
                    <Link
                      href="/auth/login"
                      className="w-full block bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition-all duration-200"
                      onClick={() => setMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="w-full">
                    <Link
                      href="/auth/register"
                      className="w-full block bg-white border border-blue-500 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-semibold shadow transition-all duration-200"
                      onClick={() => setMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}