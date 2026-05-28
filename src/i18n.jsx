import { createContext, useContext, useState } from "react";

const translations = {
  es: {
    reportesActivos: (n) => `${n} reporte${n !== 1 ? "s" : ""} activos`,
    activarGPS:       "⚠️ Activa el GPS para poder reportar",
    tuCentro:         "Tú · centro",
    tuGPS:            "📡 Tu ubicación GPS",
    puntoSeleccionado:"📍 Punto seleccionado en el mapa",
    cualElClima:      "¿Qué tal el clima?",
    tocaOpcion:       "Toca una opción para enviar tu reporte",
    reporteEnviado:   (n) => `Reporte enviado — expira en ${n} min`,
    buscarPlaceholder:"Buscar ciudad, colonia...",
    sinResultados:    (q) => `Sin resultados para "${q}"`,
    tuUbicacion:      "Tu ubicación (GPS)",
    reportarAqui:     "Reportar aquí",
    notifMsg:         (label, dist) => `${label} reportado a ${dist} de ti`,
    haceUnMomento:    "hace un momento",
    haceUnosSegundos: "hace unos segundos",
    haceUnMinuto:     "hace 1 minuto",
    haceMinutos:      (n) => `hace ${n} minutos`,
  },
  en: {
    reportesActivos: (n) => `${n} active report${n !== 1 ? "s" : ""}`,
    activarGPS:       "⚠️ Enable GPS to report weather",
    tuCentro:         "You · center",
    tuGPS:            "📡 Your GPS location",
    puntoSeleccionado:"📍 Selected point on map",
    cualElClima:      "How's the weather?",
    tocaOpcion:       "Tap an option to send your report",
    reporteEnviado:   (n) => `Report sent — expires in ${n} min`,
    buscarPlaceholder:"Search city, neighborhood...",
    sinResultados:    (q) => `No results for "${q}"`,
    tuUbicacion:      "Your location (GPS)",
    reportarAqui:     "Report here",
    notifMsg:         (label, dist) => `${label} reported ${dist} away`,
    haceUnMomento:    "just now",
    haceUnosSegundos: "a few seconds ago",
    haceUnMinuto:     "1 minute ago",
    haceMinutos:      (n) => `${n} minutes ago`,
  },
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem("lluviaya_lang") || "es"
  );

  function toggleLang() {
    const next = lang === "es" ? "en" : "es";
    setLang(next);
    localStorage.setItem("lluviaya_lang", next);
  }

  return (
    <LangContext.Provider value={{ t: translations[lang], lang, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
