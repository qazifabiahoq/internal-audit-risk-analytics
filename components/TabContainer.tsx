'use client'

import { useState } from 'react'

interface Tab {
  id: string
  label: string
  icon: React.ReactNode
  badge?: string
}

interface Props {
  tabs: Tab[]
  children: React.ReactNode[]
}

export default function TabContainer({ tabs, children }: Props) {
  const [active, setActive] = useState(0)

  return (
    <div>
      {/* Tab bar */}
      <div className="sticky top-0 z-30 border-b border-navy-700/50 bg-navy-900/90 backdrop-blur-xl">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-10">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
            {tabs.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActive(i)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  active === i
                    ? 'bg-gold-500/15 text-gold-400 shadow-sm border border-gold-500/25'
                    : 'text-slate-400 hover:bg-navy-800/60 hover:text-slate-200'
                }`}
              >
                <span className={active === i ? 'text-gold-400' : 'text-slate-500'}>{tab.icon}</span>
                {tab.label}
                {tab.badge && (
                  <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    active === i
                      ? 'bg-gold-500/20 text-gold-400'
                      : 'bg-navy-700/60 text-slate-500'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-10">
        {children.map((child, i) => (
          <div key={i} className={active === i ? 'block' : 'hidden'}>
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}
