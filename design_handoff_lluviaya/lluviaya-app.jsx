// LluviaYa — collaborative weather reporting PWA
const { useState, useEffect, useRef } = React;

// ---- Weather states ----
const WEATHER = [
  { id: 'nubes',    emoji: '🌑',  label: 'Nubes negras', color: '#64748b', glow: 'rgba(100,116,139,0.45)' },
  { id: 'llovizna', emoji: '🌦️',  label: 'Llovizna',     color: '#60a5fa', glow: 'rgba(96,165,250,0.45)' },
  { id: 'llueve',   emoji: '🌧️',  label: 'Llueve',       color: '#3b82f6', glow: 'rgba(59,130,246,0.5)' },
  { id: 'mucha',    emoji: '⛈️',  label: 'Llueve mucho', color: '#f97316', glow: 'rgba(249,115,22,0.5)' },
  { id: 'tormenta', emoji: '🌩️',  label: 'Tormenta',     color: '#ef4444', glow: 'rgba(239,68,68,0.5)' },
  { id: 'soleado',  emoji: '☀️',   label: 'Soleado',      color: '#facc15', glow: 'rgba(250,204,21,0.5)' },
];

// ---- Simulated nearby reports (in % coordinates of map area) ----
const SEED_REPORTS = [
  { x: 18, y: 22, type: 'llueve',   mins: 4 },
  { x: 32, y: 14, type: 'llovizna', mins: 12 },
  { x: 64, y: 18, type: 'nubes',    mins: 7 },
  { x: 82, y: 28, type: 'tormenta', mins: 2 },
  { x: 72, y: 42, type: 'mucha',    mins: 8 },
  { x: 24, y: 50, type: 'llovizna', mins: 18 },
  { x: 44, y: 36, type: 'llueve',   mins: 5 },
  { x: 88, y: 58, type: 'soleado',  mins: 22 },
  { x: 12, y: 70, type: 'nubes',    mins: 14 },
  { x: 56, y: 64, type: 'llueve',   mins: 9 },
  { x: 38, y: 78, type: 'mucha',    mins: 3 },
  { x: 78, y: 76, type: 'llovizna', mins: 16 },
  { x: 8,  y: 38, type: 'llueve',   mins: 11 },
  { x: 92, y: 88, type: 'nubes',    mins: 26 },
];

function colorOf(typeId) {
  return WEATHER.find(w => w.id === typeId)?.color || '#94a3b8';
}
function glowOf(typeId) {
  return WEATHER.find(w => w.id === typeId)?.glow || 'rgba(148,163,184,0.4)';
}

