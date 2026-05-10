'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'

interface ModelResult {
  model: string
  accuracy: number
  precision: number
  recall: number
  f1_score: number
  roc_auc: number
}

const MODEL_COLORS = {
  'Logistic Regression': '#60a5fa',
  'Decision Tree':       '#a78bfa',
  'Random Forest':       '#34d399',
  'XGBoost':             '#f5c842',
  'SVM':                 '#f97316',
  'KNN':                 '#ec4899',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-navy-600/60 bg-navy-800/95 p-4 shadow-2xl backdrop-blur-md">
      <p className="mb-3 font-semibold text-white">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center justify-between gap-6 text-sm">
          <span className="flex items-center gap-2 text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-mono font-semibold" style={{ color: entry.color }}>
            {(entry.value * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}

export default function ModelComparisonChart({ data }: { data: ModelResult[] }) {
  const sorted = [...data].sort((a, b) => b.roc_auc - a.roc_auc)

  return (
    <section id="models" className="glass-card overflow-hidden p-6">
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="h-1 w-6 rounded-full bg-gold-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-gold-400">Showstopper</span>
          </div>
          <h2 className="text-xl font-bold text-white">Model Performance Comparison</h2>
          <p className="mt-1 text-sm text-slate-400">
            6 classifiers evaluated on identical 80/20 stratified split — accuracy, F1, and ROC-AUC
          </p>
        </div>
        <div className="hidden rounded-lg border border-navy-600/50 bg-navy-800/50 px-3 py-2 text-center sm:block">
          <p className="text-xs text-slate-500">Best Model</p>
          <p className="text-sm font-bold text-gold-400">{sorted[0]?.model}</p>
          <p className="text-xs text-slate-400">AUC {(sorted[0]?.roc_auc * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Score cards */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {sorted.map(m => (
          <div key={m.model}
            className="rounded-lg border border-navy-600/40 bg-navy-800/40 p-3 text-center">
            <p className="truncate text-xs text-slate-500">{m.model}</p>
            <p className="mt-1 text-lg font-bold text-white">{(m.roc_auc * 100).toFixed(1)}%</p>
            <p className="text-xs text-slate-500">ROC-AUC</p>
          </div>
        ))}
      </div>

      {/* Grouped Bar Chart */}
      <ResponsiveContainer width="100%" height={340}>
        <BarChart
          data={sorted}
          margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
          barCategoryGap="20%"
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,110,0.4)" vertical={false} />
          <XAxis
            dataKey="model"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(30,58,110,0.5)' }}
            tickLine={false}
          />
          <YAxis
            domain={[0.7, 1.0]}
            tickFormatter={v => `${(v * 100).toFixed(0)}%`}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '16px', fontSize: '12px', color: '#94a3b8' }}
          />
          <ReferenceLine y={0.9} stroke="rgba(245,200,66,0.3)" strokeDasharray="4 4"
            label={{ value: '90%', position: 'right', fill: '#f5c842', fontSize: 10 }} />
          <Bar dataKey="accuracy"  name="Accuracy"  radius={[4,4,0,0]} fill="#60a5fa" />
          <Bar dataKey="f1_score"  name="F1 Score"  radius={[4,4,0,0]} fill="#34d399" />
          <Bar dataKey="roc_auc"   name="ROC-AUC"   radius={[4,4,0,0]} fill="#f5c842" />
        </BarChart>
      </ResponsiveContainer>

      {/* Insight callout */}
      <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
        <p className="text-xs text-emerald-300">
          <span className="font-semibold">Insight:</span> All tree-based ensemble methods (Random Forest, XGBoost)
          achieve ROC-AUC above 99%, demonstrating strong ability to distinguish High / Medium / Low risk
          audit findings. Ensemble diversity validates the risk signal embedded in the feature set.
        </p>
      </div>
    </section>
  )
}
