# Handoff: LluviaYa — PWA móvil de reporte colaborativo de clima

## Overview
LluviaYa es una **PWA móvil** que permite a los usuarios reportar el clima en tiempo real de forma colaborativa. Cada reporte se asocia a una ubicación (GPS automática o un punto seleccionado en el mapa), se muestra en el mapa de otros usuarios cercanos, y expira automáticamente después de 30 minutos.

**Objetivo de diseño:** la app debe poder usarse con una sola mano, durante una caminata bajo la lluvia, en 2-3 toques (abrir → confirmar ubicación → elegir estado del clima).

## About the Design Files
Los archivos en este bundle son **referencias de diseño creadas en HTML/React** — un prototipo de alta fidelidad que muestra el look, el comportamiento y las micro-interacciones esperadas. **No son código de producción para copiar y pegar.**

La tarea es **recrear estos diseños en el entorno del proyecto destino** (React Native + Expo, Flutter, SwiftUI, Kotlin Compose, Next.js como PWA, etc.) usando los patrones, librerías y design system ya establecidos en ese codebase. Si todavía no hay codebase, recomendamos:

- **React Native + Expo** (multiplataforma rápida, buen soporte de geolocalización y mapas).
- **Next.js + React + Tailwind** si la app realmente vivirá como PWA en navegador (recomendado por el spec original).

Para el mapa, sugerimos: **MapLibre GL JS** o **Mapbox GL JS** (web/PWA), o **react-native-maps** con un dark style (móvil nativo).

## Fidelity
**High-fidelity (hifi).** Colores, tipografía, espaciados y animaciones están finalizados. Recrear pixel-perfecto usando las librerías nativas del proyecto destino.

---

## Information Architecture
La app tiene **una sola pantalla principal**. No hay navegación entre vistas; toda la interacción ocurre en este lienzo único, con el panel inferior cambiando de estado.

### Estados del panel inferior
1. **Idle** — usuario aún no ha tocado nada. Mensaje en gris: *"Toca una opción para enviar tu reporte"*.
2. **Selecting** — usuario tocó un botón del clima. Se rellena ese botón con el color sólido.
3. **Sent** — confirmación verde con cuenta regresiva (`Reporte enviado — expira en 30 min`). Botón × para cancelar.

### Estados del mapa
- **GPS mode** (default): punto índigo pulsante = ubicación del usuario.
- **Pinned mode**: si el usuario toca el mapa, aparece un pin 📍 en ese punto. El panel inferior cambia el texto de la primera línea a *"📍 Reportando un punto seleccionado · volver a mi GPS"*.

---

## Screens / Views

### Pantalla única: Mapa + Reporte

Layout vertical (column flex) que ocupa **toda la pantalla**:

```
┌────────────────────────────┐
│  Status bar OS (system)    │
├────────────────────────────┤
│  Header fijo               │ ← 60-70px alto (incluye safe-area)
├────────────────────────────┤
│                            │
│                            │
│         Mapa               │ ← flex: 1
│      (full-bleed)          │
│                            │
│                            │
├────────────────────────────┤
│  Panel inferior            │ ← altura variable (~280-300px)
│  (overlap -12px sobre mapa)│
└────────────────────────────┘
```

---

### 1. Header
- **Background**: `#0f172a` (slate-900)
- **Padding**: `12px 16px` (más safe-area-top para el notch/status bar)
- **Border bottom**: `1px solid #1e293b`
- **Layout**: `display: flex; justify-content: space-between; align-items: center`
- **z-index**: 10 (encima del mapa)

#### Lado izquierdo (logo)
- Emoji `🌧️` a `font-size: 22px`, con `drop-shadow(0 2px 4px rgba(59,130,246,0.4))` (glow azul sutil).
- Texto **"LluviaYa"** — `Inter 800` (extrabold), `17px`, `color: #ffffff`, `letter-spacing: -0.2px`.
- Gap entre emoji y texto: `8px`.

