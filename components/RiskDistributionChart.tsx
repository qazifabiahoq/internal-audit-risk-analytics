'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'

interface RiskItem {
  riskLevel: string
  count: number
  pct: number
}

const RISK_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  High:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: 'Immediate escalation required' },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Monitor and plan remediation' },
  Low:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Track in next cycle' },
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const item = payload[0].payload as RiskItem
  const cfg = RISK_CONFIG[item.riskLevel]
  return (
    <div className="rounded-xl border border-navy-600/60 bg-navy-800/95 p-4 shadow-xl backdrop-blur-md">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ background: cfg?.color }} />
        <p className="font-semibold text-white">{item.riskLevel} Risk</p>
      </div>
      <p className="text-sm text-slate-400">Findings: <span className="font-mono font-bold text-white">{item.count.toLocaleString()}</span></p>
      <p className="text-sm text-slate-400">Share: <span className="font-mono font-bold" style={{ color: cfg?.color }}>{item.pct}%</span></p>
      <p className="mt-1 text-xs text-slate-500">{cfg?.label}</p>
    </div>
  )
}

export default function RiskDistributionChart({ data }: { data: RiskItem[] }) {
  const ordered = ['High', 'Medium', 'Low']
    .map(l => data.find(d => d.riskLevel === l))
    .filter(Boolean) as RiskItem[]

  return (
    <section id="risk" className="glass-card p-6">
      <h2 className="mb-1 text-xl font-bold text-white">Risk Distribution</h2>
      <p className="mb-5 text-sm text-slate-400">
        Audit findings by risk severity level with portfolio share breakdown
      </p>

      {/* Stacked bar summary */}
      <div className="mb-6 overflow-hidden rounded-xl">
        <div className="flex h-7">
          {ordered.map(item => (
            <div
              key={item.riskLevel}
              style={{
                width: `${item.pct}%`,
                background: RISK_CONFIG[item.riskLevel]?.color,
                opacity: 0.85,
              }}
              className="relative transition-opacity hover:opacity-100"
              title={`${item.riskLevel}: ${item.pct}%`}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-slate-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {ordered.map(item => {
          const cfg = RISK_CONFIG[item.riskLevel]
          return (
            <div key={item.riskLevel}
              className="rounded-xl border p-4 text-center transition-all hover:scale-[1.02]"
              style={{ borderColor: `${cfg.color}30`, background: cfg.bg }}>
              <p className="text-2xl font-bold" style={{ color: cfg.color }}>{item.pct}%</p>
              <p className="mt-1 text-sm font-medium text-slate-300">{item.riskLevel}</p>
              <p className="text-xs text-slate-500">{item.count.toLocaleString()} findings</p>
            </div>
          )
        })}
      </div>

      {/* Horizontal bar chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={ordered}
          layout="vertical"
          margin={{ top: 0, right: 50, left: 10, bottom: 0 }}
          barSize={28}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,110,0.3)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => v.toLocaleString()}
          />
          <YAxis
            type="category"
            dataKey="riskLevel"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" name="Findings" radius={[0, 6, 6, 0]}>
            {ordered.map(item => (
              <Cell key={item.riskLevel} fill={RISK_CONFIG[item.riskLevel]?.color ?? '#94a3b8'} />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              formatter={(v: number) => v.toLocaleString()}
              style={{ fill: '#94a3b8', fontSize: 11 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}
