import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Leer del localStorage al inicializar
    const saved = localStorage.getItem("sidebarOpen");
    return saved ? JSON.parse(saved) : false;
  });

  // Guardar en localStorage cada vez que cambia el estado
  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Contenido */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          onMenuClick={() => {
            setIsSidebarOpen((prev) => !prev);
          }}
          isSidebarOpen={isSidebarOpen}
        />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
