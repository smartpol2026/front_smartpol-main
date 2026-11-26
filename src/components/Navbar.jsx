import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { Bars3Icon, KeyIcon } from "@heroicons/react/24/outline";
import ChangePasswordModal from "./ChangePasswordModal";

export default function Navbar({ onMenuClick }) {
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
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-gray-100/80 px-4 sm:px-6 flex items-center justify-between relative z-50 shadow-soft">
      <button
        onClick={onMenuClick}
        type="button"
        className="p-2.5 rounded-xl hover:bg-surface-muted text-ink-soft hover:text-ink transition-colors"
        aria-label="Abrir/cerrar menú"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      <div className="flex-1" />

      <button
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 rounded-full
                   bg-surface hover:bg-surface-muted transition-all
                   border border-gray-100"
      >
        <div
          className="w-8 h-8 rounded-full bg-brand-500 text-white
                        flex items-center justify-center font-bold text-sm shadow-soft"
        >
          {email?.charAt(0).toUpperCase()}
        </div>

        <span className="hidden sm:block text-sm font-semibold text-ink max-w-[160px] truncate">
          {email}
        </span>

        <svg
          className={`w-4 h-4 text-ink-muted transition-transform ${
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

      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-4 sm:right-6 top-16 w-56 bg-white rounded-2xl
                     shadow-card border border-gray-100 z-50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-gray-100 bg-surface/60">
            <p className="text-xs text-ink-muted">Sesión iniciada como</p>
            <p className="text-sm font-semibold text-ink truncate">{email}</p>
          </div>

          <div className="p-2">
            {(user?.roleId === 1 || user?.roleId === 2) && (
              <button
                onClick={handleChangePassword}
                className="w-full flex items-center justify-center gap-2
                           px-4 py-2.5 rounded-xl mb-2
                           bg-surface text-ink text-sm font-semibold
                           hover:bg-surface-muted transition-colors border border-gray-100"
              >
                <KeyIcon className="w-4 h-4 text-brand-500" />
                Cambiar Contraseña
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2
                         px-4 py-2.5 rounded-xl
                         bg-brand-500 text-white text-sm font-semibold
                         hover:bg-brand-600 transition-colors shadow-soft"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </header>
  );
}
