import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapSection.css"; // We will create this for animations
import { LocationPinIcon, StudentIcon } from "./Icons";

const createBusIcon = (color, label) =>
  L.divIcon({
    className: "bus-pin",
    html: `<div class="bus-pin__inner" style="--pin:${color}"><span>${label}</span></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 34],
    popupAnchor: [0, -30],
  });

const destinationIcon = L.divIcon({
  className: "destination-pin",
  html: `<div class="destination-pin__inner"><span>BIT</span></div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 38],
  popupAnchor: [0, -32],
});

const BIT = [11.5196, 77.3408]; // Accurate BIT Coordinates

const interpolate = (start, end, t) => ([
  start[0] + (end[0] - start[0]) * t,
  start[1] + (end[1] - start[1]) * t,
]);

const buildStops = (start, end, names) =>
  names.map((name, idx) => ({
    name,
    position: interpolate(start, end, names.length === 1 ? 0 : idx / (names.length - 1))
  }));

const sathyToGobiStops = buildStops(
  BIT,
  [11.4539, 77.4425],
  [
    "Bannari Amman College",
    "Sathyamangalam Bus Stand",
    "Pudukadu",
    "Kodiveri",
    "Kunjappanai",
    "Kasipalayam",
    "Ariyappampalayam",
    "Ganapathypalayam",
    "Gobi Arts College (Near)",
    "Elathur",
    "Amala School",
    "Kacherimedu",
    "Nambiyur",
    "Savandapur",
    "Gobi Bus Stand"
  ]
);

const busRoutes = [
  {
    id: 12,
    name: "Bus 12",
    routeName: "Sathyamangalam Route",
    color: "#e53e3e",
    stops: sathyToGobiStops,
  },
  {
    id: 5,
    name: "Bus 05",
    routeName: "Coimbatore Route",
    color: "#3182ce",
    stops: buildStops(
      [11.0168, 76.9558],
      [11.5196, 77.3408],
      [
        "Coimbatore",
        "Gandhipuram",
        "RS Puram",
        "Peelamedu",
        "Singanallur",
        "Sulur",
        "Kangeyam",
        "Avinashi",
        "Perundurai",
        "Nambiyur",
        "Sathyamangalam"
      ]
    ),
  },
  {
    id: 8,
    name: "Bus 08",
    routeName: "Erode Route",
    color: "#38a169",
    stops: buildStops(
      [11.3410, 77.7172],
      [11.4539, 77.4425],
      [
        "Erode",
        "Perundurai",
        "Chithode",
        "Nasiyanoor",
        "Kanjikoil",
        "Nambiyur",
        "Gobichettipalayam",
        "Kallipatti",
        "Kurumandur"
      ]
    ),
  },
  {
    id: 15,
    name: "Bus 15",
    routeName: "Salem Route",
    color: "#dd6b20",
    stops: buildStops(
      [11.6643, 78.1460],
      [11.5196, 77.3408],
      [
        "Salem",
        "Seelanaickenpatti",
        "Omalur",
        "Tharamangalam",
        "Sankari",
        "Bhavani",
        "Kavindapadi",
        "Chithode",
        "Sathyamangalam"
      ]
    ),
  },
];

const getPointAlongPath = (path, t) => {
  if (!path.length) return BIT;
  if (path.length === 1) return path[0];
  const distances = [];
  let total = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    const dx = path[i + 1][0] - path[i][0];
    const dy = path[i + 1][1] - path[i][1];
    const d = Math.sqrt(dx * dx + dy * dy);
    distances.push(d);
    total += d;
  }
  const target = total * t;
  let acc = 0;
  for (let i = 0; i < distances.length; i += 1) {
    const seg = distances[i];
    if (acc + seg >= target) {
      const segT = (target - acc) / (seg || 1);
      return interpolate(path[i], path[i + 1], segT);
    }
    acc += seg;
  }
  return path[path.length - 1];
};

const formatBusId = (id) => String(id).padStart(2, "0");

