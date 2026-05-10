'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'

interface ROCPoint {
  class: string
  fpr: number
  tpr: number
  auc: number
}

const CLASS_COLORS: Record<string, string> = {
  High:   '#ef4444',
  Medium: '#f59e0b',
  Low:    '#10b981',
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-navy-600/60 bg-navy-800/95 p-3 shadow-xl backdrop-blur-md">
      <p className="mb-1 text-xs font-semibold text-slate-400">ROC Curve Point</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="text-sm">
          <span className="text-slate-400">FPR: </span>
          <span className="font-mono text-white">{entry.payload.fpr?.toFixed(3)}</span>
          <span className="ml-3 text-slate-400">TPR: </span>
          <span className="font-mono" style={{ color: entry.color }}>{entry.value?.toFixed(3)}</span>
        </div>
      ))}
    </div>
  )
}

export default function ROCCurveChart({ data }: { data: ROCPoint[] }) {
  const classes = Array.from(new Set(data.map(d => d.class)))

  // Build per-class series: { fpr -> tpr }
  const byClass: Record<string, ROCPoint[]> = {}
  for (const cls of classes) {
    byClass[cls] = data.filter(d => d.class === cls).sort((a, b) => a.fpr - b.fpr)
  }

  // Merge all FPR points and attach TPR per class
  const allFPR = [...new Set(data.map(d => d.fpr))].sort((a, b) => a - b)
  const chartData = allFPR.map(fpr => {
    const row: Record<string, number> = { fpr }
    for (const cls of classes) {
      const pts = byClass[cls].filter(p => Math.abs(p.fpr - fpr) < 0.001)
      if (pts.length) row[cls] = pts[0].tpr
    }
    return row
  })

  // AUC per class
  const aucByClass: Record<string, number> = {}
  for (const cls of classes) {
    aucByClass[cls] = data.find(d => d.class === cls)?.auc ?? 0
  }

  return (
    <section id="roc" className="glass-card p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">ROC Curve — Best Model</h2>
        <p className="mt-1 text-sm text-slate-400">
          One-vs-Rest ROC curves per risk class. Area Under Curve (AUC) measures discrimination ability.
        </p>
      </div>

      {/* AUC badges */}
      <div className="mb-5 flex flex-wrap gap-3">
        {classes.map(cls => (
          <div key={cls} className="flex items-center gap-2 rounded-lg border border-navy-600/40 bg-navy-800/40 px-4 py-2">
            <span className="h-3 w-3 rounded-full" style={{ background: CLASS_COLORS[cls] ?? '#94a3b8' }} />
            <span className="text-sm font-medium text-slate-300">{cls} Risk</span>
            <span className="font-mono text-sm font-bold" style={{ color: CLASS_COLORS[cls] ?? '#94a3b8' }}>
              AUC {(aucByClass[cls] * 100).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,110,0.4)" />
          <XAxis
            dataKey="fpr"
            label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 11 }}
            tickFormatter={v => v.toFixed(1)}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(30,58,110,0.5)' }}
            tickLine={false}
          />
          <YAxis
            label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', offset: 8, fill: '#64748b', fontSize: 11 }}
            tickFormatter={v => v.toFixed(1)}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px', color: '#94a3b8' }} />
          {/* Random classifier baseline */}
          <ReferenceLine
            segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
            stroke="#475569"
            strokeDasharray="4 4"
            label={{ value: 'Random', position: 'insideTopRight', fill: '#475569', fontSize: 10 }}
          />
          {classes.map(cls => (
            <Line
              key={cls}
              type="monotone"
              dataKey={cls}
              name={`${cls} Risk`}
              stroke={CLASS_COLORS[cls] ?? '#94a3b8'}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </section>
  )
}
