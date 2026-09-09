import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { Bars3Icon, KeyIcon } from "@heroicons/react/24/outline";
import ChangePasswordModal from "./ChangePasswordModal";

export default function Navbar({ onMenuClick, isSidebarOpen }) {
  const [open, setOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const email = user?.email || "Usuario";

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleChangePassword = () => {
    setOpen(false);
    setShowChangePassword(true);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-4 sm:px-6 flex items-center justify-between relative z-50">
      {/* Menu toggle - Visible en todas las pantallas */}
      <button
        onClick={onMenuClick}
        type="button"
        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Abrir/cerrar menú"
      >
        <Bars3Icon className="w-6 h-6 text-gray-700" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full
                   bg-gray-100 hover:bg-gray-200 transition-all
                   ring-1 ring-gray-200"
      >
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full bg-orange-500 text-white
                        flex items-center justify-center font-bold text-sm"
        >
          {email?.charAt(0).toUpperCase()}
        </div>

        {/* Email solo en desktop */}
        <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[160px] truncate">
          {email}
        </span>

        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-4 sm:right-6 top-16 w-56 bg-white rounded-2xl
                     shadow-xl border border-gray-100 z-50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b">
            <p className="text-xs text-gray-400">Sesión iniciada como</p>
            <p className="text-sm font-semibold text-gray-800 truncate">
              {email}
            </p>
          </div>

          <div className="p-2">
            {/* Show "Change Password" only for admins (roleId 1 or 2) */}
            {(user?.roleId === 1 || user?.roleId === 2) && (
              <button
                onClick={handleChangePassword}
                className="w-full flex items-center justify-center gap-2
                           px-4 py-2 rounded-xl mb-2
                           bg-blue-500 text-white text-sm font-medium
                           hover:bg-blue-600 transition-colors"
              >
                <KeyIcon className="w-4 h-4" />
                Cambiar Contraseña
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2
                         px-4 py-2 rounded-xl
                         bg-orange-500 text-white text-sm font-medium
                         hover:bg-orange-600 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </header>
  );
}
