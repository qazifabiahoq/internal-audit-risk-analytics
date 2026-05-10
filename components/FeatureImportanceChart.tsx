'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import { humanizeFeature } from '@/lib/utils'

interface FeatureItem {
  feature: string
  importance: number
  method: string
}

const INSIGHTS: Record<string, string> = {
  'Financial Impact (USD)':    'Monetary exposure directly signals High-risk classification',
  'Risk Score Composite':      'Engineered feature blending severity + financial impact',
  'Severity Score':            'Auditor-assigned severity is the strongest raw predictor',
  'Days Open':                 'Prolonged open findings indicate control environment weakness',
  'Mgmt Response Days':        'Slow management response correlates with elevated risk',
  'Auditor Experience (Yrs)':  'Senior auditors tend to identify more complex risk patterns',
  'Status: Overdue':           'Overdue status is a leading indicator of High-risk escalation',
  'Status: Open':              'Open findings accumulate risk exposure over time',
  'Due Date Month':            'Regulatory cycle and year-end deadlines affect risk timing',
  'Audit Quarter':             'Q4 findings have higher High-risk rates due to year-end pressure',
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const item = payload[0].payload as { label: string; importance: number; method: string }
  const insight = INSIGHTS[item.label]
  return (
    <div className="max-w-xs rounded-xl border border-navy-600/60 bg-navy-800/95 p-4 shadow-xl backdrop-blur-md">
      <p className="mb-1 font-semibold text-white">{item.label}</p>
      <p className="mb-2 text-sm text-slate-400">
        Score: <span className="font-mono font-bold text-gold-400">{item.importance.toFixed(4)}</span>
        <span className="ml-2 text-xs text-slate-500">({item.method})</span>
      </p>
      {insight && <p className="text-xs leading-relaxed text-slate-400">{insight}</p>}
    </div>
  )
}

export default function FeatureImportanceChart({ data }: { data: FeatureItem[] }) {
  const top10 = data.slice(0, 10)
  const maxVal = Math.max(...top10.map(d => d.importance))

  const chartData = top10.map((d, i) => ({
    label: humanizeFeature(d.feature),
    importance: d.importance,
    method: d.method,
    rank: i + 1,
  }))

  const getColor = (val: number) => {
    const ratio = val / maxVal
    if (ratio > 0.7) return '#f5c842'
    if (ratio > 0.4) return '#60a5fa'
    return '#818cf8'
  }

  return (
    <section id="features" className="glass-card p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">Top 10 Risk Drivers</h2>
        <p className="mt-1 text-sm text-slate-400">
          Feature importance scores from the best model ({data[0]?.method ?? 'SHAP/Feature Importance'})
          — ranked by predictive contribution to risk classification
        </p>
      </div>

      {/* Top 3 callout */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {chartData.slice(0, 3).map((d, i) => (
          <div key={d.label}
            className="rounded-xl border border-navy-600/40 bg-navy-800/40 p-3 text-center">
            <p className="text-xs text-slate-500">#{i + 1} Driver</p>
            <p className="mt-1 text-sm font-semibold leading-tight text-white">{d.label}</p>
            <p className="mt-1 font-mono text-base font-bold text-gold-400">
              {(d.importance / maxVal * 100).toFixed(0)}%
            </p>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
          barSize={20}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,110,0.3)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => v.toFixed(2)}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: '#cbd5e1', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={160}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="importance" name="Importance" radius={[0, 6, 6, 0]}>
            {chartData.map((d, i) => (
              <Cell key={d.label} fill={getColor(d.importance)} fillOpacity={0.85} />
            ))}
            <LabelList
              dataKey="importance"
              position="right"
              formatter={(v: number) => v.toFixed(3)}
              style={{ fill: '#94a3b8', fontSize: 10 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 rounded-lg border border-gold-500/20 bg-gold-500/5 p-3">
        <p className="text-xs text-gold-200">
          <span className="font-semibold text-gold-400">Audit Insight:</span> Financial impact and composite
          risk score dominate the model, confirming that monetary exposure and severity are the primary
          levers for risk prioritisation in the audit universe. Operational factors (days open, management
          response time) provide important secondary signals for escalation.
        </p>
      </div>
    </section>
  )
}
