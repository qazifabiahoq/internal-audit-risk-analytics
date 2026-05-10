'use client'

import { humanizeFeature } from '@/lib/utils'

interface CorrelationData {
  columns: string[]
  matrix: number[][]
}

function getColor(val: number): string {
  const abs = Math.abs(val)
  if (val > 0) {
    // Blue scale for positive
    const intensity = Math.round(abs * 255)
    return `rgba(96, 165, 250, ${abs.toFixed(2)})`
  } else {
    // Red scale for negative
    return `rgba(239, 68, 68, ${abs.toFixed(2)})`
  }
}

function getTextColor(val: number): string {
  return Math.abs(val) > 0.5 ? '#ffffff' : '#94a3b8'
}

export default function CorrelationHeatmap({ data }: { data: CorrelationData }) {
  const { columns, matrix } = data
  // Show at most 10 columns for readability
  const maxCols = 10
  const cols = columns.slice(0, maxCols)
  const mat  = matrix.slice(0, maxCols).map(row => row.slice(0, maxCols))

  const labels = cols.map(c => {
    const h = humanizeFeature(c)
    return h.length > 18 ? h.slice(0, 16) + '..' : h
  })

  const [hovered, setHovered] = React.useState<{ r: number; c: number; val: number } | null>(null)

  return (
    <section id="correlation" className="glass-card overflow-hidden p-6">
      <h2 className="mb-1 text-xl font-bold text-white">Correlation Heatmap</h2>
      <p className="mb-5 text-sm text-slate-400">
        Pairwise Pearson correlation between numeric features. Strong correlations ({'>'}0.95) are removed
        during feature engineering to prevent multicollinearity in linear models.
      </p>

      {/* Legend */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-xs text-slate-500">Negative</span>
        <div className="h-3 flex-1 rounded-full"
          style={{ background: 'linear-gradient(to right, rgba(239,68,68,0.9), rgba(15,31,61,0.5), rgba(96,165,250,0.9))' }} />
        <span className="text-xs text-slate-500">Positive</span>
      </div>

      {/* Heatmap grid */}
      <div className="relative overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Column headers */}
          <div className="flex" style={{ marginLeft: '100px' }}>
            {labels.map((label, j) => (
              <div key={j}
                className="flex-1 px-0.5 pb-1 text-center"
                style={{ minWidth: '52px', maxWidth: '80px' }}>
                <span
                  className="block text-xs text-slate-400 leading-tight"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '72px' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {mat.map((row, i) => (
            <div key={i} className="flex items-center">
              {/* Row label */}
              <div className="w-24 shrink-0 pr-2 text-right text-xs text-slate-400 leading-tight truncate">
                {labels[i]}
              </div>
              {/* Cells */}
              {row.map((val, j) => (
                <div
                  key={j}
                  className="flex-1 cursor-default border border-navy-900/40 transition-transform hover:scale-110 hover:z-10 hover:border-white/20"
                  style={{
                    minWidth: '52px',
                    maxWidth: '80px',
                    height: '44px',
                    background: getColor(val),
                    color: getTextColor(val),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    fontWeight: 500,
                    position: 'relative',
                  }}
                  onMouseEnter={() => setHovered({ r: i, c: j, val })}
                  onMouseLeave={() => setHovered(null)}
                >
                  {Math.abs(val) > 0.05 ? val.toFixed(2) : ''}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div className="mt-3 rounded-lg border border-navy-600/50 bg-navy-800/80 px-4 py-2 text-sm">
          <span className="text-slate-400">{labels[hovered.r]}</span>
          <span className="mx-2 text-slate-600">vs</span>
          <span className="text-slate-400">{labels[hovered.c]}</span>
          <span className="ml-3 font-mono font-bold" style={{ color: hovered.val > 0 ? '#60a5fa' : '#ef4444' }}>
            r = {hovered.val.toFixed(3)}
          </span>
          <span className="ml-2 text-xs text-slate-500">
            ({Math.abs(hovered.val) > 0.7 ? 'Strong' : Math.abs(hovered.val) > 0.4 ? 'Moderate' : 'Weak'}{' '}
            {hovered.val >= 0 ? 'positive' : 'negative'})
          </span>
        </div>
      )}
    </section>
  )
}

// Need React for useState
import React from 'react'
