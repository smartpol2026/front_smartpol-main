import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { notifyStorageChange } from "../context/UserContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

import Logo from "../assets/logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      notifyStorageChange();
      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-surface">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/15 via-surface to-brand-600/10" />
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="absolute -bottom-28 -left-20 w-96 h-96 rounded-full bg-brand-600/15 blur-3xl" />

      <div className="relative bg-white rounded-3xl shadow-card border border-gray-100 p-8 w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="mx-auto mb-4 w-fit rounded-2xl bg-surface px-5 py-3 border border-gray-100">
            <img src={Logo} alt="SmartPol" className="mx-auto h-12 w-auto object-contain" />
          </div>
          <h2 className="text-xl font-bold text-ink tracking-tight">
            INICIAR SESIÓN
          </h2>
          <p className="text-sm text-ink-muted mt-1">
            Accede a tu panel de administración
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Usuario"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`app-input ${
                !email && error ? "border-red-400 focus:ring-red-300" : ""
              }`}
            />
            {!email && error && (
              <p className="text-red-500 text-xs mt-1">⚠ Campo requerido</p>
            )}
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="app-input pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          <button type="submit" className="app-btn-primary w-full py-3">
            INGRESAR
          </button>
        </form>
      </div>
    </div>
  );
}
