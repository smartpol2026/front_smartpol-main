import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { notifyStorageChange } from "../context/UserContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

// IMPORTA EL LOGO
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
      const data = await login(email, password);

      // El login() en auth.js ya guarda en localStorage
      // Notificar a UserContext que localStorage cambió
      notifyStorageChange();

      // Navegar inmediatamente
      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 p-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
        {/* Encabezado con logo */}
        <div className="text-center mb-6">
          <img src={Logo} alt="SmartPol" className="mx-auto w-32 mb-2" />
          <h2 className="text-xl font-bold">INICIAR SESIÓN</h2>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <input
              type="text"
              placeholder="Usuario"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 transition
                ${!email && error ? "border-red-500" : "border-gray-300"}`}
            />
            {!email && error && (
              <p className="text-red-500 text-xs mt-1">⚠ Campo requerido</p>
            )}
          </div>

          {/* Contraseña */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Botón ingresar */}
          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-2 rounded-md font-semibold hover:bg-orange-600 transition-colors"
          >
            INGRESAR
          </button>
        </form>
      </div>
    </div>
  );
}
