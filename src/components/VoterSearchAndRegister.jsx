import React, { useState } from "react";
import {
  searchVoterByIdentificationForDiaD,
  registerVote,
  unregisterVote,
} from "../api/voters";
import { useAlert } from "../hooks/useAlert";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export default function VoterSearchAndRegister({ onVoteRegistered }) {
  const [identification, setIdentification] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const alert = useAlert();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!identification.trim()) {
      alert.warning("Por favor, ingresa una cédula");
      return;
    }

    setLoading(true);
    try {
      const result = await searchVoterByIdentificationForDiaD(identification);
      setSearchResult(result);

      if (result.status === "not_found") {
        alert.warning("Votante no encontrado");
      }
    } catch (error) {
      alert.error("Error al buscar votante: " + error.message);
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterVote = async () => {
    if (!searchResult?.voter) return;

    const voter = searchResult.voter;
    const result = await alert.confirm(
      `¿Estás seguro de que deseas registrar el voto de ${voter.firstName} ${voter.lastName}?`,
      "Confirmar Registro",
      "Sí, registrar",
      "Cancelar",
    );

    if (!result.isConfirmed) return;

    setRegistering(true);
    try {
      const response = await registerVote(identification);
      alert.success(
        `Voto registrado para ${response.firstName} ${response.lastName}`,
      );

      // Pequeño delay para asegurar la persistencia en BD
      await new Promise((resolve) => setTimeout(resolve, 300));

      setIdentification("");
      setSearchResult(null);

      // Callback para actualizar el padre (panel de contadores)
      if (onVoteRegistered) {
        onVoteRegistered();
      }
    } catch (error) {
      if (error.message?.includes("ya ha votado")) {
        alert.warning("Este votante ya ha registrado su voto");
      } else {
        alert.error("Error al registrar voto: " + error.message);
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregisterVote = async () => {
    if (!searchResult?.voter) return;

    const voter = searchResult.voter;
    const result = await alert.confirm(
      `¿Estás seguro de que deseas eliminar el voto de ${voter.firstName} ${voter.lastName}? Volverá al estado pendiente.`,
      "Eliminar Voto",
      "Sí, eliminar",
      "Cancelar",
    );

    if (!result.isConfirmed) return;

    setRegistering(true);
    try {
      const response = await unregisterVote(identification);
      alert.success(
        `Voto eliminado para ${response.firstName} ${response.lastName}`,
      );

      // Pequeño delay para asegurar la persistencia en BD
      await new Promise((resolve) => setTimeout(resolve, 300));

      setIdentification("");
      setSearchResult(null);

      // Callback para actualizar el padre (panel de contadores)
      if (onVoteRegistered) {
        onVoteRegistered();
      }
    } catch (error) {
      if (error.message?.includes("no ha registrado")) {
        alert.warning("Este votante no ha registrado su voto");
      } else {
        alert.error("Error al eliminar voto: " + error.message);
      }
    } finally {
      setRegistering(false);
    }
  };

  const renderVoterInfo = () => {
    if (!searchResult || searchResult.status === "not_found") {
      return null;
    }

    if (searchResult.status === "assigned") {
      const voter = searchResult.voter;
      return (
        <div
          className={`mt-6 p-6 sm:p-7 rounded-xl border-2 ${
            voter.hasVoted
              ? "bg-green-50 border-green-300"
              : "bg-orange-50 border-orange-300"
          }`}
        >
          <div className="flex items-center gap-3 mb-5">
            {voter.hasVoted ? (
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            ) : (
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
            )}
            <h3
              className={`text-lg font-bold ${
                voter.hasVoted ? "text-green-900" : "text-orange-900"
              }`}
            >
              {voter.hasVoted ? "✓ Voto Registrado" : "⏳ Voto Pendiente"}
            </h3>
          </div>

          {/* Voter Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
            <div className="bg-white bg-opacity-60 p-3 rounded-lg">
              <span className="text-gray-600 text-xs font-medium block mb-1">
                Nombre Completo
              </span>
              <p className="font-bold text-gray-900">
                {voter.firstName} {voter.lastName}
              </p>
            </div>
            <div className="bg-white bg-opacity-60 p-3 rounded-lg">
              <span className="text-gray-600 text-xs font-medium block mb-1">
                Cédula
              </span>
              <p className="font-bold text-gray-900 font-mono">
                {voter.identification}
              </p>
            </div>
            <div className="bg-white bg-opacity-60 p-3 rounded-lg">
              <span className="text-gray-600 text-xs font-medium block mb-1">
                Género
              </span>
              <p className="font-bold text-gray-900">
                {voter.gender === "M" ? "👨 Masculino" : "👩 Femenino"}
              </p>
            </div>
            <div className="bg-white bg-opacity-60 p-3 rounded-lg">
              <span className="text-gray-600 text-xs font-medium block mb-1">
                Grupo Sanguíneo
              </span>
              <p className="font-bold text-gray-900">{voter.bloodType}</p>
            </div>
            <div className="bg-white bg-opacity-60 p-3 rounded-lg">
              <span className="text-gray-600 text-xs font-medium block mb-1">
                Teléfono
              </span>
              <p className="font-bold text-gray-900">{voter.phone}</p>
            </div>
            <div className="bg-white bg-opacity-60 p-3 rounded-lg">
              <span className="text-gray-600 text-xs font-medium block mb-1">
                Email
              </span>
              <p className="font-bold text-gray-900 text-xs truncate">
                {voter.email || "No disponible"}
              </p>
            </div>
          </div>

          {/* Assigned Leader */}
          {searchResult.assignedLeader && (
            <div className="mb-4 p-4 bg-white bg-opacity-70 rounded-lg border border-current border-opacity-20">
              <p className="text-xs font-semibold text-gray-600 mb-1">
                👤 Líder Asignado
              </p>
              <p className="font-bold text-gray-900">
                {searchResult.assignedLeader.name}
              </p>
            </div>
          )}

          {/* Assigned Candidates */}
          {searchResult.assignedCandidates &&
            searchResult.assignedCandidates.length > 0 && (
              <div className="mb-6 p-4 bg-white bg-opacity-70 rounded-lg border border-current border-opacity-20">
                <p className="text-xs font-semibold text-gray-600 mb-3">
                  🗳️ Candidatos Asignados
                </p>
                <div className="space-y-2">
                  {searchResult.assignedCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="font-medium text-gray-900">
                        {candidate.name}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                        {candidate.party}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Action Button */}
          <button
            onClick={() =>
              voter.hasVoted ? handleUnregisterVote() : handleRegisterVote()
            }
            disabled={registering}
            className={`w-full font-bold py-3 sm:py-4 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2 text-white ${
              voter.hasVoted
                ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-400"
                : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400"
            }`}
          >
            {voter.hasVoted ? (
              <>
                <TrashIcon className="w-5 h-5" />
                {registering ? "Eliminando..." : "Eliminar Voto"}
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                {registering ? "Registrando..." : "Registrar Voto"}
              </>
            )}
          </button>
        </div>
      );
    }

    if (searchResult.status === "in_history") {
      const data = searchResult.votersHistoryData;
      return (
        <div className="mt-6 p-6 sm:p-7 rounded-xl bg-yellow-50 border-2 border-yellow-300">
          <div className="flex items-center gap-3 mb-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
            <h3 className="text-lg font-bold text-yellow-900">
              ⚠️ En Historial
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
            <div className="bg-white bg-opacity-60 p-3 rounded-lg">
              <span className="text-gray-600 text-xs font-medium block mb-1">
                Nombre
              </span>
              <p className="font-bold text-gray-900">
                {data.firstName} {data.lastName}
              </p>
            </div>
            <div className="bg-white bg-opacity-60 p-3 rounded-lg">
              <span className="text-gray-600 text-xs font-medium block mb-1">
                Cédula
              </span>
              <p className="font-bold text-gray-900 font-mono">
                {data.identification}
              </p>
            </div>
          </div>
          <div className="bg-yellow-100 border-l-4 border-yellow-600 p-3 rounded text-sm text-yellow-800 font-medium">
            ℹ️ Este votante se encuentra en el historial pero no está activo en
            el sistema actual.
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={identification}
              onChange={(e) => setIdentification(e.target.value.toUpperCase())}
              placeholder="Ej: 1234567890"
              className="w-full pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition text-base sm:text-lg font-medium"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition duration-300 flex items-center gap-2 whitespace-nowrap shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                <span className="hidden sm:inline">Buscando...</span>
              </>
            ) : (
              <>
                <MagnifyingGlassIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Buscar</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Search Results */}
      {renderVoterInfo()}
    </div>
  );
}
