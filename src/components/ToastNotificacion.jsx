import { useEffect } from "react";

export default function ToastNotificacion({ mensaje, emoji, onCerrar }) {
  useEffect(() => {
    const t = setTimeout(onCerrar, 6000);
    return () => clearTimeout(t);
  }, [mensaje]);

  return (
    <div style={{
      position: "fixed",
      top: 72,
      left: 12, right: 12,
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: "rgba(15,23,42,0.97)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(99,102,241,0.4)",
      borderRadius: 14,
      padding: "12px 14px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)",
      animation: "slideDown 0.3s ease",
    }}>
      <span style={{ fontSize: 24, flexShrink: 0 }}>{emoji}</span>
      <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500, flex: 1, lineHeight: 1.4 }}>
        {mensaje}
      </span>
      <button
        onClick={onCerrar}
        style={{
          background: "transparent", border: "none",
          color: "#64748b", fontSize: 18,
          cursor: "pointer", padding: 0, flexShrink: 0,
        }}
      >×</button>

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-16px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
    </div>
  );
}
