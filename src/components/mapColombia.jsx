import { useEffect, useMemo, useState } from "react";
import * as L from "leaflet";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getControlBoardMapPoints } from "../api/election-day";

const DEFAULT_CENTER = [4.5709, -74.2973];
const STATUS_COLORS = {
  apertura: "#0ea5e9",
  en_operacion: "#f59e0b",
  operativo: "#10b981",
  cierre: "#8b5cf6",
  sin_reporte: "#9ca3af",
};

function featureProperties(feature) {
  return feature?.properties || {};
}

function propertyValue(feature, keys) {
  const properties = featureProperties(feature);
  const entry = Object.entries(properties).find(([key]) =>
    keys.includes(key.toLowerCase()),
  );
  return entry?.[1];
}

function featureCode(feature) {
  return String(
    propertyValue(feature, [
      "divipola",
      "codigo",
      "code",
      "cod_dpto",
      "dpto_ccdgo",
      "mpio_ccdgo",
      "cod_mpio",
      "municipalitycode",
      "departmentcode",
    ]) || "",
  );
}

function featureName(feature) {
  return (
    propertyValue(feature, [
      "nombre",
      "name",
      "nom_dpto",
      "dpto_nmbre",
      "dpto_cnmbre",
      "nom_mpio",
      "mpio_nmbre",
      "municipalityname",
      "departmentname",
    ]) || "Sin nombre"
  );
}

function asFeatureCollection(value) {
  if (!value) return { type: "FeatureCollection", features: [] };
  if (value.type === "FeatureCollection") return value;
  if (value.type === "Feature") {
    return { type: "FeatureCollection", features: [value] };
  }
  return { type: "FeatureCollection", features: [] };
}

function FitBounds({ geoJson }) {
  const map = useMap();

  useEffect(() => {
    if (!geoJson?.features?.length) return;
    const layer = L.geoJSON(geoJson);
    const bounds = layer?.getBounds();
    if (bounds?.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 10 });
    }
  }, [geoJson, map]);

  return null;
}

function statusLabel(status) {
  return (
    {
      apertura: "Apertura",
      en_operacion: "En operación",
      operativo: "Operativo",
      cierre: "Cierre",
      sin_reporte: "Sin reporte",
    }[status] || String(status || "Sin reporte").replace(/_/g, " ")
  );
}

