import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HiShieldCheck } from 'react-icons/hi'

export default function BlockchainBadge({ hash, txHash, status, type = 'post' }) {
  const [expanded, setExpanded] = useState(false)

  const short = hash ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : null

  // Style per status — matching the stitch home_feed badge
  const badge = status === 'confirmed'
    ? { bg:'#f0fdf4', color:'#15803d', border:'#bbf7d0', label:'Blockchain Verified' }
    : status === 'failed'
    ? { bg:'#fef2f2', color:'#b91c1c', border:'#fecaca', label:'Chain Failed' }
    : { bg:'#fffbeb', color:'#b45309', border:'#fde68a', label:'Pending Chain' }

  if (!hash) return null

  return (
    <div>
      {/* Badge pill — exactly like stitch */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 rounded-full text-[10px] font-semibold border px-2 py-0.5 transition-all"
        style={{background: badge.bg, color: badge.color, borderColor: badge.border}}
        title="Click to expand blockchain record"
      >
        <HiShieldCheck style={{fontSize:'0.75rem', fill:'currentColor'}} />
        {badge.label}
      </button>

      {/* Hash sub-label */}
      {!expanded && short && (
        <div className="mt-0.5">
          <span className="font-mono text-[9px] uppercase tracking-tight cursor-pointer"
                style={{color:'#747688'}}
                onClick={() => setExpanded(!expanded)}>
            HASH: {short}
          </span>
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="mt-2 p-3 rounded-xl text-xs font-mono space-y-1.5 animate-fade-in"
             style={{background:'#f1f4f6', border:'1px solid rgba(196,197,217,0.30)'}}>
          <div className="flex gap-2">
            <span className="shrink-0 w-16" style={{color:'#747688'}}>{type} hash</span>
            <span className="break-all" style={{color:'#15803d'}}>{hash || '—'}</span>
          </div>
          {txHash && (
            <div className="flex gap-2">
              <span className="shrink-0 w-16" style={{color:'#747688'}}>tx hash</span>
              <span className="break-all" style={{color:'#3c557e'}}>{txHash}</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="shrink-0 w-16" style={{color:'#747688'}}>status</span>
            <span style={{color: badge.color}}>{status}</span>
          </div>
          <Link to="/blockchain"
                className="block mt-1 font-semibold transition-colors"
                style={{color:'#3c557e'}}
                onMouseOver={e=>e.target.style.textDecoration='underline'}
                onMouseOut={e=>e.target.style.textDecoration='none'}>
            Verify on chain →
          </Link>
        </div>
      )}
    </div>
  )
}