function MapResizer({ watchKeys = [] }) {
  const map = useMap();
  const watchKey = watchKeys.join("|");

  useEffect(() => {
    const invalidate = () => {
      window.requestAnimationFrame(() => {
        map.invalidateSize();
      });
    };

    invalidate();

    const timeoutId = window.setTimeout(invalidate, 250);
    window.addEventListener("resize", invalidate);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", invalidate);
    };
  }, [map, watchKey]);

  return null;
}

export default function MapSection({ driverLocation = null }) {
  const [activeRoute, setActiveRoute] = useState("all");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [busProgress, setBusProgress] = useState(() =>
    busRoutes.map((b) => ({ id: b.id, progress: Math.random() * 0.6 + 0.1, speed: 0.0005 + Math.random() * 0.0003 }))
  );

  const routePaths = useMemo(() => {
    return busRoutes.reduce((acc, r) => {
      acc[r.id] = r.stops.map((s) => s.position);
      return acc;
    }, {});
  }, []);

  // Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setBusProgress((prev) =>
        prev.map((b) => {
          const next = b.progress + b.speed;
          return { ...b, progress: next > 1 ? 0 : next };
        })
      );
    }, 250);
    return () => clearInterval(interval);
  }, []);

  const filteredRoutes = activeRoute === "all"
    ? busRoutes
    : busRoutes.filter((r) => r.id === activeRoute);

  const showAllStops = true;
  const activeBus = activeRoute === "all" ? null : busRoutes.find((b) => b.id === activeRoute);
  const driverIcon = useMemo(
    () =>
      L.divIcon({
        className: "bus-pin",
        html: `<div class="bus-pin__inner" style="--pin:#d89a10"><span>ME</span></div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 34],
        popupAnchor: [0, -30],
      }),
    []
  );

  return (
    <div className="card map-card">
      <div className="route-selector">
        <button
          className={`route-chip route-chip-all ${activeRoute === "all" ? "active" : ""}`}
          onClick={() => {
            setActiveRoute("all");
            setIsPanelOpen(false);
          }}
        >
          <span className="chip-title">All Buses</span>
        </button>
        {busRoutes.map((r) => {
          const eta = Math.max(6, Math.round((1 - (busProgress.find((b) => b.id === r.id)?.progress || 0)) * 20));
          return (
            <button
              key={r.id}
              className={`route-chip ${activeRoute === r.id ? "active" : ""}`}
              onClick={() => {
                setActiveRoute(r.id);
                setIsPanelOpen(true);
              }}
            >
              <div className="chip-left">
                <span className="chip-dot" style={{ background: r.color }}></span>
                <div>
                  <div className="chip-title">{r.name}</div>
                  <div className="chip-sub">{r.routeName}</div>
                </div>
              </div>
              <div className="chip-right">
                <span className="chip-badge">EN ROUTE</span>
                <span className="chip-eta">ETA: {eta} min</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className={`map-layout ${isPanelOpen ? "panel-open" : "panel-closed"}`}>
        <div className="map-container-wrapper">
        <MapContainer
          center={BIT}
          zoom={10}
          scrollWheelZoom
          dragging
          touchZoom
          doubleClickZoom
          boxZoom
          keyboard
          tap={false}
          style={{ height: "100%", width: "100%" }}
        >
          <MapResizer watchKeys={[activeRoute, isPanelOpen]} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* Bus Routes */}
          {filteredRoutes.map((bus) => (
            <React.Fragment key={`route-${bus.id}`}>
              <Polyline
                positions={routePaths[bus.id]}
                pathOptions={{ color: "#ffffff", weight: 8, opacity: 0.9 }}
              />
              <Polyline
                positions={routePaths[bus.id]}
                pathOptions={{ color: bus.color, weight: 5, opacity: 0.9 }}
              />
            </React.Fragment>
          ))}

          {/* Destination */}
          <Marker position={BIT} icon={destinationIcon}>
            <Popup className="custom-popup">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700 }}><StudentIcon size={16} />BIT College</span><br />
              Destination
            </Popup>
          </Marker>

          {/* Driver (current device) */}
          {driverLocation?.lat != null && driverLocation?.lng != null && (
            <Marker
              position={[driverLocation.lat, driverLocation.lng]}
              icon={driverIcon}
            >
              <Popup className="bus-popup">
                <div className="popup-header" style={{ background: "#d89a10" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><LocationPinIcon size={16} color="white" />Your Location</span>
                </div>
                <div className="popup-body">
                  <p style={{ margin: 0 }}>
                    <strong>Lat:</strong> {Number(driverLocation.lat).toFixed(5)}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Lng:</strong> {Number(driverLocation.lng).toFixed(5)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Moving Buses */}
          {filteredRoutes.map((bus) => {
            const progress = busProgress.find((b) => b.id === bus.id)?.progress || 0;
            const pos = getPointAlongPath(routePaths[bus.id], progress);
            const nextStop = bus.stops[Math.min(bus.stops.length - 1, Math.floor(progress * bus.stops.length))];
            return (
              <Marker
                key={bus.id}
                position={pos}
                icon={createBusIcon(bus.color, formatBusId(bus.id))}
              >
                <Popup className="bus-popup">
                  <div className="popup-header" style={{ background: bus.color }}>
                    {bus.name}
                  </div>
                  <div className="popup-body">
                    <p><strong>Status:</strong> <span className="status-moving">En Route</span></p>
                    <p><strong>Route:</strong> {bus.routeName}</p>
                    <p><strong>Next Stop:</strong> {nextStop?.name}</p>
                    <p><strong>ETA:</strong> {Math.max(6, Math.round((1 - progress) * 20))} mins</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Stops */}
          {filteredRoutes.flatMap((bus) => {
            const stopsToRender = showAllStops
              ? bus.stops
              : [bus.stops[0], bus.stops[bus.stops.length - 1]].filter(Boolean);
            return stopsToRender.map((stop, idx) => (
              <CircleMarker
                key={`${bus.id}-stop-${idx}`}
                center={stop.position}
                radius={showAllStops ? 6 : 5}
                pathOptions={{ color: bus.color, fillColor: "white", fillOpacity: 1, weight: 3 }}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                  {stop.name}
                </Tooltip>
              </CircleMarker>
            ));
          })}
        </MapContainer>
      </div>

        <aside
          className={`route-panel ${isPanelOpen ? "open" : ""}`}
          style={activeBus ? { "--route": activeBus.color } : undefined}
        >
          {activeBus ? (
            <div className="route-panel-inner">
              <div className="route-panel-header">
                <div className="route-panel-title">
                  <span className="route-panel-dot" style={{ background: activeBus.color }}></span>
                  <div>
                    <div className="route-panel-name">{activeBus.name}</div>
                    <div className="route-panel-sub">{activeBus.routeName}</div>
                  </div>
                </div>
                <button
                  className="route-panel-close"
                  onClick={() => setIsPanelOpen(false)}
                  aria-label="Close route panel"
                  type="button"
                />
              </div>
              <div className="route-panel-status">
                <span className="chip-badge">EN ROUTE</span>
                <span className="chip-eta">ETA: {Math.max(6, Math.round((1 - (busProgress.find((b) => b.id === activeBus.id)?.progress || 0)) * 20))} min</span>
              </div>
              <div className="route-panel-meta">
                <span className="route-panel-pill">Total Stops: {activeBus.stops.length}</span>
                <span className="route-panel-pill">Live Tracking</span>
              </div>
              <div className="route-panel-stops">
                {activeBus.stops.map((stop, idx) => (
                  <div className="route-stop" key={`${activeBus.id}-panel-stop-${idx}`}>
                    <div className="route-stop-line">
                      <span className={`route-stop-dot ${idx === 0 ? "start" : idx === activeBus.stops.length - 1 ? "end" : ""}`}></span>
                      {idx < activeBus.stops.length - 1 && <span className="route-stop-bar"></span>}
                    </div>
                    <div className="route-stop-name">
                      <span className="route-stop-title">{stop.name}</span>
                      {idx === 0 && <span className="route-stop-tag">Start</span>}
                      {idx === activeBus.stops.length - 1 && <span className="route-stop-tag end">End</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="route-panel-inner route-panel-empty">
              <div className="route-panel-empty-title">Select a bus route</div>
              <div className="route-panel-empty-sub">Tap a bus chip to view the full list of stops.</div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