export default function MapColombia() {
  const [level, setLevel] = useState("country");
  const [department, setDepartment] = useState(null);
  const [municipality, setMunicipality] = useState(null);
  const [geoJson, setGeoJson] = useState(null);
  const [mapPoints, setMapPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPoints = async (params) => {
    try {
      const response = await getControlBoardMapPoints(params);
      const points = Array.isArray(response)
        ? response
        : response?.data || response?.points || [];
      setMapPoints(Array.isArray(points) ? points : []);
    } catch (err) {
      setMapPoints([]);
      setError(
        err.response?.data?.message ||
          err.message ||
          "No se pudieron cargar los puntos del mapa",
      );
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadCountry = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/geo/departamentos.json");
        if (!response.ok) {
          throw new Error("No se pudo cargar el mapa de Colombia");
        }
        const data = await response.json();
        if (!cancelled) setGeoJson(asFeatureCollection(data));
        await loadPoints({});
      } catch (err) {
        if (!cancelled) {
          setGeoJson(null);
          setError(err.message || "No se pudo cargar el mapa de Colombia");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (level === "country") loadCountry();
    return () => {
      cancelled = true;
    };
  }, [level]);

  useEffect(() => {
    if (level === "country" || !department) return;
    let cancelled = false;

    const loadDepartment = async () => {
      setLoading(true);
      setError("");
      try {
        const departmentCode = featureCode(department);
        const response = await fetch(`/geo/municipios/${departmentCode}.json`);
        if (!response.ok) {
          throw new Error("No se pudo cargar el mapa del departamento");
        }
        const data = asFeatureCollection(await response.json());
        if (!cancelled) {
          setGeoJson(
            level === "municipality" && municipality
              ? {
                  type: "FeatureCollection",
                  features: data.features.filter(
                    (feature) =>
                      featureCode(feature) === featureCode(municipality),
                  ),
                }
              : data,
          );
        }
        await loadPoints({
          departmentCode,
          ...(level === "municipality" && municipality
            ? { municipalityCode: featureCode(municipality) }
            : {}),
        });
      } catch (err) {
        if (!cancelled) {
          setGeoJson(null);
          setError(err.message || "No se pudo cargar el mapa");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDepartment();
    return () => {
      cancelled = true;
    };
  }, [department, level, municipality]);

  const selectedFeature = useMemo(() => {
    if (level === "municipality") return municipality;
    if (level === "department") return department;
    return null;
  }, [department, level, municipality]);

  const handleDepartmentClick = (feature) => {
    setDepartment(feature);
    setMunicipality(null);
    setLevel("department");
  };

  const handleMunicipalityClick = (feature) => {
    setMunicipality(feature);
    setLevel("municipality");
  };

  const goTo = (nextLevel) => {
    if (nextLevel === "country") {
      setDepartment(null);
      setMunicipality(null);
      setLevel("country");
    } else if (nextLevel === "department") {
      setMunicipality(null);
      setLevel("department");
    }
  };

  const pointCoordinates = (point) => {
    const latitude = Number(point.latitude ?? point.lat);
    const longitude = Number(point.longitude ?? point.lng ?? point.lon);
    return Number.isFinite(latitude) && Number.isFinite(longitude)
      ? [latitude, longitude]
      : null;
  };

  return (
    <div className="app-card overflow-hidden p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button
            type="button"
            onClick={() => goTo("country")}
            className="hover:text-brand-600"
          >
            Colombia
          </button>
          {department && (
            <>
              <span>›</span>
              <button
                type="button"
                onClick={() => goTo("department")}
                className="hover:text-brand-600"
              >
                {featureName(department)}
              </button>
            </>
          )}
          {municipality && (
            <>
              <span>›</span>
              <span className="font-semibold text-gray-900">
                {featureName(municipality)}
              </span>
            </>
          )}
        </div>
        {loading && (
          <span className="text-xs text-gray-500">Cargando mapa...</span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={5}
        scrollWheelZoom
        className="h-[32rem] w-full bg-transparent"
      >
        <FitBounds geoJson={geoJson} />
        {geoJson && (
          <GeoJSON
            key={`${level}-${featureCode(selectedFeature) || "country"}`}
            data={geoJson}
            style={() => ({
              fillColor: "#f3f4f6",
              fillOpacity: 0.8,
              color: "#111111",
              weight: 1,
            })}
            eventHandlers={{
              click: (event) => {
                if (level === "country") {
                  handleDepartmentClick(event.layer?.feature);
                }
                if (level === "department") {
                  handleMunicipalityClick(event.layer?.feature);
                }
              },
              mouseover: (event) =>
                event.layer.setStyle({ fillColor: "#d1d5db" }),
              mouseout: (event) =>
                event.layer.setStyle({ fillColor: "#f3f4f6" }),
            }}
          />
        )}
        {mapPoints.map((point, index) => {
          const coordinates = pointCoordinates(point);
          if (!coordinates) return null;
          const status = point.status || "sin_reporte";
          return (
            <CircleMarker
              key={
                point.id ||
                `${point.votingBoothId}-${point.tableNumber}-${index}`
              }
              center={coordinates}
              radius={7}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: STATUS_COLORS[status] || STATUS_COLORS.sin_reporte,
                fillOpacity: 1,
              }}
            >
              <Popup>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">
                    {point.votingBoothName || point.boothName || "Puesto"}
                  </p>
                  <p>Mesa: {point.tableNumber ?? "-"}</p>
                  <p>Estado: {statusLabel(status)}</p>
                  <p>Novedades: {point.noveltiesCount ?? 0}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
