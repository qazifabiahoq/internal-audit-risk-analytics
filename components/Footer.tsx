export default function Footer() {
  return (
    <footer className="border-t border-navy-700/40 bg-navy-900/60 py-8">
      <div className="mx-auto max-w-screen-2xl px-6 lg:px-10">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-sm text-slate-400">
              Built for portfolio purposes using public audit data
            </p>
            <p className="mt-1 flex flex-wrap justify-center gap-x-2 gap-y-1 font-mono text-xs text-slate-600 sm:justify-start">
              {['Python', 'pandas', 'scikit-learn', 'XGBoost', 'SHAP', 'Next.js', 'Recharts', 'Tailwind CSS', 'Vercel'].map(t => (
                <span key={t} className="rounded bg-navy-800/60 px-1.5 py-0.5 text-slate-500">
                  {t}
                </span>
              ))}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-8 w-px bg-navy-700/50" />
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500">Data Analytics</p>
              <p className="text-xs text-slate-600">Internal Audit Division</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold-500/20 bg-gold-500/5">
              <svg className="h-5 w-5 text-gold-400/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
