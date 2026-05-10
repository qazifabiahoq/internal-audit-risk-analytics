'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

interface TrendPoint {
  _quarter: string
  risklevel?: string
  RiskLevel?: string
  count: number
}

const RISK_COLORS: Record<string, string> = {
  High:   '#ef4444',
  Medium: '#f59e0b',
  Low:    '#10b981',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0)
  return (
    <div className="rounded-xl border border-navy-600/60 bg-navy-800/95 p-4 shadow-xl backdrop-blur-md">
      <p className="mb-2 font-semibold text-white">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-2 text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-mono font-bold" style={{ color: entry.color }}>
            {entry.value}
          </span>
        </div>
      ))}
      <div className="mt-2 border-t border-navy-600/40 pt-2 text-sm">
        <span className="text-slate-500">Total: </span>
        <span className="font-mono font-bold text-white">{total}</span>
      </div>
    </div>
  )
}

export default function TrendChart({ data }: { data: TrendPoint[] }) {
  // Pivot data: group by quarter, spread risk levels as columns
  const riskKey = (d: TrendPoint) => d.risklevel ?? d.RiskLevel ?? 'Unknown'
  const quarters = [...new Set(data.map(d => d._quarter))].sort()
  const riskLevels = ['High', 'Medium', 'Low']

  const pivoted = quarters.map(q => {
    const row: Record<string, any> = { quarter: q }
    for (const level of riskLevels) {
      const match = data.find(d => d._quarter === q && riskKey(d) === level)
      row[level] = match?.count ?? 0
    }
    return row
  })

  return (
    <section className="glass-card p-6">
      <h2 className="mb-1 text-xl font-bold text-white">Findings Trend by Quarter</h2>
      <p className="mb-5 text-sm text-slate-400">
        Audit finding volume over time, stratified by risk level. Useful for identifying seasonal risk patterns
        and monitoring continuous audit program effectiveness.
      </p>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart
          data={pivoted}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <defs>
            {riskLevels.map(level => (
              <linearGradient key={level} id={`grad-${level}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={RISK_COLORS[level]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={RISK_COLORS[level]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,110,0.4)" />
          <XAxis
            dataKey="quarter"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(30,58,110,0.5)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px', color: '#94a3b8' }} />
          {riskLevels.map(level => (
            <Area
              key={level}
              type="monotone"
              dataKey={level}
              name={`${level} Risk`}
              stroke={RISK_COLORS[level]}
              strokeWidth={2}
              fill={`url(#grad-${level})`}
              activeDot={{ r: 5 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
        <p className="text-xs text-blue-200">
          <span className="font-semibold text-blue-400">Continuous Monitoring:</span> This trend view supports
          ongoing audit monitoring programs. Spikes in High-risk findings by quarter can trigger targeted
          deep-dive engagements, a core deliverable for the Data Analytics function within Internal Audit.
        </p>
      </div>
    </section>
  )
}
