/* ─────────────────────────────────────────────
   Offline Overlay
   • Uses backdrop-filter on the overlay layer (GPU-composited)
   • Inherits App.tsx Material Design CSS variables for consistency
   • Renders as null when connected → zero cost
───────────────────────────────────────────── */

export const OfflineOverlay = ({ isConnected }: { isConnected: boolean }) => {
  if (isConnected) return null

  return (
    <>
      <style>{`
        @keyframes _overlay-in {
          from { opacity: 0; backdrop-filter: blur(0px) brightness(1); }
          to   { opacity: 1; backdrop-filter: blur(8px) brightness(0.6); }
        }
        @keyframes _dot-bounce {
          0%, 80%, 100% { transform: translateY(0) }
          40%           { transform: translateY(-5px) }
        }
        @keyframes _icon-pulse {
          0%, 100% { opacity: 0.8; transform: scale(1) }
          50%       { opacity: 1;  transform: scale(1.05) }
        }
      `}</style>

      {/* Background Dimmer & Blur */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="System offline — interaction disabled"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.3)', // Subtle fallback
          WebkitBackdropFilter: 'blur(8px) brightness(0.6)',
          animation: '_overlay-in 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        }}
      >
        {/* Surface Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            userSelect: 'none',
            backgroundColor: 'var(--color-md-surface, #ffffff)', // Uses your App theme
            color: 'var(--color-md-on-surface, #1f2937)',
            padding: '40px 48px',
            borderRadius: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            textAlign: 'center',
            maxWidth: '90%',
          }}
        >
          {/* ── Icon Container ── */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 82, 82, 0.12)',
              color: '#FF5252',
              animation: '_icon-pulse 2.5s ease-in-out infinite',
            }}
          >
            {/* Clean Lucide-style WiFi-off SVG */}
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="2" y1="2" x2="22" y2="22" />
              <path d="M8.5 16.5a5 5 0 0 1 7 0" />
              <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
              <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
              <path d="M5 12.55a11 11 0 0 1 5.22-2.43" />
              <path d="M15 10.51a11 11 0 0 1 4 2.04" />
              <circle cx="12" cy="20" r="1" />
            </svg>
          </div>

          {/* ── Text ── */}
          <div>
            <p
              style={{
                fontSize: 24,
                fontWeight: 600,
                fontFamily: 'var(--font-display, sans-serif)',
                margin: '0 0 8px',
                letterSpacing: '-0.02em',
              }}
            >
              Gateway Disconnected
            </p>
            <p
              style={{
                fontSize: 14,
                color: 'var(--color-md-on-surface-variant, #6b7280)',
                margin: 0,
                maxWidth: '260px',
                lineHeight: 1.5,
              }}
            >
              The dashboard has lost connection to the GreenOS background service.
            </p>
          </div>

          {/* ── Reconnecting dots ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: '4px',
              padding: '10px 18px',
              backgroundColor: 'rgba(128, 128, 128, 0.08)', // Subtle thematic pill
              borderRadius: '999px',
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  display: 'block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-md-primary, #10b981)', // Inherits primary theme color
                  animation: `_dot-bounce 1.4s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-md-primary, #10b981)',
                marginLeft: 4,
                letterSpacing: '0.02em',
              }}
            >
              Reconnecting...
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
