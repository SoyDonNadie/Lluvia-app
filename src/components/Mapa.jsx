import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { TIPOS_LLUVIA } from "../reportes";
import BuscadorUbicacion from "./BuscadorUbicacion";

// Convierte timestamp de Firestore a texto relativo
function tiempoTranscurrido(timestamp) {
  if (!timestamp) return "hace un momento";
  try {
    const diff = Date.now() - timestamp.toMillis();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "hace unos segundos";
    if (min === 1) return "hace 1 minuto";
    return `hace ${min} minutos`;
  } catch {
    return "hace un momento";
  }
}

// Guarda la instancia del mapa en un ref externo
function StoreMapRef({ mapRef }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map]);
  return null;
}

// Vuela a un destino cuando flyTarget cambia
function MapaControlador({ flyTarget }) {
  const map = useMap();
  useEffect(() => {
    if (flyTarget) map.flyTo([flyTarget.lat, flyTarget.lng], 15, { duration: 1.2 });
  }, [flyTarget]);
  return null;
}

// Captura clicks en el mapa
function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Ícono para reportes de otros usuarios
function makeReportIcon(color, glow, isRecent) {
  return divIcon({
    html: `
      <div style="position:relative;width:26px;height:26px;display:flex;align-items:center;justify-content:center;">
        ${isRecent ? `
          <div style="
            position:absolute;inset:0;border-radius:50%;
            border:2px solid ${color};opacity:0.55;
            animation:pulseRing 2s ease-out infinite;
          "></div>` : ""}
        <div style="
          width:14px;height:14px;border-radius:50%;
          background:${color};
          box-shadow:0 0 0 3px rgba(0,0,0,0.4),0 0 14px ${glow};
          border:1.5px solid rgba(255,255,255,0.85);
        "></div>
      </div>`,
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

// Ícono del usuario (punto índigo pulsante)
function makeUserIcon() {
  return divIcon({
    html: `
      <div style="position:relative;width:50px;height:50px;display:flex;align-items:center;justify-content:center;">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:radial-gradient(circle,rgba(129,140,248,0.35),transparent 70%);
          animation:pulseSoft 2.4s ease-in-out infinite;
        "></div>
        <div style="
          width:18px;height:18px;border-radius:50%;
          background:#6366f1;
          border:3px solid #ffffff;
          box-shadow:0 0 0 2px rgba(99,102,241,0.6),0 4px 12px rgba(0,0,0,0.5);
        "></div>
      </div>`,
    className: "",
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });
}

// Ícono del pin seleccionado
function makePinIcon() {
  return divIcon({
    html: `
      <div style="
        font-size:30px;line-height:1;
        filter:drop-shadow(0 4px 6px rgba(0,0,0,0.6));
        animation:pinDrop 0.32s cubic-bezier(.2,.9,.3,1.3);
        transform:translate(-50%,-100%);
        position:absolute;
      ">📍</div>`,
    className: "",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

const userIcon = makeUserIcon();
const pinIcon  = makePinIcon();

// Controles del mapa (+, -, recentrar)
function MapControlesInternos({ mapRef, ubicacion, onLimpiarPin }) {
  const btnStyle = {
    width: 36, height: 36, borderRadius: 10,
    background: "rgba(15,23,42,0.78)",
    backdropFilter: "blur(10px)",
    border: "1px solid #1e293b",
    color: "#cbd5e1",
    fontSize: 18,
    fontWeight: 500,
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "inherit",
  };
  return (
    <button style={{ ...btnStyle, fontSize: 16 }} title="Ir a mi ubicación" onClick={onLimpiarPin}>⌖</button>
  );
}

export default function Mapa({ reportes, ubicacion, pinSeleccionado, onMapClick, flyTarget, onLimpiarPin }) {
  const mapInstance = useRef(null);
  const centro = ubicacion ? [ubicacion.lat, ubicacion.lng] : [19.4326, -99.1332];

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <MapContainer
        center={centro}
        zoom={13}
        style={{ height: "100%", width: "100%", cursor: "crosshair", background: "#0b1426" }}
        zoomControl={false}
      >
        <StoreMapRef mapRef={mapInstance} />
        <MapaControlador flyTarget={flyTarget} />
        <ClickHandler onMapClick={onMapClick} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Punto GPS del usuario */}
        {ubicacion && (
          <Marker position={[ubicacion.lat, ubicacion.lng]} icon={userIcon} />
        )}

        {/* Pin seleccionado */}
        {pinSeleccionado && (
          <Marker position={[pinSeleccionado.lat, pinSeleccionado.lng]} icon={pinIcon} />
        )}

        {/* Reportes de otros usuarios */}
        {reportes.map((r) => {
          const tipo = TIPOS_LLUVIA.find((t) => t.id === r.tipo);
          if (!tipo) return null;
          const isRecent = r.creadoEn && (Date.now() - r.creadoEn.toMillis()) < 6 * 60 * 1000;
          return (
            <Marker
              key={r.id}
              position={[r.lat, r.lng]}
              icon={makeReportIcon(tipo.color, tipo.glow, isRecent)}
            >
              <Popup>
                <div style={{ textAlign: "center", fontFamily: "Inter, system-ui, sans-serif", padding: "2px 4px" }}>
                  <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 4 }}>{tipo.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: tipo.color, marginBottom: 2 }}>{tipo.label}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{tiempoTranscurrido(r.creadoEn)}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Leyenda — top left */}
      <div style={{
        position: "absolute", top: 12, left: 12, zIndex: 500,
        background: "rgba(15,23,42,0.7)",
        backdropFilter: "blur(10px)",
        border: "1px solid #1e293b",
        borderRadius: 10,
        padding: "7px 10px",
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 10.5, color: "#94a3b8", fontWeight: 500, letterSpacing: 0.2,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "#6366f1",
          boxShadow: "0 0 6px #6366f1",
          display: "inline-block", flexShrink: 0,
        }} />
        Tú · centro
      </div>

      {/* Controles + Buscador — top right */}
      <div style={{
        position: "absolute", top: 12, right: 12, zIndex: 500,
        display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6,
      }}>
        <BuscadorUbicacion onSelect={({ lat, lng }) => {
          mapInstance.current?.flyTo([lat, lng], 14, { duration: 1.2 });
        }} />
        <MapControlesInternos mapRef={mapInstance} ubicacion={ubicacion} onLimpiarPin={onLimpiarPin} />
      </div>

      {/* Fade hacia el panel inferior */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: 40,
        background: "linear-gradient(to bottom, transparent, rgba(5,10,20,0.7))",
        pointerEvents: "none",
        zIndex: 400,
      }} />
    </div>
  );
}