// ---- Map background (SVG streets) ----
function MapBackground() {
  return (
    <svg viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <radialGradient id="mapBg" cx="50%" cy="40%" r="80%">
          <stop offset="0%" stopColor="#0b1426" />
          <stop offset="100%" stopColor="#050a14" />
        </radialGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0f1a2e" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="400" height="600" fill="url(#mapBg)" />
      <rect width="400" height="600" fill="url(#grid)" />

      {/* Park / green block */}
      <path d="M 40 380 Q 70 360 110 380 Q 130 410 100 440 Q 60 450 40 430 Z" fill="#0c2a1a" opacity="0.55" />
      {/* Water body */}
      <path d="M 260 440 Q 320 430 380 460 L 400 480 L 400 600 L 240 600 Q 230 520 260 440 Z" fill="#0a1a35" opacity="0.7" />

      {/* Major roads (warm gray-blue) */}
      <g stroke="#1c2a44" strokeLinecap="round" fill="none">
        <line x1="0"   y1="120" x2="400" y2="100" strokeWidth="6" />
        <line x1="0"   y1="280" x2="400" y2="300" strokeWidth="5" />
        <line x1="20"  y1="0"   x2="60"  y2="600" strokeWidth="5" />
        <line x1="220" y1="0"   x2="260" y2="600" strokeWidth="6" />
        <line x1="340" y1="0"   x2="320" y2="600" strokeWidth="4" />
      </g>
      {/* Minor streets */}
      <g stroke="#11182b" strokeWidth="2" strokeLinecap="round">
        <line x1="0"   y1="60"  x2="400" y2="50"  />
        <line x1="0"   y1="180" x2="400" y2="170" />
        <line x1="0"   y1="220" x2="400" y2="210" />
        <line x1="0"   y1="350" x2="400" y2="360" />
        <line x1="0"   y1="420" x2="400" y2="430" />
        <line x1="0"   y1="500" x2="400" y2="510" />
        <line x1="100" y1="0"   x2="120" y2="600" />
        <line x1="160" y1="0"   x2="180" y2="600" />
        <line x1="290" y1="0"   x2="280" y2="600" />
        <line x1="380" y1="0"   x2="370" y2="600" />
      </g>

      {/* Subtle building blocks */}
      <g fill="#0c1426" opacity="0.7">
        <rect x="70"  y="130" width="42" height="40" rx="2" />
        <rect x="130" y="130" width="22" height="40" rx="2" />
        <rect x="190" y="230" width="28" height="35" rx="2" />
        <rect x="270" y="130" width="38" height="40" rx="2" />
        <rect x="190" y="370" width="22" height="40" rx="2" />
        <rect x="130" y="450" width="42" height="35" rx="2" />
        <rect x="280" y="370" width="32" height="30" rx="2" />
      </g>
    </svg>
  );
}

// ---- Map dot for a remote report ----
function ReportDot({ x, y, type, mins }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%,-50%)',
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: colorOf(type),
        boxShadow: `0 0 0 3px rgba(0,0,0,0.4), 0 0 14px ${glowOf(type)}`,
        border: '1.5px solid rgba(255,255,255,0.85)',
        pointerEvents: 'none',
      }}
    >
      {/* Soft pulse ring for newer reports */}
      {mins < 6 && (
        <div style={{
          position: 'absolute',
          inset: -6,
          borderRadius: '50%',
          border: `2px solid ${colorOf(type)}`,
          opacity: 0.55,
          animation: 'pulseRing 2s ease-out infinite',
        }}/>
      )}
    </div>
  );
}

// ---- User location dot (purple/indigo) ----
function UserLocationDot({ x, y }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%,-50%)',
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute',
        inset: -18,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(129,140,248,0.35), transparent 70%)',
        animation: 'pulseSoft 2.4s ease-in-out infinite',
      }} />
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        background: '#6366f1',
        border: '3px solid #ffffff',
        boxShadow: '0 0 0 2px rgba(99,102,241,0.6), 0 4px 12px rgba(0,0,0,0.5)',
      }} />
    </div>
  );
}

// ---- Drop pin emoji ----
function DropPin({ x, y }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%, -100%)',
      pointerEvents: 'none',
      fontSize: 30,
      filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))',
      animation: 'pinDrop 0.32s cubic-bezier(.2,.9,.3,1.3)',
    }}>📍</div>
  );
}

// ---- Weather button ----
function WeatherButton({ item, selected, disabled, onClick }) {
  const bg = selected ? item.color : `${item.color}1f`; // 12% alpha when not selected
  const fg = selected ? '#0b1220' : item.color;
  const labelColor = selected ? '#0b1220' : '#e2e8f0';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'relative',
        background: bg,
        border: `1.5px solid ${item.color}${selected ? '' : '66'}`,
        borderRadius: 14,
        padding: '12px 6px 10px',
        color: labelColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'transform .12s ease, background .18s ease, box-shadow .18s ease',
        transform: selected ? 'translateY(-1px)' : 'none',
        boxShadow: selected
          ? `0 6px 20px ${item.glow}, inset 0 1px 0 rgba(255,255,255,0.25)`
          : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        outline: 'none',
        fontFamily: 'inherit',
        opacity: disabled && !selected ? 0.45 : 1,
      }}
    >
      <span style={{ fontSize: 26, lineHeight: 1, filter: selected ? 'none' : 'saturate(1.1)' }}>{item.emoji}</span>
      <span style={{
        fontSize: 11.5,
        fontWeight: 600,
        letterSpacing: 0.1,
        color: labelColor,
        textAlign: 'center',
        lineHeight: 1.1,
      }}>{item.label}</span>
    </button>
  );
}

