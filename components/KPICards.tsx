'use client'

import { useEffect, useState } from 'react'
import { fmtNumber, fmtPct } from '@/lib/utils'

interface KPIData {
  totalFindings: number
  highRiskPct: number
  highRiskCount: number
  bestModelName: string
  bestModelAccuracy: number
  bestModelF1: number
  flaggedCount: number
  lastUpdated: string
}

function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * ease))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return value
}

function KPICard({
  title, value, sub, icon, accent, delay,
}: {
  title: string
  value: string
  sub?: string
  icon: React.ReactNode
  accent: 'gold' | 'red' | 'green' | 'blue'
  delay: string
}) {
  const accentMap = {
    gold:  { border: 'border-gold-500/30',  bg: 'bg-gold-500/10',  text: 'text-gold-400',   glow: 'shadow-gold-500/10' },
    red:   { border: 'border-red-500/30',   bg: 'bg-red-500/10',   text: 'text-red-400',    glow: 'shadow-red-500/10' },
    green: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
    blue:  { border: 'border-blue-500/30',  bg: 'bg-blue-500/10',  text: 'text-blue-400',   glow: 'shadow-blue-500/10' },
  }
  const a = accentMap[accent]

  return (
    <div
      className={`glass-card fade-in fade-in-delay-${delay} relative flex flex-col gap-4 overflow-hidden p-6 shadow-xl ${a.glow}`}
    >
      {/* Background glow blob */}
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full ${a.bg} blur-2xl`} />

      <div className="flex items-start justify-between">
        <p className="text-sm font-medium uppercase tracking-wider text-slate-400">{title}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${a.border} ${a.bg}`}>
          <span className={a.text}>{icon}</span>
        </div>
      </div>

      <div>
        <p className={`text-3xl font-bold leading-none tracking-tight ${a.text}`}>{value}</p>
        {sub && <p className="mt-2 text-xs text-slate-500">{sub}</p>}
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-transparent ${
        accent === 'gold' ? 'via-gold-500/50' :
        accent === 'red' ? 'via-red-500/50' :
        accent === 'green' ? 'via-emerald-500/50' :
        'via-blue-500/50'
      } to-transparent`} />
    </div>
  )
}

export default function KPICards({ data }: { data: KPIData }) {
  const total    = useCountUp(data.totalFindings, 1400)
  const flagged  = useCountUp(data.flaggedCount, 1600)
  const acc      = useCountUp(Math.round(data.bestModelAccuracy * 100), 1200)
  const highPct  = useCountUp(Math.round(data.highRiskPct * 10), 1300)

  return (
    <section id="kpis" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KPICard
        title="Total Audit Findings"
        value={fmtNumber(total)}
        sub="Across all departments and risk categories"
        accent="blue"
        delay="1"
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        }
      />
      <KPICard
        title="High Risk Findings"
        value={fmtPct(highPct / 10)}
        sub={`${fmtNumber(data.highRiskCount)} findings flagged as high risk`}
        accent="red"
        delay="2"
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        }
      />
      <KPICard
        title="Best Model Accuracy"
        value={`${acc}%`}
        sub={`${data.bestModelName} — F1: ${fmtPct(data.bestModelF1 * 100)}`}
        accent="green"
        delay="3"
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <KPICard
        title="Flagged for Review"
        value={fmtNumber(flagged)}
        sub="High-risk findings requiring immediate audit action"
        accent="gold"
        delay="4"
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
          </svg>
        }
      />
    </section>
  )
}
