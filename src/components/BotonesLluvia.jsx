import { TIPOS_LLUVIA } from "../reportes";

export default function BotonesLluvia({
  onReportar, cargando, sent, expiresIn, ultimoReporte,
  pinSeleccionado, onLimpiarPin, onCancelar, contadores = {},
}) {
  const usandoPin = !!pinSeleccionado;

  return (
    <div style={{
      background: "rgba(15,23,42,0.78)",
      backdropFilter: "blur(22px) saturate(140%)",
      WebkitBackdropFilter: "blur(22px) saturate(140%)",
      borderTop: "1px solid #1e293b",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: "14px 16px 28px",
      marginTop: -12,
      zIndex: 5,
      boxShadow: "0 -10px 30px rgba(0,0,0,0.4)",
      flexShrink: 0,
    }}>

      {/* Grab handle */}
      <div style={{
        width: 36, height: 4, borderRadius: 2,
        background: "#334155",
        margin: "0 auto 12px",
      }} />

      {/* Línea de ubicación */}
      <p style={{
        fontSize: 11.5, color: "#94a3b8",
        textAlign: "center", lineHeight: 1.4, margin: 0,
      }}>
        {usandoPin
          ? <>📍 Punto seleccionado en el mapa</>
          : <>📡 Tu ubicación GPS</>
        }
      </p>

      {/* Título */}
      <h2 style={{
        margin: "12px 0 10px",
        fontSize: 12, fontWeight: 700,
        letterSpacing: 1.6,
        color: "#cbd5e1",
        textAlign: "center",
        textTransform: "uppercase",
      }}>
        ¿Qué tal el clima?
      </h2>

      {/* Grilla 3×2 de botones */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8,
      }}>
        {TIPOS_LLUVIA.map((tipo) => {
          const isSelected = ultimoReporte === tipo.id && sent;
          const isDisabled = cargando || (sent && !isSelected);
          const count = contadores[tipo.id] || 0;

          return (
            <button
              key={tipo.id}
              onClick={() => !sent && !cargando && onReportar(tipo.id)}
              disabled={isDisabled}
              aria-label={`Reportar ${tipo.label}`}
              style={{
                position: "relative",
                background: isSelected ? tipo.color : `${tipo.color}1f`,
                border: `1.5px solid ${isSelected ? tipo.color : tipo.color + "66"}`,
                borderRadius: 14,
                padding: "12px 6px 10px",
                color: isSelected ? "#0b1220" : "#e2e8f0",
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 4,
                cursor: isDisabled ? "default" : "pointer",
                transition: "transform .12s ease, background .18s ease, box-shadow .18s ease",
                transform: isSelected ? "translateY(-1px)" : "none",
                boxShadow: isSelected
                  ? `0 6px 20px ${tipo.glow}, inset 0 1px 0 rgba(255,255,255,0.25)`
                  : "inset 0 1px 0 rgba(255,255,255,0.04)",
                outline: "none",
                fontFamily: "inherit",
                opacity: isDisabled && !isSelected ? 0.45 : 1,
              }}
            >
              {/* Badge con contador */}
              {count > 0 && (
                <span style={{
                  position: "absolute", top: 6, right: 6,
                  background: tipo.color, color: "#0b1220",
                  borderRadius: 999, fontSize: 9, fontWeight: 800,
                  padding: "1px 5px", lineHeight: 1.5,
                  minWidth: 16, textAlign: "center",
                }}>
                  {count}
                </span>
              )}
              <span style={{ fontSize: 26, lineHeight: 1, filter: tipo.emojiFilter || "none" }}>{tipo.emoji}</span>
              <span style={{
                fontSize: 11.5, fontWeight: 600,
                letterSpacing: 0.1,
                color: isSelected ? "#0b1220" : "#e2e8f0",
                textAlign: "center", lineHeight: 1.1,
              }}>
                {tipo.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mensaje de estado */}
      <div style={{
        marginTop: 12, minHeight: 28,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {sent ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 12px",
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: 999,
            animation: "slideUp 0.3s ease",
          }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 16, height: 16, borderRadius: "50%",
              background: "#22c55e", color: "#052e16",
              fontSize: 10, fontWeight: 900,
            }}>✓</span>
            <span style={{
              fontSize: 12, color: "#86efac", fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}>
              Reporte enviado — expira en {expiresIn} min
            </span>
            <button
              onClick={onCancelar}
              style={{
                background: "transparent", border: "none",
                color: "#86efac", opacity: 0.7,
                fontSize: 16, cursor: "pointer",
                padding: 0, marginLeft: 2,
                fontFamily: "inherit",
              }}
            >×</button>
          </div>
        ) : (
          <span style={{ fontSize: 11.5, color: "#475569", fontStyle: "italic" }}>
            Toca una opción para enviar tu reporte
          </span>
        )}
      </div>
    </div>
  );
}
