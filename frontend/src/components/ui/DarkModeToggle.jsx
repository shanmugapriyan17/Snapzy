import { useTheme } from '../../context/ThemeContext'

export default function DarkModeToggle({ className = '' }) {
  const { isDark, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to Light' : 'Switch to Dark'}
      className={`theme-toggle-letter ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'pointer',
        width: 64,
        height: 28,
        borderRadius: 999,
        border: '1.5px solid var(--border-strong)',
        background: isDark ? 'rgba(180,138,255,0.15)' : 'rgba(15,23,42,0.08)',
        padding: 0,
        flexShrink: 0,
        transition: 'all 0.35s ease',
      }}
    >
      {/* Scrolling label container */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* LIGHT label - visible in light mode */}
        <span style={{
          position: 'absolute',
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.5rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: isDark ? 'transparent' : 'var(--primary)',
          transform: isDark ? 'translateY(-100%)' : 'translateY(0%)',
          transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1), color 0.35s ease',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}>
          LIGHT
        </span>

        {/* DARK label - visible in dark mode */}
        <span style={{
          position: 'absolute',
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.5rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: isDark ? '#b48aff' : 'transparent',
          transform: isDark ? 'translateY(0%)' : 'translateY(100%)',
          transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1), color 0.35s ease',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}>
          DARK
        </span>
      </div>
    </button>
  )
}
