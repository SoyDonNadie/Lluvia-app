import { useEffect, useState, useRef, useMemo } from "react";
import { loginAnonimo } from "./firebase";
import { publicarReporte, escucharReportes, TIPOS_LLUVIA } from "./reportes";
import Mapa from "./components/Mapa";
import BotonesLluvia from "./components/BotonesLluvia";
import ToastNotificacion from "./components/ToastNotificacion";
import { distanciaKm, formatDistancia } from "./utils/geo";
import { useLang } from "./i18n.jsx";

const RADIO_COBERTURA_KM = 10; // solo mostrar reportes en este radio
const RADIO_NOTIFICACION_KM = 2; // notificar si hay reportes a esta distancia
const STORAGE_KEY = "lluviaya_reporte";

export default function App() {
  const [uid, setUid] = useState(null);
  const [ubicacion, setUbicacion] = useState(null);
  const [pinSeleccionado, setPinSeleccionado] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [ultimoReporte, setUltimoReporte] = useState(null);
  const [sent, setSent] = useState(false);
  const [expiresIn, setExpiresIn] = useState(30);
  const [errorUbicacion, setErrorUbicacion] = useState(false);
  const [toast, setToast] = useState(null); // { mensaje, emoji }
  const primeraUbicacion = useRef(true);
  const prevReportesRef = useRef(null);
  const { t, lang, toggleLang } = useLang(); // null = primer carga, no notificar

  // Login anónimo
  useEffect(() => {
    loginAnonimo()
      .then((cred) => setUid(cred.user.uid))
      .catch(console.error);
  }, []);

  // Restaurar reporte activo desde localStorage (límite por usuario)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { tipo, expiresAt } = JSON.parse(saved);
        const remaining = Math.floor((expiresAt - Date.now()) / 60000);
        if (remaining > 0) {
          setUltimoReporte(tipo);
          setSent(true);
          setExpiresIn(remaining);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch { localStorage.removeItem(STORAGE_KEY); }
    }
  }, []);

  // GPS
  useEffect(() => {
    if (!navigator.geolocation) { setErrorUbicacion(true); return; }
    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUbicacion(loc);
        setErrorUbicacion(false);
        if (primeraUbicacion.current) {
          primeraUbicacion.current = false;
          setFlyTarget({ ...loc, _t: Date.now() });
        }
      },
      () => setErrorUbicacion(true),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  // Escuchar reportes en tiempo real
  useEffect(() => {
    const unsub = escucharReportes(setReportes);
    return unsub;
  }, []);

  // Detectar reportes nuevos cercanos → notificación
  useEffect(() => {
    if (!ubicacion || prevReportesRef.current === null) {
      prevReportesRef.current = reportes;
      return;
    }
    const prev = prevReportesRef.current;
    const nuevos = reportes.filter((r) => {
      const esNuevo = !prev.some((p) => p.id === r.id);
      const esCercano = distanciaKm(ubicacion.lat, ubicacion.lng, r.lat, r.lng) <= RADIO_NOTIFICACION_KM;
      return esNuevo && esCercano;
    });

    if (nuevos.length > 0) {
      const r = nuevos[0];
      const tipo = TIPOS_LLUVIA.find((t) => t.id === r.tipo);
      if (tipo) {
        const dist = distanciaKm(ubicacion.lat, ubicacion.lng, r.lat, r.lng);
        const label = lang === "en" ? tipo.labelEn : tipo.label;
        const msg = t.notifMsg(label, formatDistancia(dist));
        setToast({ mensaje: msg, emoji: tipo.emoji });

        // Notificación del navegador si la pestaña no está activa
        if (document.hidden && Notification.permission === "granted") {
          new Notification("LluviaYa", { body: msg, icon: "/icon.svg" });
        }
      }
    }
    prevReportesRef.current = reportes;
  }, [reportes, ubicacion]);

  // Cuenta regresiva del reporte propio
  useEffect(() => {
    if (!sent) return;
    const t = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 1) { clearInterval(t); resetReporte(); return 0; }
        return prev - 1;
      });
    }, 60_000);
    return () => clearInterval(t);
  }, [sent]);

  // Filtrar reportes por radio de cobertura
  const reportesCercanos = useMemo(() => {
    if (!ubicacion) return reportes;
    return reportes.filter(
      (r) => distanciaKm(ubicacion.lat, ubicacion.lng, r.lat, r.lng) <= RADIO_COBERTURA_KM
    );
  }, [reportes, ubicacion]);

  // Contar reportes cercanos por tipo (5km) para badges
  const contadores = useMemo(() => {
    const base = Object.fromEntries(TIPOS_LLUVIA.map((t) => [t.id, 0]));
    if (!ubicacion) return base;
    reportes
      .filter((r) => distanciaKm(ubicacion.lat, ubicacion.lng, r.lat, r.lng) <= 5)
      .forEach((r) => { if (base[r.tipo] !== undefined) base[r.tipo]++; });
    return base;
  }, [reportes, ubicacion]);

  function handleMapClick(latlng) {
    setPinSeleccionado(latlng);
    if (sent) resetReporte();
  }

  function handleLimpiarPin() {
    setPinSeleccionado(null);
    if (ubicacion) setFlyTarget({ ...ubicacion, _t: Date.now() });
  }

  function resetReporte() {
    setSent(false);
    setUltimoReporte(null);
    setExpiresIn(30);
    setPinSeleccionado(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  async function handleReportar(tipoId) {
    const destino = pinSeleccionado || ubicacion;
    if (!destino || !uid || cargando) return;

    // Pedir permiso de notificaciones la primera vez
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }

    setCargando(true);
    try {
      await publicarReporte(uid, destino.lat, destino.lng, tipoId);
      const expiresAt = Date.now() + 30 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tipo: tipoId, expiresAt }));
      setUltimoReporte(tipoId);
      setSent(true);
      setExpiresIn(30);
      setPinSeleccionado(null);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }

  const activeCount = reportesCercanos.length + (sent ? 1 : 0);

  return (
    <div style={{
      height: "100dvh", display: "flex", flexDirection: "column",
      background: "#050a14", fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Toast de notificación */}
      {toast && (
        <ToastNotificacion
          mensaje={toast.mensaje}
          emoji={toast.emoji}
          onCerrar={() => setToast(null)}
        />
      )}

      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", background: "#0f172a",
        borderBottom: "1px solid #1e293b", zIndex: 1000, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/icon-192.png" alt="LluviaYa" style={{ width: 32, height: 32, objectFit: "contain" }} />
          <span style={{ fontWeight: 800, fontSize: 17, color: "#ffffff", letterSpacing: -0.2 }}>
            LluviaYa
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Toggle idioma */}
        <button onClick={toggleLang} style={{
          background: "transparent", border: "1px solid #334155",
          borderRadius: 8, color: "#94a3b8",
          fontSize: 12, fontWeight: 700,
          padding: "4px 8px", cursor: "pointer",
          fontFamily: "inherit", letterSpacing: 0.5,
        }}>
          {lang === "es" ? "EN" : "ES"}
        </button>

        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "5px 10px 5px 8px",
          background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 999,
        }}>
          <span style={{
            position: "relative", width: 8, height: 8, borderRadius: "50%",
            background: "#22c55e", boxShadow: "0 0 8px #22c55e",
            display: "inline-block", flexShrink: 0,
          }}>
            <span style={{
              position: "absolute", inset: -4, borderRadius: "50%",
              background: "rgba(34,197,94,0.4)", animation: "blinkDot 1.4s ease-in-out infinite",
            }} />
          </span>
          <span style={{ fontSize: 11.5, color: "#a7f3d0", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
            {t.reportesActivos(activeCount)}
          </span>
        </div>
        </div>
      </header>

      {/* Banner GPS */}
      {errorUbicacion && (
        <div style={{
          background: "#7f1d1d", color: "#fca5a5",
          padding: "10px 16px", fontSize: 13, textAlign: "center",
          zIndex: 1000, flexShrink: 0,
        }}>
          {t.activarGPS}
        </div>
      )}

      {/* Mapa */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <Mapa
          reportes={reportesCercanos}
          ubicacion={ubicacion}
          pinSeleccionado={pinSeleccionado}
          onMapClick={handleMapClick}
          flyTarget={flyTarget}
          onLimpiarPin={handleLimpiarPin}
        />
      </div>

      {/* Panel inferior */}
      <BotonesLluvia
        onReportar={handleReportar}
        cargando={cargando || (!pinSeleccionado && !ubicacion) || !uid}
        sent={sent}
        expiresIn={expiresIn}
        ultimoReporte={ultimoReporte}
        pinSeleccionado={pinSeleccionado}
        onLimpiarPin={handleLimpiarPin}
        onCancelar={resetReporte}
        contadores={contadores}
      />
    </div>
  );
}