// ---- Main app ----
function LluviaYa() {
  const [reports, setReports] = useState(SEED_REPORTS);
  const [selected, setSelected] = useState(null);
  const [sent, setSent] = useState(false);
  const [expiresIn, setExpiresIn] = useState(30); // minutes
  const [pin, setPin] = useState(null); // {x,y} on map if user tapped
  const userPos = { x: 50, y: 52 };
  const mapRef = useRef(null);

  // Activity counter shows live reports
  const activeCount = reports.length + (sent ? 1 : 0);

  // Count down the user's report timer
  useEffect(() => {
    if (!sent) return;
    const t = setInterval(() => {
      setExpiresIn(prev => prev > 0 ? prev - 1 : 0);
    }, 60_000);
    return () => clearInterval(t);
  }, [sent]);

  // Simulate live activity — new dots occasionally fade in
  useEffect(() => {
    const t = setInterval(() => {
      setReports(prev => {
        // 30% chance to add a new live report somewhere
        if (Math.random() > 0.7 && prev.length < 22) {
          const w = WEATHER[Math.floor(Math.random() * WEATHER.length)];
          return [...prev, {
            x: 8 + Math.random()*84,
            y: 10 + Math.random()*80,
            type: w.id,
            mins: 1,
          }];
        }
        return prev;
      });
    }, 4500);
    return () => clearInterval(t);
  }, []);

  function handleMapTap(e) {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (y > 92) return; // ignore near edges
    setPin({ x, y });
    if (sent) {
      setSent(false);
      setExpiresIn(30);
      setSelected(null);
    }
  }

  function handleSelect(id) {
    setSelected(id);
    // Slight delay before "sending"
    setTimeout(() => {
      setSent(true);
      setExpiresIn(30);
    }, 220);
  }

  function resetReport() {
    setSent(false);
    setSelected(null);
    setPin(null);
    setExpiresIn(30);
  }

  const usingPin = !!pin;
  const reportPos = pin || userPos;

  return (
    <IOSDevice dark>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: '#050a14',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* ===== Header ===== */}
        <header style={{
          background: '#0f172a',
          padding: '70px 16px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1e293b',
          zIndex: 10,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22, filter: 'drop-shadow(0 2px 4px rgba(59,130,246,0.4))' }}>🌧️</span>
            <span style={{
              fontWeight: 800,
              fontSize: 17,
              color: '#ffffff',
              letterSpacing: -0.2,
            }}>LluviaYa</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '5px 10px 5px 8px',
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 999,
          }}>
            <span style={{
              position: 'relative',
              width: 8, height: 8, borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 8px #22c55e',
            }}>
              <span style={{
                position: 'absolute', inset: -4, borderRadius: '50%',
                background: 'rgba(34,197,94,0.4)',
                animation: 'blinkDot 1.4s ease-in-out infinite',
              }} />
            </span>
            <span style={{
              fontSize: 11.5,
              color: '#a7f3d0',
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}>{activeCount} reportes activos</span>
          </div>
        </header>

        {/* ===== Map ===== */}
        <div
          ref={mapRef}
          onClick={handleMapTap}
          style={{
            position: 'relative',
            flex: 1,
            overflow: 'hidden',
            cursor: 'crosshair',
          }}
        >
          <MapBackground />

          {/* Compass / scale overlay */}
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            zIndex: 4,
          }}>
            <button style={mapBtnStyle}>＋</button>
            <button style={mapBtnStyle}>−</button>
            <button style={{...mapBtnStyle, fontSize: 14}}>⌖</button>
          </div>

          {/* Legend */}
          <div style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'rgba(15,23,42,0.7)',
            border: '1px solid #1e293b',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 10,
            padding: '7px 10px',
            zIndex: 4,
            fontSize: 10.5,
            color: '#94a3b8',
            fontWeight: 500,
            letterSpacing: 0.2,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 6px #6366f1'}} />
            <span>Tú · centro</span>
          </div>

          {/* Reports */}
          {reports.map((r, i) => (
            <ReportDot key={i} {...r} />
          ))}

          {/* User's own pending/sent report */}
          {sent && (
            <ReportDot x={reportPos.x} y={reportPos.y} type={selected} mins={0.1} />
          )}

          {/* User location */}
          {!usingPin && <UserLocationDot x={userPos.x} y={userPos.y} />}

          {/* Drop pin */}
          {pin && <DropPin x={pin.x} y={pin.y} />}

          {/* Soft fade into bottom panel */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: 40,
            background: 'linear-gradient(to bottom, transparent, rgba(5,10,20,0.7))',
            pointerEvents: 'none',
          }} />
        </div>

        {/* ===== Bottom panel ===== */}
        <div style={{
          background: 'rgba(15,23,42,0.78)',
          backdropFilter: 'blur(22px) saturate(140%)',
          WebkitBackdropFilter: 'blur(22px) saturate(140%)',
          borderTop: '1px solid #1e293b',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: '14px 16px 22px',
          marginTop: -12,
          zIndex: 5,
          boxShadow: '0 -10px 30px rgba(0,0,0,0.4)',
          flexShrink: 0,
        }}>
          {/* Grab handle */}
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: '#334155',
            margin: '0 auto 12px',
          }} />

          {/* Location hint */}
          <p style={{
            margin: 0,
            fontSize: 11.5,
            color: '#94a3b8',
            textAlign: 'center',
            lineHeight: 1.4,
          }}>
            {usingPin
              ? <>📍 Reportando un punto seleccionado · <a onClick={(e)=>{e.stopPropagation(); setPin(null);}} style={{color:'#818cf8', cursor:'pointer', textDecoration:'underline'}}>volver a mi GPS</a></>
              : <>📡 Usando tu ubicación GPS · o toca el mapa para elegir otro punto</>
            }
          </p>

          {/* Title */}
          <h2 style={{
            margin: '12px 0 10px',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.6,
            color: '#cbd5e1',
            textAlign: 'center',
            textTransform: 'uppercase',
          }}>¿Qué tal el clima?</h2>

          {/* Grid 3x2 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}>
            {WEATHER.map(w => (
              <WeatherButton
                key={w.id}
                item={w}
                selected={selected === w.id}
                disabled={sent && selected !== w.id}
                onClick={() => !sent && handleSelect(w.id)}
              />
            ))}
          </div>

          {/* Status message */}
          <div style={{
            marginTop: 12,
            minHeight: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {sent ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 999,
                animation: 'slideUp 0.3s ease',
              }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#22c55e',
                  color: '#052e16',
                  fontSize: 10,
                  fontWeight: 900,
                }}>✓</span>
                <span style={{
                  fontSize: 12,
                  color: '#86efac',
                  fontWeight: 600,
                }}>
                  Reporte enviado — expira en {expiresIn} min
                </span>
                <button onClick={resetReport} style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#86efac',
                  opacity: 0.7,
                  fontSize: 14,
                  cursor: 'pointer',
                  padding: 0,
                  marginLeft: 2,
                  fontFamily: 'inherit',
                }}>×</button>
              </div>
            ) : (
              <span style={{
                fontSize: 11.5,
                color: '#475569',
                fontStyle: 'italic',
              }}>Toca una opción para enviar tu reporte</span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blinkDot {
          0%, 100% { transform: scale(0.7); opacity: 0.9; }
          50% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes pulseRing {
          0% { transform: scale(0.7); opacity: 0.7; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes pulseSoft {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.4); opacity: 0.3; }
        }
        @keyframes pinDrop {
          0% { transform: translate(-50%, -180%); opacity: 0; }
          100% { transform: translate(-50%, -100%); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(6px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        button { -webkit-tap-highlight-color: transparent; }
        button:active { transform: scale(0.97) !important; }
      `}</style>
    </IOSDevice>
  );
}

const mapBtnStyle = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: 'rgba(15,23,42,0.78)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid #1e293b',
  color: '#cbd5e1',
  fontSize: 18,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'inherit',
};

ReactDOM.createRoot(document.getElementById('root')).render(<LluviaYa />);
