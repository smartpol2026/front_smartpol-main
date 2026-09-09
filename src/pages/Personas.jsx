import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  getVotersWithAssignments,
  getVotersByCandidateWithAssignments,
  getVotersByLeaderWithAssignments,
  deleteVoter,
  getAllVotersWithAssignments,
  searchVotersByNameOrIdentification,
} from "../api/voters";
import { getCandidateByUserId } from "../api/candidates";
import { getLeaderByUserId } from "../api/leaders";
import { getVotingBooths } from "../api/votingbooths";
import AddVoterModal from "../components/AddVoterModal";
import Pagination from "../components/Pagination";
import { ProtectedComponent } from "../components/ProtectedComponent";
import { usePermission } from "../hooks/usePermission";
import { useAlert } from "../hooks/useAlert";
import { useUser } from "../context/UserContext";
import AddButton from "../components/AddButton";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function Personas() {
  const { can } = usePermission();
  const { user } = useUser();
  const alert = useAlert();
  const location = useLocation();
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingVoter, setEditingVoter] = useState(null);
  const [search, setSearch] = useState("");
  const [voterCandidates, setVoterCandidates] = useState({});
  const [voterLeaders, setVoterLeaders] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVoters, setTotalVoters] = useState(0);
  const [boothsMap, setBoothsMap] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [candidateId, setCandidateId] = useState(null);
  const [loadingCandidateId, setLoadingCandidateId] = useState(
    user?.roleId === 3,
  );
  const [leaderId, setLeaderId] = useState(null);
  const [loadingLeaderId, setLoadingLeaderId] = useState(user?.roleId === 4);
  const ITEMS_PER_PAGE = 20;
  const previousLocationKeyRef = useRef(location.key);
  const abortControllerRef = useRef(null);

  // Cargar centros de votación, candidateId si es candidato y leaderId si es líder
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar centros
        const booths = await getVotingBooths();
        const boothsMapTemp = {};
        booths.forEach((booth) => {
          boothsMapTemp[booth.id] = booth;
        });
        setBoothsMap(boothsMapTemp);

        // Si es candidato, obtener su candidateId
        if (user?.roleId === 3) {
          try {
            const candidate = await getCandidateByUserId(user.id);
            if (candidate?.id) {
              setCandidateId(candidate.id);
            }
          } catch (err) {
            console.error("Error loading candidate:", err);
          } finally {
            setLoadingCandidateId(false);
          }
        } else {
          setCandidateId(null);
          setLoadingCandidateId(false);
        }

        // Si es líder, obtener su leaderId
        if (user?.roleId === 4) {
          try {
            const leader = await getLeaderByUserId(user.id);
            if (leader?.id) {
              setLeaderId(leader.id);
            }
          } catch (err) {
            console.error("Error loading leader:", err);
          } finally {
            setLoadingLeaderId(false);
          }
        } else {
          setLeaderId(null);
          setLoadingLeaderId(false);
        }
      } catch (err) {
        // Error handling without logging
        setLoadingCandidateId(false);
        setLoadingLeaderId(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const fetchVoters = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      // Obtener votantes según el rol del usuario:
      // - Candidato: solo sus votantes
      // - Líder: solo sus votantes
      // - Admin de campaña: votantes de su organización (candidatos, líderes, digitadores)
      // - Digitador: votantes que él creó
      const data =
        user?.roleId === 3 && candidateId
          ? await getVotersByCandidateWithAssignments(
              candidateId,
              page,
              ITEMS_PER_PAGE,
            )
          : user?.roleId === 4 && leaderId
            ? await getVotersByLeaderWithAssignments(
                leaderId,
                page,
                ITEMS_PER_PAGE,
              )
            : await getVotersWithAssignments(page, ITEMS_PER_PAGE);

      setVoters(data.data);
      setCurrentPage(data.page);
      setTotalPages(data.pages);
      setTotalVoters(data.total);

      // Extraer candidatos y líderes de la respuesta
      const candidatesMap = {};
      const leadersMap = {};

      data.data.forEach((voter) => {
        // Mapear candidatos
        if (voter.candidates && voter.candidates.length > 0) {
          candidatesMap[voter.id] = voter.candidates
            .map((c) => c.name)
            .filter(Boolean);
        }

        // Mapear líderes (tomar el primero)
        if (voter.leaders && voter.leaders.length > 0) {
          leadersMap[voter.id] = voter.leaders[0].name;
        }
      });

      setVoterCandidates(candidatesMap);
      setVoterLeaders(leadersMap);
    } catch {
      setError("No se pudieron cargar los votantes");
    } finally {
      setLoading(false);
    }
  };

  const fetchSearchResults = async (page = 1) => {
    if (!search.trim()) {
      return;
    }

    // Cancelar búsqueda anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();

    setIsSearching(true);
    try {
      // El backend filtra automáticamente por rol del usuario
      // - Candidato: solo sus votantes
      // - Líder: solo sus votantes
      // - Admin: todos los votantes
      const response = await searchVotersByNameOrIdentification(
        search.trim(),
        page,
        ITEMS_PER_PAGE,
      );

      setVoters(response.data || []);
      setTotalVoters(response.total || 0);
      setTotalPages(response.pages || 0);
      setCurrentPage(page);

      // Extraer candidatos y líderes de la response
      const candidatesMap = {};
      const leadersMap = {};

      (response.data || []).forEach((voter) => {
        // Mapear candidatos
        if (voter.candidates && voter.candidates.length > 0) {
          candidatesMap[voter.id] = voter.candidates
            .map((c) => c.name)
            .filter(Boolean);
        }

        // Mapear líderes (tomar el primero)
        if (voter.leaders && voter.leaders.length > 0) {
          leadersMap[voter.id] = voter.leaders[0].name;
        }
      });

      setVoterCandidates(candidatesMap);
      setVoterLeaders(leadersMap);
    } catch (err) {
      // No mostrar error si fue cancelado por AbortController
      if (err.name !== "AbortError") {
        setError("No se pudieron cargar los resultados de búsqueda");
      }
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    // Si es candidato y aún está cargando el candidateId, no ejecutar
    if (user?.roleId === 3 && loadingCandidateId) {
      return;
    }
    // Si es candidato pero no tiene candidateId, no ejecutar
    if (user?.roleId === 3 && !candidateId) {
      return;
    }
    // Si es líder y aún está cargando el leaderId, no ejecutar
    if (user?.roleId === 4 && loadingLeaderId) {
      return;
    }
    // Si es líder pero no tiene leaderId, no ejecutar
    if (user?.roleId === 4 && !leaderId) {
      return;
    }
    fetchVoters(currentPage);
  }, [
    currentPage,
    candidateId ?? null,
    loadingCandidateId,
    leaderId ?? null,
    loadingLeaderId,
  ]);

  // Cargar resultados cuando el usuario busca o reiniciar cuando borra la búsqueda
  useEffect(() => {
    if (search.trim()) {
      // Si hay búsqueda, cargar resultados de búsqueda desde página 1
      setCurrentPage(1);
      fetchSearchResults(1);
    } else {
      // Si la búsqueda está vacía, cancelar búsqueda anterior y volver a la lista normal
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setCurrentPage(1);
      fetchVoters(1);
    }
  }, [search]);

  // Refrescar cuando se llega desde la creación o cuando se clickea en el sidebar de Votantes
  useEffect(() => {
    // Detectar si el usuario hizo click en el enlace del sidebar nuevamente
    const isNewNavigation = previousLocationKeyRef.current !== location.key;
    previousLocationKeyRef.current = location.key;

    // Resetear a página 1 si es una nueva navegación a la ruta de votantes
    if (isNewNavigation && location.pathname === "/app/votantes") {
      setCurrentPage(1);
      setSearch("");
    }

    if (location.state?.refresh) {
      // Si es candidato, esperar a que candidateId esté cargado
      if (user?.roleId === 3) {
        if (!loadingCandidateId && candidateId) {
          setCurrentPage(1);
          setSearch("");
          fetchVoters(1);
        }
      } else if (user?.roleId === 4) {
        if (!loadingLeaderId && leaderId) {
          setCurrentPage(1);
          setSearch("");
          fetchVoters(1);
        }
      } else {
        setCurrentPage(1);
        setSearch("");
        fetchVoters(1);
      }
    }
  }, [
    location.key,
    location.pathname,
    location.state?.refresh,
    candidateId ?? null,
    loadingCandidateId,
    leaderId ?? null,
    loadingLeaderId,
  ]);

  const handleEdit = (voter) => {
    setEditingVoter(voter);
    setShowModal(true);
  };

  const handleVoterSaved = async () => {
    // Resetear búsqueda y estado completamente
    setSearch("");
    setCurrentPage(1);
    setVoterCandidates({});
    setVoterLeaders({});
    setShowModal(false);
    setEditingVoter(null);

    // Recargar la primera página
    await fetchVoters(1);
  };

  const handleDelete = async (voterId) => {
    const result = await alert.confirm(
      "¿Estás seguro de que deseas eliminar este votante?",
      "Confirmar eliminación",
      "Sí, eliminar",
      "Cancelar",
    );
    if (!result.isConfirmed) return;

    try {
      await deleteVoter(voterId);
      alert.success("Votante eliminado exitosamente");

      // Recargar la página después de 1.5 segundos
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      alert.apiError(err, "Error al eliminar votante");
    }
  };

  const enrichVoterData = (voter) => {
    let enriched = { ...voter };

    // Enriquecer con centro de votación
    if (voter.votingBoothId && boothsMap[voter.votingBoothId]) {
      enriched.votingBooth = boothsMap[voter.votingBoothId];
    }

    return enriched;
  };

  const filteredVoters = voters.map(enrichVoterData);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Listado de Votantes</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xl">
            Gestión y control estratégico de personas registradas en la campaña
          </p>
        </div>

        <AddButton
          label="Agregar votante"
          onClick={() => {
            setEditingVoter(null);
            setShowModal(true);
          }}
          disabled={!can("voters:manage") && !can("voters:create")}
          title={
            !can("voters:manage") && !can("voters:create")
              ? "No tienes permiso para crear votantes"
              : ""
          }
        />
      </div>

      {/* Buscador */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Buscar por nombre o identificación..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-96 px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-orange-500/30 focus:outline-none"
        />
      </div>

      {/* Modal */}
      {showModal && (
        <AddVoterModal
          voter={editingVoter}
          onClose={() => setShowModal(false)}
          onVoterAdded={handleVoterSaved}
        />
      )}

      {/* Estados */}
      {loading && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm text-sm sm:text-base">
          Cargando votantes...
        </div>
      )}

      {error && (
        <div className="bg-white p-4 sm:p-6 rounded-xl text-red-600 text-sm sm:text-base">
          {error}
        </div>
      )}

      {!loading && !error && filteredVoters.length === 0 && (
        <div className="bg-white p-4 sm:p-6 rounded-xl text-gray-500 text-sm sm:text-base">
          No se encontraron resultados
        </div>
      )}

      {/* ===== DESKTOP ===== */}
      {!loading && !error && filteredVoters.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  {[
                    "Nombre",
                    "Identificación",
                    "Correo",
                    "Teléfono",
                    "Centro de Votación",
                    "Líder",
                    "Candidatos",
                    "Acciones",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 lg:px-6 py-3 lg:py-4 text-xs font-bold text-gray-700 uppercase tracking-wide text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredVoters.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm font-semibold text-gray-900">
                      {v.firstName} {v.lastName}
                    </td>

                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm font-medium text-gray-800">
                      {v.identification || "No registrado"}
                    </td>

                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-700">
                      {v.email || "No registrado"}
                    </td>

                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-700 whitespace-nowrap">
                      {v.phone || "No registrado"}
                    </td>

                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-700 font-semibold">
                      {v.votingBooth?.name && v.votingTableId
                        ? `${v.votingBooth.name} - ${v.votingTableId}`
                        : v.votingBooth?.name || "No registrado"}
                    </td>

                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-700 font-semibold">
                      {voterLeaders[v.id] ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          {voterLeaders[v.id]}
                        </span>
                      ) : (
                        <span className="text-gray-400">No asignado</span>
                      )}
                    </td>

                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-700">
                      {voterCandidates[v.id] &&
                      voterCandidates[v.id].length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {voterCandidates[v.id].map((candidateName, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 whitespace-nowrap w-fit"
                            >
                              {candidateName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">No asignado</span>
                      )}
                    </td>

                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm flex gap-3 lg:gap-4">
                      {(can("voters:manage") || can("voters:update")) && (
                        <button
                          onClick={() => handleEdit(v)}
                          className="text-gray-400 hover:text-orange-500 transition"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                      )}
                      {(can("voters:manage") || can("voters:delete")) && (
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="text-gray-400 hover:text-red-500 transition"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                      {!can("voters:manage") &&
                        !can("voters:update") &&
                        !can("voters:delete") && (
                          <span className="text-gray-300 text-sm">
                            Sin acceso
                          </span>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls - Desktop */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={search ? fetchSearchResults : setCurrentPage}
              totalItems={totalVoters}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
        </div>
      )}

      {/* ===== MOBILE ===== */}
      {!loading && !error && (
        <div className="md:hidden space-y-3 sm:space-y-4">
          {filteredVoters.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-xl shadow-md p-3 sm:p-4 border border-gray-200"
            >
              <div className="font-bold text-gray-900 text-base sm:text-lg">
                {v.firstName} {v.lastName}
              </div>

              <div className="text-xs sm:text-sm text-gray-700 mt-3 space-y-2">
                <div>
                  <b>ID:</b> {v.identification || "No registrado"}
                </div>
                <div>
                  <b>Email:</b> {v.email || "No registrado"}
                </div>
                <div>
                  <b>Tel:</b> {v.phone || "No registrado"}
                </div>
                <div>
                  <b>Centro de Votación:</b>{" "}
                  {v.votingBooth?.name && v.votingTableId
                    ? `${v.votingBooth.name} - ${v.votingTableId}`
                    : v.votingBooth?.name || "No registrado"}
                </div>
                <div>
                  <b>Líder:</b>{" "}
                  {voterLeaders[v.id] ? (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 font-semibold inline-block ml-2">
                      {voterLeaders[v.id]}
                    </span>
                  ) : (
                    <span className="text-gray-400">No asignado</span>
                  )}
                </div>
                <div>
                  <b>Candidatos:</b>{" "}
                  {voterCandidates[v.id] && voterCandidates[v.id].length > 0 ? (
                    <div className="flex flex-col gap-2 mt-2">
                      {voterCandidates[v.id].map((candidateName, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-semibold w-fit"
                        >
                          {candidateName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">No asignado</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 sm:gap-3 lg:gap-4 mt-3 sm:mt-4">
                {can("voters:update") && (
                  <button
                    onClick={() => handleEdit(v)}
                    className="text-gray-400 hover:text-orange-500 transition"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                )}
                {can("voters:delete") && (
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Pagination Controls - Mobile */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={search ? fetchSearchResults : setCurrentPage}
              totalItems={totalVoters}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
        </div>
      )}
    </>
  );
}
