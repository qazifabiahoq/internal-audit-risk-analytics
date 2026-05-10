'use client'

interface HeaderProps {
  lastUpdated: string
}

export default function Header({ lastUpdated }: HeaderProps) {
  return (
    <header className="relative overflow-hidden border-b border-navy-700/50 bg-navy-900/80 backdrop-blur-xl">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-gold-500/5 blur-3xl" />
        <div className="absolute -top-16 right-0 h-48 w-64 rounded-full bg-blue-500/5 blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-screen-2xl px-6 py-8 lg:px-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left: Title block */}
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-gold-500/30 bg-gold-500/10">
              <svg className="h-7 w-7 text-gold-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>

            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full bg-gold-500/20 px-3 py-0.5 text-xs font-semibold uppercase tracking-widest text-gold-400">
                  Internal Audit
                </span>
                <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-semibold uppercase tracking-widest text-emerald-400">
                  Live Analytics
                </span>
              </div>
              <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                Risk Intelligence{' '}
                <span className="bg-gradient-to-r from-gold-400 to-gold-500 bg-clip-text text-transparent">
                  Dashboard
                </span>
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm text-slate-400">
                ML-powered audit finding classification across 6 models with SHAP-driven risk driver analysis,
                continuous monitoring KPIs, and real-time finding triage.
              </p>
            </div>
          </div>

          {/* Right: Meta */}
          <div className="flex flex-wrap gap-3 md:flex-col md:items-end md:gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span>Last updated: <span className="font-medium text-slate-200">{lastUpdated}</span></span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Python', 'scikit-learn', 'XGBoost', 'Next.js'].map(tag => (
                <span key={tag} className="rounded bg-navy-700/60 px-2 py-0.5 font-mono text-xs text-slate-300">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Divider with gradient */}
        <div className="mt-6 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

        {/* Sub-nav pills */}
        <nav className="mt-3 flex flex-wrap gap-2">
          {[
            { label: 'KPIs', href: '#kpis' },
            { label: 'Model Comparison', href: '#models' },
            { label: 'ROC Curve', href: '#roc' },
            { label: 'Risk Distribution', href: '#risk' },
            { label: 'Feature Importance', href: '#features' },
            { label: 'Correlation', href: '#correlation' },
            { label: 'Findings', href: '#findings' },
          ].map(item => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-full border border-navy-600/50 bg-navy-800/40 px-3 py-1 text-xs text-slate-400 transition-all hover:border-gold-500/40 hover:bg-navy-700/60 hover:text-gold-400"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
