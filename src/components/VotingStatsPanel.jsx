import React, { useState, useEffect } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import VotingStatsCounters from "./VotingStatsCounters";

export default function VotingStatsPanel({ refreshTrigger }) {
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    // Trigger a refresh by updating the timestamp
    setLastUpdate(new Date());
    // Simulate a small delay for visual feedback
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Día D - Panel de Votación
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            title="Actualizar ahora"
          >
            <ArrowPathIcon
              className={`w-5 h-5 text-blue-600 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Actualizado: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Voting Stats Counters Component */}
      <VotingStatsCounters refreshTrigger={refreshTrigger} />
    </div>
  );
}
