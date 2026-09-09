import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import {
  getLeaders,
  getCandidatesByLeader,
  assignCandidatesToLeader,
} from "../api/leaders";
import { getCandidates } from "../api/candidates";

export default function AssignCandidates() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [leaders, setLeaders] = useState([]);
  const [allCandidates, setAllCandidates] = useState([]);
  const [selectedLeader, setSelectedLeader] = useState("");
  const [assignedCandidates, setAssignedCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  // Cargar datos del usuario desde localStorage
  useEffect(() => {
    const user_id = localStorage.getItem("user_id");
    const user_email = localStorage.getItem("user_email");
    const organizationId = localStorage.getItem("organizationId");
    const roleId = localStorage.getItem("roleId");

    if (user_id) {
      const user = {
        id: parseInt(user_id),
        email: user_email,
        organizationId: organizationId ? parseInt(organizationId) : null,
        roleId: roleId ? parseInt(roleId) : null,
      };
      setCurrentUser(user);
    }
  }, []);

  // Cargar líderes y candidatos
  useEffect(() => {
    const loadData = async () => {
      try {
        // Obtener todos los líderes
        const leadersData = await getLeaders();
        const candidatesData = await getCandidates();

        // Extraer el array de datos del objeto de paginación
        let leadersList = Array.isArray(leadersData)
          ? leadersData
          : leadersData?.data || [];
        let candidatesList = Array.isArray(candidatesData)
          ? candidatesData
          : candidatesData?.data || [];

        // Si es admin de campaña, filtrar solo sus líderes
        if (currentUser?.roleId === 2 && currentUser?.organizationId) {
          leadersList = leadersList.filter((leader) => {
            return (
              leader.campaign?.organizationId === currentUser.organizationId
            );
          });
          // También filtrar candidatos por organización
          candidatesList = candidatesList.filter((candidate) => {
            return (
              candidate.campaign?.organizationId === currentUser.organizationId
            );
          });
        }

        setLeaders(leadersList);
        setAllCandidates(candidatesList);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("No se pudieron cargar los datos");
      }
    };

    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  // Cuando se selecciona un líder, cargar sus candidatos asignados
  useEffect(() => {
    if (selectedLeader) {
      const loadAssignedCandidates = async () => {
        try {
          const candidates = await getCandidatesByLeader(selectedLeader);
          setAssignedCandidates(candidates);
          // Crear objeto con corporationId -> candidateId
          const selectedObj = {};
          candidates.forEach((c) => {
            if (c.corporation?.id) {
              selectedObj[c.corporation.id] = c.id;
            }
          });
          setSelectedCandidates(selectedObj);
        } catch (err) {
          console.error("Error al cargar candidatos asignados:", err);
          setAssignedCandidates([]);
          setSelectedCandidates({});
        }
      };
      loadAssignedCandidates();
    }
  }, [selectedLeader]);

  const handleCandidateToggle = (candidateId, corporationId) => {
    setSelectedCandidates((prev) => {
      // Si selecciono el mismo candidato nuevamente, deseleccionar
      if (prev[corporationId] === candidateId) {
        const newState = { ...prev };
        delete newState[corporationId];
        return newState;
      }
      // Si es diferente, reemplazar
      return { ...prev, [corporationId]: candidateId };
    });
  };

  const handleClearCorporation = (corporationId) => {
    setSelectedCandidates((prev) => {
      const newState = { ...prev };
      delete newState[corporationId];
      return newState;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLeader) {
      setError("Por favor selecciona un líder");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Convertir objeto de selecciones a array de IDs
      const candidateIds = Object.values(selectedCandidates);
      await assignCandidatesToLeader(selectedLeader, candidateIds);
      setSuccess(true);

      setTimeout(() => {
        navigate("/app/votantes");
      }, 2000);
    } catch (err) {
      setError(err.message || "Error al asignar candidatos");
    } finally {
      setLoading(false);
    }
  };

  const leaderData = leaders.find((l) => l.id === parseInt(selectedLeader));

  // Filtrar candidatos por la campaña del líder seleccionado
  const availableCandidates =
    selectedLeader && leaderData?.campaign?.id
      ? allCandidates.filter((c) => c.campaignId === leaderData.campaign.id)
      : selectedLeader
        ? []
        : allCandidates;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Asignar Candidatos a Líderes
          </h1>
          <p className="mt-2 text-gray-600">
            Selecciona un líder y elige los candidatos que deseas asignarle
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Mensajes de éxito/error */}
          {success && (
            <div className="rounded-md bg-green-50 p-4 border border-green-200">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                <p className="text-sm font-medium text-green-800">
                  ¡Candidatos asignados exitosamente! Redirigiendo...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* Selector de Líder */}
          <div>
            <label
              htmlFor="leader"
              className="block text-sm font-medium text-gray-700"
            >
              Seleccionar Líder *
            </label>
            <select
              id="leader"
              value={selectedLeader}
              onChange={(e) => setSelectedLeader(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-2"
              required
            >
              <option value="">Elige un líder</option>
              {leaders.map((leader) => (
                <option key={leader.id} value={leader.id}>
                  {leader.name} ({leader.municipality})
                </option>
              ))}
            </select>
          </div>

          {/* Info del Líder Seleccionado */}
          {leaderData && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="font-semibold text-blue-900">
                Información del Líder
              </h3>
              <p className="text-sm text-blue-800 mt-2">
                <strong>Nombre:</strong> {leaderData.name}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Documento:</strong> {leaderData.document}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Municipio:</strong> {leaderData.municipality}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Teléfono:</strong> {leaderData.phone}
              </p>
              <p className="text-sm text-blue-800 mt-2">
                <strong>Candidatos Asignados:</strong>{" "}
                {assignedCandidates.length}
              </p>
            </div>
          )}

          {/* Lista de Candidatos Agrupados por Corporación */}
          {selectedLeader && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Candidatos Disponibles por Corporación (
                {availableCandidates.length})
              </label>
              <div className="space-y-4">
                {Object.entries(
                  availableCandidates.reduce((acc, candidate) => {
                    const corpName =
                      candidate.corporation?.name || "Sin corporación";
                    const corpId = candidate.corporation?.id || 0;
                    if (!acc[corpId]) {
                      acc[corpId] = { name: corpName, candidates: [] };
                    }
                    acc[corpId].candidates.push(candidate);
                    return acc;
                  }, {}),
                ).map(([corpId, { name, candidates }]) => (
                  <div
                    key={corpId}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-orange-600">
                        {name}
                      </h3>
                      {selectedCandidates[corpId] && (
                        <button
                          type="button"
                          onClick={() =>
                            handleClearCorporation(parseInt(corpId))
                          }
                          className="text-xs px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded border border-red-200"
                        >
                          Limpiar selección
                        </button>
                      )}
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {candidates.map((candidate) => (
                        <div
                          key={candidate.id}
                          className="flex items-start p-3 hover:bg-gray-50 rounded border border-gray-100"
                        >
                          <input
                            type="radio"
                            name={`corporation-${corpId}`}
                            id={`candidate-${candidate.id}`}
                            checked={
                              selectedCandidates[corpId] === candidate.id
                            }
                            onChange={() =>
                              handleCandidateToggle(
                                candidate.id,
                                parseInt(corpId),
                              )
                            }
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 cursor-pointer mt-1"
                          />
                          <label
                            htmlFor={`candidate-${candidate.id}`}
                            className="ml-3 flex-1 cursor-pointer"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {candidate.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Partido: {candidate.party} • Número:{" "}
                              {candidate.number}
                            </p>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {availableCandidates.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No hay candidatos disponibles
                </p>
              )}
              <p className="text-sm text-gray-600 mt-4">
                <strong>{Object.keys(selectedCandidates).length}</strong>{" "}
                corporación/es con candidato seleccionado (opcional)
              </p>
            </div>
          )}

          {/* Botones de acción */}
          {selectedLeader && (
            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate("/app/votantes")}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Guardando..." : "Guardar Asignaciones"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
