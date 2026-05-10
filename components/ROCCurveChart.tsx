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

interface ModelResult {
  model: string
  roc_auc: number
  f1_score: number
  accuracy: number
}

const CLASS_COLORS: Record<string, string> = {
  High:   '#ef4444',
  Medium: '#f59e0b',
  Low:    '#10b981',
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const pt = payload[0]?.payload
  return (
    <div className="rounded-xl border border-navy-600/60 bg-navy-800/95 p-3 shadow-xl backdrop-blur-md">
      <p className="mb-1 text-xs font-semibold text-slate-400">ROC Curve</p>
      <p className="text-sm">
        <span className="text-slate-400">False Positive Rate: </span>
        <span className="font-mono text-white">{pt?.fpr?.toFixed(3)}</span>
      </p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-sm">
          <span className="text-slate-400">True Positive Rate ({entry.name}): </span>
          <span className="font-mono font-semibold" style={{ color: entry.color }}>
            {entry.value?.toFixed(3)}
          </span>
        </p>
      ))}
      <p className="mt-1 text-xs text-slate-500">
        A point at (0, 1) = perfect classifier. Diagonal = random guessing.
      </p>
    </div>
  )
}

export default function ROCCurveChart({
  data,
  models,
  bestModelName,
}: {
  data: ROCPoint[]
  models: ModelResult[]
  bestModelName: string
}) {
  const classes = Array.from(new Set(data.map(d => d.class)))

  const byClass: Record<string, ROCPoint[]> = {}
  for (const cls of classes) {
    byClass[cls] = data.filter(d => d.class === cls).sort((a, b) => a.fpr - b.fpr)
  }

  const allFPR = Array.from(new Set(data.map(d => d.fpr))).sort((a, b) => a - b)
  const chartData = allFPR.map(fpr => {
    const row: Record<string, number> = { fpr }
    for (const cls of classes) {
      const pts = byClass[cls].filter(p => Math.abs(p.fpr - fpr) < 0.001)
      if (pts.length) row[cls] = pts[0].tpr
    }
    return row
  })

  const aucByClass: Record<string, number> = {}
  for (const cls of classes) {
    aucByClass[cls] = data.find(d => d.class === cls)?.auc ?? 0
  }

  // Sort models by AUC descending for the leaderboard
  const sortedModels = [...models].sort((a, b) => b.roc_auc - a.roc_auc)
  const bestAUC = sortedModels[0]?.roc_auc ?? 0

  return (
    <section id="roc" className="glass-card p-6">
      <h2 className="mb-1 text-xl font-bold text-white">ROC Curve</h2>
      <p className="mb-1 text-sm text-slate-400">
        Shows how well the best model separates High, Medium, and Low risk findings.
        The closer each curve is to the top-left corner, the better.
      </p>
      <p className="mb-5 text-xs text-slate-500">
        The diagonal dashed line represents a random guess (no skill). Every curve here
        is far above it, meaning the model is genuinely learning risk patterns.
      </p>

      {/* Best model winner callout */}
      <div className="mb-5 flex items-center gap-4 rounded-xl border border-gold-500/30 bg-gold-500/8 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-500/15 text-2xl font-bold text-gold-400">
          1
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-500">Best Model Selected</p>
          <p className="text-lg font-bold text-white">{bestModelName}</p>
          <p className="text-sm text-slate-400">
            ROC-AUC of <span className="font-mono font-bold text-gold-400">{(bestAUC * 100).toFixed(2)}%</span> across
            all three risk classes. AUC = 1.0 means perfect, 0.5 means random.
          </p>
        </div>
      </div>

      {/* All-models AUC leaderboard */}
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          All 6 Models Ranked by ROC-AUC (higher is better)
        </p>
        <div className="space-y-2">
          {sortedModels.map((m, i) => {
            const pct = (m.roc_auc / bestAUC) * 100
            const isWinner = m.model === bestModelName
            return (
              <div key={m.model}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  isWinner
                    ? 'border border-gold-500/30 bg-gold-500/8'
                    : 'border border-navy-700/30 bg-navy-800/30'
                }`}>
                <span className={`w-5 text-xs font-bold ${isWinner ? 'text-gold-400' : 'text-slate-600'}`}>
                  {i + 1}
                </span>
                <span className={`w-36 text-sm ${isWinner ? 'font-semibold text-white' : 'text-slate-400'}`}>
                  {m.model}
                </span>
                <div className="flex-1 overflow-hidden rounded-full bg-navy-700/40" style={{ height: '6px' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: isWinner ? '#f5c842' : '#475569',
                    }}
                  />
                </div>
                <span className={`w-14 text-right font-mono text-sm font-bold ${
                  isWinner ? 'text-gold-400' : 'text-slate-400'
                }`}>
                  {(m.roc_auc * 100).toFixed(1)}%
                </span>
                {isWinner && (
                  <span className="rounded-full bg-gold-500/20 px-2 py-0.5 text-xs font-semibold text-gold-400">
                    Winner
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* AUC per class badges */}
      <div className="mb-4 flex flex-wrap gap-3">
        {classes.map(cls => (
          <div key={cls}
            className="flex items-center gap-2 rounded-lg border border-navy-600/40 bg-navy-800/40 px-4 py-2">
            <span className="h-3 w-3 rounded-full" style={{ background: CLASS_COLORS[cls] ?? '#94a3b8' }} />
            <span className="text-sm text-slate-300">
              {cls} Risk
            </span>
            <span className="font-mono text-sm font-bold" style={{ color: CLASS_COLORS[cls] ?? '#94a3b8' }}>
              AUC {(aucByClass[cls] * 100).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      {/* ROC curve chart */}
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,110,0.4)" />
          <XAxis
            dataKey="fpr"
            label={{ value: 'False Positive Rate (false alarms)', position: 'insideBottom', offset: -16, fill: '#64748b', fontSize: 11 }}
            tickFormatter={v => v.toFixed(1)}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(30,58,110,0.5)' }}
            tickLine={false}
          />
          <YAxis
            label={{ value: 'True Positive Rate (correct detections)', angle: -90, position: 'insideLeft', offset: 14, fill: '#64748b', fontSize: 11 }}
            tickFormatter={v => v.toFixed(1)}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '8px', fontSize: '12px', color: '#94a3b8' }}
            formatter={(value) => `${value} Risk`}
          />
          <ReferenceLine
            segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }] as any}
            stroke="#475569"
            strokeDasharray="5 5"
            label={{ value: 'Random guess', position: 'insideTopRight', fill: '#475569', fontSize: 10 }}
          />
          {classes.map(cls => (
            <Line
              key={cls}
              type="monotone"
              dataKey={cls}
              name={cls}
              stroke={CLASS_COLORS[cls] ?? '#94a3b8'}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
        <p className="text-xs text-blue-200">
          <span className="font-semibold text-blue-400">What this means for audit:</span> The model correctly identifies
          High-risk findings with minimal false alarms. In practice, this means audit teams can rely on the model's
          risk flags without being overwhelmed by noise, enabling focused resource allocation where it matters most.
        </p>
      </div>
    </section>
  )
}
