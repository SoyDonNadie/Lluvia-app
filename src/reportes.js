import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export const TIPOS_LLUVIA = [
  { id: "nubes_negras", label: "Nubes negras",  emoji: "☁️",  color: "#64748b", glow: "rgba(100,116,139,0.45)", emojiFilter: "brightness(0) invert(0.3)" },
  { id: "llovizna",     label: "Llovizna",       emoji: "🌦️",  color: "#60a5fa", glow: "rgba(96,165,250,0.45)"  },
  { id: "llueve",       label: "Llueve",          emoji: "🌧️",  color: "#3b82f6", glow: "rgba(59,130,246,0.5)"   },
  { id: "llueve_mucho", label: "Llueve mucho",    emoji: "⛈️",  color: "#f97316", glow: "rgba(249,115,22,0.5)"   },
  { id: "tormenta",     label: "Tormenta",        emoji: "🌩️",  color: "#ef4444", glow: "rgba(239,68,68,0.5)"    },
  { id: "soleado",      label: "Soleado",         emoji: "☀️",   color: "#facc15", glow: "rgba(250,204,21,0.5)"   },
];

// Usa el UID como ID del documento → sobreescribe el reporte anterior automáticamente
export async function publicarReporte(uid, lat, lng, tipo) {
  await setDoc(doc(db, "reportes", uid), {
    uid,
    lat,
    lng,
    tipo,
    creadoEn: serverTimestamp(),
  });
}

export function escucharReportes(callback) {
  const hace30min = Timestamp.fromMillis(Date.now() - 30 * 60 * 1000);
  const q = query(
    collection(db, "reportes"),
    where("creadoEn", ">=", hace30min)
  );
  return onSnapshot(q, (snap) => {
    const datos = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(datos);
  });
}
