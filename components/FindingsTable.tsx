'use client'

import { useState, useMemo } from 'react'
import { riskBadgeClass } from '@/lib/utils'

type Row = Record<string, string | number>

const PAGE_SIZE = 15

const COLUMN_LABELS: Record<string, string> = {
  department:          'Department',
  risklevel:           'Risk Level',
  findingtype:         'Finding Type',
  status:              'Status',
  daysopen:            'Days Open',
  repeatfinding:       'Repeat',
  severityscore:       'Severity',
  rootcause:           'Root Cause',
  controltype:         'Control Type',
  financialimpactusd:  'Financial Impact',
  auditorexperienceyrs:'Exp (Yrs)',
  mgmtresponsedays:    'Mgmt Days',
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    overdue:     'bg-red-500/15 text-red-400 border border-red-500/30',
    open:        'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    'in progress': 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    closed:      'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  }
  const cls = map[status?.toLowerCase()] ?? 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}

function RiskBadge({ level }: { level: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${riskBadgeClass(level)}`}>
      {level}
    </span>
  )
}

export default function FindingsTable({ data }: { data: Row[] }) {
  const [search, setSearch]   = useState('')
  const [riskFilter, setRisk] = useState('All')
  const [sortCol, setSort]    = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage]       = useState(0)

  const riskKey = Object.keys(data[0] ?? {}).find(k => k.toLowerCase().includes('risk'))
  const statusKey = Object.keys(data[0] ?? {}).find(k => k.toLowerCase() === 'status')

  // Determine display columns
  const allCols = data.length > 0 ? Object.keys(data[0]) : []
  const displayCols = allCols.filter(c => {
    const l = c.toLowerCase()
    return !l.includes('finding') || l === 'findingtype' || l === 'repeatfinding'
  }).slice(0, 9)

  const filtered = useMemo(() => {
    let rows = data
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        Object.values(r).some(v => String(v).toLowerCase().includes(q))
      )
    }
    if (riskFilter !== 'All' && riskKey) {
      rows = rows.filter(r => String(r[riskKey]).toLowerCase() === riskFilter.toLowerCase())
    }
    if (sortCol) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortCol], bv = b[sortCol]
        const na = typeof av === 'number' ? av : parseFloat(String(av))
        const nb = typeof bv === 'number' ? bv : parseFloat(String(bv))
        if (!isNaN(na) && !isNaN(nb)) return sortAsc ? na - nb : nb - na
        return sortAsc
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av))
      })
    }
    return rows
  }, [data, search, riskFilter, riskKey, sortCol, sortAsc])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleSort = (col: string) => {
    if (sortCol === col) setSortAsc(p => !p)
    else { setSort(col); setSortAsc(true) }
    setPage(0)
  }

  const fmtCell = (key: string, val: string | number) => {
    const k = key.toLowerCase()
    if (k === 'risklevel') return <RiskBadge level={String(val)} />
    if (k === 'status') return <StatusBadge status={String(val)} />
    if (k === 'repeatfinding') return (
      <span className={`font-mono text-xs ${val == 1 ? 'text-red-400' : 'text-slate-400'}`}>
        {val == 1 ? 'Yes' : 'No'}
      </span>
    )
    if (k === 'financialimpactusd') {
      const n = parseFloat(String(val))
      return <span className="font-mono text-xs text-slate-300">${n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(0)+'K' : n.toFixed(0)}</span>
    }
    if (typeof val === 'number') return <span className="font-mono text-xs">{val.toFixed ? val.toFixed(1) : val}</span>
    return <span className="text-xs text-slate-300">{String(val)}</span>
  }

  return (
    <section id="findings" className="glass-card overflow-hidden p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Audit Findings</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            {filtered.length.toLocaleString()} findings{' '}
            {search || riskFilter !== 'All' ? '(filtered)' : 'total'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search findings..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              className="rounded-lg border border-navy-600/50 bg-navy-800/60 pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20"
            />
          </div>

          {/* Risk filter */}
          <select
            value={riskFilter}
            onChange={e => { setRisk(e.target.value); setPage(0) }}
            className="rounded-lg border border-navy-600/50 bg-navy-800/60 px-3 py-2 text-sm text-slate-200 outline-none focus:border-gold-500/50"
          >
            <option>All</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-navy-700/40">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-navy-700/40 bg-navy-800/60">
              {displayCols.map(col => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-gold-400 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    {COLUMN_LABELS[col.toLowerCase()] ?? col}
                    {sortCol === col && (
                      <span className="text-gold-400">{sortAsc ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700/30">
            {pageData.map((row, i) => (
              <tr key={i} className="table-row-hover">
                {displayCols.map(col => (
                  <td key={col} className="px-4 py-3">
                    {fmtCell(col, row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Page {page + 1} of {totalPages} ({filtered.length.toLocaleString()} results)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-navy-600/50 bg-navy-800/40 px-3 py-1.5 text-xs text-slate-400 transition-all hover:border-gold-500/40 hover:text-gold-400 disabled:opacity-30"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = page < 3 ? i : page - 2 + i
              if (pg >= totalPages) return null
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
                    pg === page
                      ? 'border-gold-500/50 bg-gold-500/10 text-gold-400'
                      : 'border-navy-600/50 bg-navy-800/40 text-slate-400 hover:border-gold-500/30 hover:text-gold-400'
                  }`}
                >
                  {pg + 1}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="rounded-lg border border-navy-600/50 bg-navy-800/40 px-3 py-1.5 text-xs text-slate-400 transition-all hover:border-gold-500/40 hover:text-gold-400 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