#### Lado derecho (contador activo)
- Píldora con fondo `rgba(34,197,94,0.08)`, borde `1px solid rgba(34,197,94,0.2)`, `border-radius: 999px`, padding `5px 10px 5px 8px`.
- Dentro: **punto verde parpadeante** + texto **"X reportes activos"**.
- Punto: círculo `8×8`, `background: #22c55e`, `box-shadow: 0 0 8px #22c55e`. Encima, un anillo que crece y se desvanece (animación `blinkDot 1.4s ease-in-out infinite`).
- Texto: `font-size: 11.5px`, `color: #a7f3d0`, `font-weight: 600`, `font-variant-numeric: tabular-nums`.

---

### 2. Mapa (área principal)
- **Flex**: `1` (ocupa todo el espacio restante).
- **Overflow**: `hidden`.
- **Cursor**: `crosshair` (web) — para indicar que es interactivo.
- **Background**: estilo mapa nocturno oscuro.
  - **Para producción usar MapLibre/Mapbox dark style** (ej. `mapbox://styles/mapbox/dark-v11` o un style custom con base `#0b1426` y vías `#1c2a44`).
  - Color de agua: `#0a1a35`, parques: `#0c2a1a`, calles mayores: `#1c2a44`, calles menores: `#11182b`, edificios: `#0c1426`.

#### Overlays sobre el mapa

##### Legend (top-left)
- Position: `top: 12px; left: 12px`
- Background: `rgba(15,23,42,0.7)`, `backdrop-filter: blur(10px)`, border `1px solid #1e293b`, `border-radius: 10px`, padding `7px 10px`.
- Contenido: punto índigo (`6×6`, `#6366f1`, glow `0 0 6px #6366f1`) + texto **"Tú · centro"** en `#94a3b8`, `10.5px`, `font-weight: 500`.

##### Controles del mapa (top-right)
- Stack vertical de 3 botones cuadrados (`+`, `−`, `⌖` recentrar).
- Cada uno: `36×36px`, `border-radius: 10px`, `background: rgba(15,23,42,0.78)`, `backdrop-filter: blur(10px)`, border `1px solid #1e293b`, `color: #cbd5e1`.

##### Puntos de reportes de otros usuarios
- Círculo `14×14`, `border: 1.5px solid rgba(255,255,255,0.85)`, `box-shadow: 0 0 0 3px rgba(0,0,0,0.4), 0 0 14px <glow-color>`.
- El color de relleno coincide con el tipo de clima (ver tabla de tipos).
- **Reportes recientes (< 6 min)** muestran un anillo de pulso que se expande (`pulseRing 2s ease-out infinite`).

##### Tu ubicación (GPS dot)
- Círculo índigo `18×18`, `background: #6366f1`, `border: 3px solid #ffffff`, `box-shadow: 0 0 0 2px rgba(99,102,241,0.6), 0 4px 12px rgba(0,0,0,0.5)`.
- Encima, halo radial pulsante (`pulseSoft 2.4s ease-in-out infinite`).

##### Pin de selección (📍)
- Aparece donde el usuario tocó el mapa.
- Emoji `📍` a `font-size: 30px`, con `filter: drop-shadow(0 4px 6px rgba(0,0,0,0.6))`.
- Animación de entrada `pinDrop 0.32s cubic-bezier(.2,.9,.3,1.3)` (cae desde arriba).

##### Fade hacia el panel inferior
- En el borde inferior del mapa, gradiente `linear-gradient(to bottom, transparent, rgba(5,10,20,0.7))` de `40px` de alto para una transición suave hacia el panel.

---

### 3. Panel inferior (Report Sheet)
- **Background**: `rgba(15,23,42,0.78)`
- **Backdrop-filter**: `blur(22px) saturate(140%)` (importante para el efecto vidrio sobre el mapa).
- **Border top**: `1px solid #1e293b`
- **Border radius**: `20px 20px 0 0`
- **Padding**: `14px 16px 22px` (más safe-area-bottom).
- **Margin-top**: `-12px` (solapa ligeramente sobre el mapa).
- **Box-shadow**: `0 -10px 30px rgba(0,0,0,0.4)` (lift hacia arriba).

