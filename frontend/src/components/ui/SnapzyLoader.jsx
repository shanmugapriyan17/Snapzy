/* SnapzyLoader — Animated "S" brand spinner used for all page loading states */
export default function SnapzyLoader({ size = 56, fullPage = false }) {
  const s = size

  const spinner = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg
        width={s}
        height={s}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: 'snapzy-pulse 1.2s ease-in-out infinite' }}
      >
        <defs>
          <linearGradient id="snapzy-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3c557e" />
            <stop offset="100%" stopColor="#6b38d4" />
          </linearGradient>
          <linearGradient id="snapzy-grad-track" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
        </defs>
        {/* Background circle track */}
        <circle cx="28" cy="28" r="24" stroke="url(#snapzy-grad-track)" strokeWidth="3.5" fill="none" />
        {/* Animated progress arc */}
        <circle
          cx="28" cy="28" r="24"
          stroke="url(#snapzy-grad)"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="62 88"
          style={{ animation: 'snapzy-spin 0.9s linear infinite', transformOrigin: '28px 28px' }}
        />
        {/* "S" letter in center */}
        <text
          x="28" y="35"
          textAnchor="middle"
          fontSize="22"
          fontFamily="'Poppins', sans-serif"
          fontWeight="800"
          fill="url(#snapzy-grad)"
        >S</text>
      </svg>
      <style>{`
        @keyframes snapzy-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes snapzy-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.85; transform: scale(0.96); }
        }
      `}</style>
    </div>
  )

  if (fullPage) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(6px)',
      }}>
        {spinner}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: size < 30 ? 0 : '3rem 0' }}>
      {spinner}
    </div>
  )
}

