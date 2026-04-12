import { Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar    from './Sidebar'
import RightPanel from './RightPanel'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const WIDE_PATHS = ['/messages', '/admin', '/profile']

export default function MainLayout() {
  const { pathname } = useLocation()
  const isWide = WIDE_PATHS.some(p => pathname.startsWith(p))
  const [rightPanelOpen, setRightPanelOpen] = useState(false)

  useEffect(() => {
    if (rightPanelOpen && !isWide && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    }
  }, [rightPanelOpen, isWide]);

  return (
    <div style={{ minHeight:'100vh', background:'transparent', fontFamily:'Inter,sans-serif' }}>
      <Sidebar />

      {/* Main content area */}
      <main style={{
        minHeight: '100vh',
        paddingTop: '1rem',
        paddingBottom: '1.5rem',
        marginLeft: 272,
        marginRight: isWide ? 0 : 312,
        padding: `1rem ${isWide ? '1rem' : '1.25rem'} 1.5rem`,
      }}
      className="main-content"
      >
        <style>{`
          @media (max-width: 1023px) {
            .main-content { margin-left: 0 !important; margin-right: 0 !important; padding-left: 1rem !important; padding-right: 1rem !important; padding-top: 5rem !important; }
          }
          @media (min-width: 1024px) and (max-width: 1280px) {
            .main-content { margin-right: 0 !important; }
          }
        `}</style>
        <div style={{ maxWidth: isWide ? '100%' : 680, margin: '0 auto' }} className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Right panel toggle button (Mobile/Tablet only) */}
      {!isWide && (
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="right-panel-toggle shadow-lg"
          style={{
            position: 'fixed', right: rightPanelOpen ? 280 : 0, top: 80,
            background: 'var(--primary)', color: '#fff', border: 'none', borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
            padding: '12px 4px', zIndex: 1000, cursor: 'pointer', transition: 'right 0.3s ease',
          }}
        >
          {rightPanelOpen ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
        </button>
      )}

      {/* Right panel — Slide-out drawer on mobile, fixed block on desktop */}
      {!isWide && (
        <>
          {/* Backdrop for mobile */}
          {rightPanelOpen && (
             <div 
               onClick={() => setRightPanelOpen(false)}
               className="right-panel-backdrop z-40 fixed inset-0 bg-black/40 xl:hidden"
             />
          )}
          <aside
            className={`right-panel glass-panel ${rightPanelOpen ? 'open' : ''} z-50`}
            style={{
              position:'fixed', right: '0', top: '0', bottom: '0', width: 280,
              overflowY:'auto', overflowX:'hidden', padding:'1.5rem 1rem',
              scrollbarWidth:'thin', transition: 'transform 0.3s ease'
            }}
          >
            <style>{`
              .right-panel-toggle { display: none; }
              @media (max-width: 1280px) { 
                .right-panel-toggle { display: block; }
                .right-panel { transform: translateX(100%); right: 0; top: 0; height: 100vh; background: var(--glass-bg); backdrop-filter: blur(20px); border-left: 1px solid var(--border); border-radius: 0; box-shadow: -4px 0 24px rgba(0,0,0,0.1); }
                .right-panel.open { transform: translateX(0); }
              }
              @media (min-width: 1281px) {
                .right-panel { right: 1rem; top: 1rem; height: calc(100vh - 2rem); transform: none !important; border-radius: 1rem; }
              }
            `}</style>
            <RightPanel />
          </aside>
        </>
      )}
    </div>
  )
}