#### a) Grab handle
- Barra centrada `36×4px`, `border-radius: 2px`, `background: #334155`. Decorativa (afordancia de "se puede arrastrar"). Margin-bottom `12px`.

#### b) Línea de ubicación
- Texto centrado, `font-size: 11.5px`, `color: #94a3b8`, `line-height: 1.4`.
- Texto default: **"📡 Usando tu ubicación GPS · o toca el mapa para elegir otro punto"**.
- Texto cuando hay pin: **"📍 Reportando un punto seleccionado · volver a mi GPS"** — donde *"volver a mi GPS"* es un link `color: #818cf8`, subrayado, que reset el pin a null.

#### c) Título
- Texto **"¿QUÉ TAL EL CLIMA?"** centrado.
- `font-size: 12px`, `font-weight: 700`, `letter-spacing: 1.6px`, `text-transform: uppercase`, `color: #cbd5e1`.
- Margin: `12px 0 10px`.

#### d) Grilla 3×2 de botones (los 6 estados del clima)

| ID         | Emoji | Label          | Color       | Glow (rgba)            |
|------------|-------|----------------|-------------|------------------------|
| `nubes`    | 🌑    | Nubes negras   | `#64748b`   | `rgba(100,116,139,.45)`|
| `llovizna` | 🌦️    | Llovizna       | `#60a5fa`   | `rgba(96,165,250,.45)` |
| `llueve`   | 🌧️    | Llueve         | `#3b82f6`   | `rgba(59,130,246,.5)`  |
| `mucha`    | ⛈️    | Llueve mucho   | `#f97316`   | `rgba(249,115,22,.5)`  |
| `tormenta` | 🌩️    | Tormenta       | `#ef4444`   | `rgba(239,68,68,.5)`   |
| `soleado`  | ☀️    | Soleado        | `#facc15`   | `rgba(250,204,21,.5)`  |

- Grid: `grid-template-columns: repeat(3, 1fr); gap: 8px`.
- Cada botón:
  - `border-radius: 14px`, `padding: 12px 6px 10px`.
  - **Estado normal**: background `<color>1f` (12% alpha), border `1.5px solid <color>66` (40% alpha), text color `#e2e8f0`.
  - **Estado seleccionado**: background sólido `<color>`, border `1.5px solid <color>`, text color `#0b1220` (casi negro). Eleva con `transform: translateY(-1px)` y `box-shadow: 0 6px 20px <glow>`.
  - **Estado deshabilitado** (cuando ya hay reporte enviado y no es el seleccionado): `opacity: 0.45`.
  - Contenido: emoji grande (`26px`) arriba, label debajo (`11.5px`, `font-weight: 600`, `line-height: 1.1`, `text-align: center`).
  - Transición: `transform .12s, background .18s, box-shadow .18s`.
  - Active (press): `transform: scale(0.97)`.

#### e) Mensaje de confirmación
Aparece en lugar del placeholder cuando se envió un reporte. Píldora verde:
- Background: `rgba(34,197,94,0.1)`, border `1px solid rgba(34,197,94,0.25)`, `border-radius: 999px`, padding `6px 12px`.
- Icono ✓ en círculo verde sólido (`16×16`, `background: #22c55e`, `color: #052e16`, `font-weight: 900`).
- Texto: **"Reporte enviado — expira en {N} min"** — `font-size: 12px`, `color: #86efac`, `font-weight: 600`.
- Botón ×: transparente, `color: #86efac` 70% opacity, cierra/cancela el reporte.
- Animación entrada: `slideUp 0.3s ease` (entra desde abajo con fade).

---

## Interactions & Behavior

