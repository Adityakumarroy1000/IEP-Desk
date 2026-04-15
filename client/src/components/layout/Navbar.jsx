import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const displayName = useMemo(
    () => user?.displayName || profile?.name || user?.email?.split("@")[0] || "Account",
    [profile, user]
  );
  const avatarUrl = profile?.avatar || user?.photoURL || "";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "A";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-lg font-bold text-primary">IEP Desk</Link>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-700 hover:text-primary">Dashboard</Link>
              <Link to="/documents" className="text-gray-700 hover:text-primary">Documents</Link>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-2 py-1.5 text-left transition hover:border-primary/40 hover:bg-primary-light/40"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-10 w-10 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {initials}
                    </div>
                  )}
                  <div className="hidden sm:block">
                    <div className="font-semibold text-gray-800">{displayName}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  <svg
                    className={`h-4 w-4 text-gray-500 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-lg"
                    role="menu"
                  >
                    <div className="border-b border-gray-100 px-3 py-2">
                      <div className="text-sm font-semibold text-gray-800">{displayName}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-primary"
                      role="menuitem"
                    >
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                      role="menuitem"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-primary">Login</Link>
              <Link to="/register" className="text-gray-700 hover:text-primary">Register</Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                Join Waitlist - Free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
