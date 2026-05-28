import { useState, useRef, useEffect } from "react";

export default function BuscadorUbicacion({ onSelect }) {
  const [abierto, setAbierto] = useState(false);
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Foco automático al abrir
  useEffect(() => {
    if (abierto) inputRef.current?.focus();
    else { setQuery(""); setResultados([]); }
  }, [abierto]);

  // Búsqueda con debounce
  useEffect(() => {
    if (query.trim().length < 2) { setResultados([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setCargando(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "es" } }
        );
        const data = await res.json();
        setResultados(data);
      } catch (e) {
        setResultados([]);
      } finally {
        setCargando(false);
      }
    }, 350);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  function handleSelect(lugar) {
    onSelect({ lat: parseFloat(lugar.lat), lng: parseFloat(lugar.lon) });
    setAbierto(false);
  }

  // Botón de búsqueda (cuando está cerrado)
  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        title="Buscar ubicación"
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(15,23,42,0.78)",
          backdropFilter: "blur(10px)",
          border: "1px solid #1e293b",
          color: "#cbd5e1", fontSize: 16,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "inherit",
        }}
      >
        🔍
      </button>
    );
  }

  // Panel de búsqueda expandido
  return (
    <div style={{ position: "relative", width: 260 }}>
      {/* Input */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "rgba(15,23,42,0.92)",
        backdropFilter: "blur(12px)",
        border: "1px solid #334155",
        borderRadius: 12,
        padding: "0 10px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>
          {cargando ? "⏳" : "🔍"}
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ciudad, colonia..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#f1f5f9",
            fontSize: 13,
            fontFamily: "inherit",
            padding: "10px 0",
          }}
        />
        <button
          onClick={() => setAbierto(false)}
          style={{
            background: "transparent", border: "none",
            color: "#64748b", fontSize: 18,
            cursor: "pointer", padding: 0, flexShrink: 0,
          }}
        >×</button>
      </div>

      {/* Resultados */}
      {resultados.length > 0 && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0, right: 0,
          background: "rgba(15,23,42,0.97)",
          backdropFilter: "blur(12px)",
          border: "1px solid #1e293b",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          zIndex: 600,
        }}>
          {resultados.map((lugar, i) => (
            <button
              key={lugar.place_id}
              onClick={() => handleSelect(lugar)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                borderBottom: i < resultados.length - 1 ? "1px solid #1e293b" : "none",
                padding: "10px 12px",
                textAlign: "left",
                cursor: "pointer",
                display: "flex", flexDirection: "column", gap: 2,
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.2 }}>
                {lugar.name || lugar.display_name.split(",")[0]}
              </span>
              <span style={{ fontSize: 11, color: "#64748b", lineHeight: 1.3 }}>
                {lugar.display_name.split(",").slice(1, 3).join(",")}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Sin resultados */}
      {query.length >= 2 && !cargando && resultados.length === 0 && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0, right: 0,
          background: "rgba(15,23,42,0.97)",
          border: "1px solid #1e293b",
          borderRadius: 12,
          padding: "12px",
          textAlign: "center",
          color: "#64748b",
          fontSize: 13,
          zIndex: 600,
        }}>
          Sin resultados para "{query}"
        </div>
      )}
    </div>
  );
}