### Flow principal
1. App carga → muestra mapa centrado en GPS del usuario. Panel inferior en estado **idle**.
2. Usuario opcionalmente toca el mapa → cae un pin 📍, panel cambia a "Reportando un punto seleccionado".
3. Usuario toca uno de los 6 botones de clima → el botón se rellena sólido con su color (220ms delay) → se dispara el envío.
4. Aparece la píldora verde de confirmación con cuenta regresiva. Los demás botones se atenúan (`opacity 0.45`).
5. El reporte del usuario aparece como un punto nuevo en el mapa (mismo estilo que los demás, con pulso por ser reciente).
6. Cada minuto, el contador resta 1. Al llegar a 0 el reporte expira (en producción: el backend lo marca expired y desaparece de los mapas de otros usuarios).
7. Usuario puede tocar el × para cancelar y volver al estado idle.

### Tap en el mapa
- Convertir coordenadas de pantalla a coords geográficas (lat/lng) usando el SDK de mapa.
- Si ya había un reporte enviado, primero cancelarlo (`setSent(false); setSelected(null)`) y luego dropear el pin.

### Animaciones (keyframes CSS)
- `blinkDot` — anillo del punto verde del header. `1.4s ease-in-out infinite`.
- `pulseRing` — anillo de los reportes recientes en el mapa. `2s ease-out infinite`.
- `pulseSoft` — halo del GPS dot. `2.4s ease-in-out infinite`.
- `pinDrop` — entrada del pin 📍. `0.32s cubic-bezier(.2,.9,.3,1.3)`.
- `slideUp` — entrada de la píldora de confirmación. `0.3s ease`.

### Estados de carga / error (a implementar)
- **Sin permiso GPS**: panel inferior muestra "Activa la ubicación para reportar" + link a settings.
- **Sin conexión**: banner en el header "Sin conexión — reintentando…".
- **Error de envío**: la píldora cambia a roja "No se pudo enviar — reintentar".

---

## State Management

```ts
interface WeatherReport {
  id: string;
  type: 'nubes' | 'llovizna' | 'llueve' | 'mucha' | 'tormenta' | 'soleado';
  lat: number;
  lng: number;
  createdAt: number; // epoch ms
  expiresAt: number; // epoch ms (createdAt + 30 min)
  userId: string;
}

interface AppState {
  reports: WeatherReport[];          // reportes de otros usuarios cercanos
  userLocation: { lat, lng } | null; // GPS actual
  pin: { lat, lng } | null;          // punto seleccionado en el mapa, si aplica
  selected: WeatherType | null;      // tipo de clima elegido (UI state)
  myReport: WeatherReport | null;    // reporte propio activo
  activeCount: number;               // reports.length + (myReport ? 1 : 0)
}
```

### Backend / API mínimo
- `GET /reports?lat=&lng=&radius=` → lista de reportes activos en un radio.
- `POST /reports` → crear reporte. Body: `{ type, lat, lng }`. Response: `{ id, expiresAt, ... }`.
- `DELETE /reports/:id` → cancelar reporte propio.
- (Opcional) WebSocket `wss://.../live?lat=&lng=` para recibir reportes nuevos en tiempo real (es lo que mueve el contador "X reportes activos").

### Cliente
- WebSocket o polling cada 15-30s para refrescar `reports`.
- Geolocation API con `watchPosition` para mantener el GPS actualizado.
- Timer local cada 60s para decrementar el `expiresIn` del reporte propio.

---

## Design Tokens

### Colors
| Token              | Hex         | Uso                          |
|--------------------|-------------|------------------------------|
| `--bg-base`        | `#050a14`   | Fondo extremo / vignette     |
| `--bg-surface`     | `#0f172a`   | Header, panel inferior base  |
| `--bg-elevated`    | `#1e293b`   | Bordes, separadores          |
| `--text-primary`   | `#ffffff`   | Logo, texto principal        |
| `--text-secondary` | `#cbd5e1`   | Títulos, labels              |
| `--text-tertiary`  | `#94a3b8`   | Texto helper / hint          |
| `--text-muted`     | `#475569`   | Placeholders                 |
| `--accent-user`    | `#6366f1`   | Punto del usuario (indigo)   |
| `--accent-link`    | `#818cf8`   | Links                        |
| `--success`        | `#22c55e`   | Punto activo, confirmación   |
| `--success-text`   | `#86efac`   | Texto en píldora verde       |

### Weather colors
Ver tabla en sección "Grilla 3×2".

### Spacing scale (px)
`4, 6, 8, 10, 12, 14, 16, 20, 22`

### Typography
- **Familia**: `Inter`, fallback `-apple-system, system-ui, sans-serif`.
- **Pesos**: 400, 500, 600, 700, 800.
- **Tabular numerals** en el contador y la cuenta regresiva (`font-variant-numeric: tabular-nums`).

| Estilo            | Tamaño  | Peso | Letter-spacing |
|-------------------|---------|------|----------------|
| Logo              | 17px    | 800  | -0.2px         |
| Title (uppercase) | 12px    | 700  | 1.6px          |
| Body              | 12px    | 600  | normal         |
| Helper            | 11.5px  | 500  | normal         |
| Counter           | 11.5px  | 600  | normal         |
| Button label      | 11.5px  | 600  | 0.1px          |
| Button emoji      | 26px    | —    | —              |
| Map pin emoji     | 30px    | —    | —              |
| Logo emoji        | 22px    | —    | —              |

### Border radius
- Píldoras (logo counter, mensaje verde): `999px`.
- Panel inferior (top corners): `20px`.
- Botones del clima: `14px`.
- Controles del mapa, legend: `10px`.
- Grab handle: `2px`.

### Shadows / blur
- Panel inferior: `box-shadow: 0 -10px 30px rgba(0,0,0,0.4)` + `backdrop-filter: blur(22px) saturate(140%)`.
- Controles mapa: `backdrop-filter: blur(10px)`, sin shadow.
- Reportes en mapa: `box-shadow: 0 0 0 3px rgba(0,0,0,0.4), 0 0 14px <glow>`.

---

## Assets
- Todos los íconos son **emojis nativos** del sistema operativo. No se requieren assets binarios.
- El mapa debe usar el dark style del proveedor elegido (Mapbox/MapLibre/Google Maps Dark).
- La fuente Inter se carga desde Google Fonts. Si la app es nativa, sustituir por SF Pro (iOS) o Roboto (Android).

---

## Accessibility
- Los botones del clima deben tener `aria-label` (ej. `"Reportar llueve mucho"`), no solo el emoji.
- Contraste verificado: `#cbd5e1` sobre `#0f172a` = AA (texto pequeño OK).
- Hit area mínima 44×44px — los botones del clima ya están holgados, pero asegurar que el × del mensaje verde y los controles `+/-` del mapa tengan hit area expandida.
- `prefers-reduced-motion`: deshabilitar `pulseRing`, `pulseSoft`, `blinkDot`, `pinDrop`.
- `role="status"` y `aria-live="polite"` para el mensaje de confirmación verde.

---

## PWA-specific (si se implementa como Next.js / web)
- `manifest.webmanifest` con `display: standalone`, `theme_color: #0f172a`, `background_color: #050a14`.
- Service worker para offline (cachear el shell de la app).
- Pedir permiso de geolocalización en el primer load.
- `<meta name="theme-color" content="#0f172a">` para que la barra de estado del SO combine.
- Considerar instalación con `beforeinstallprompt`.

---

## Files in this handoff
- `LluviaYa.html` — Página principal: monta los scripts (React 18.3.1, Babel standalone, los 2 jsx).
- `lluviaya-app.jsx` — Componente principal con toda la lógica (Header, Mapa, Panel, animaciones).
- `ios-frame.jsx` — Frame de iPhone (solo para preview en el prototipo — **no portar**, en producción el frame es el dispositivo real).

Para ver el prototipo: abrir `LluviaYa.html` en un navegador. El frame de iPhone es decoración del prototipo; la app real ocupa todo el viewport del móvil.
