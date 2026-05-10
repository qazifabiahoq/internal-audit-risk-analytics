'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, LabelList, PieChart, Pie,
} from 'recharts'

interface RiskGroup {
  name: string
  High: number
  Medium: number
  Low: number
  total: number
  highPct: number
  avgFinancialImpact?: number
}

interface RepeatFinding {
  repeatCount: number
  newCount: number
  repeatHighPct: number
  newHighPct: number
}

interface StatusItem {
  status: string
  count: number
  pct: number
}

interface AvgMetric {
  riskLevel: string
  severityscore?: number
  financialimpactusd?: number
  daysopen?: number
  mgmtresponsedays?: number
}

interface OverdueDept {
  department: string
  total: number
  overdueCount: number
  overdueRate: number
}

interface AuditIntelligenceData {
  departmentRisk: RiskGroup[]
  findingTypeRisk: RiskGroup[]
  controlTypeRisk: RiskGroup[]
  rootCauseRisk: RiskGroup[]
  repeatFinding: RepeatFinding
  statusBreakdown: StatusItem[]
  avgMetricsByRisk: AvgMetric[]
  overdueByDept: OverdueDept[]
}

const RISK_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' }
const STATUS_COLORS: Record<string, string> = {
  Open:        '#60a5fa',
  Closed:      '#34d399',
  'In Progress': '#f59e0b',
  Overdue:     '#ef4444',
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-bold text-white">{children}</h3>
      {sub && <p className="mt-0.5 text-sm text-slate-400">{sub}</p>}
    </div>
  )
}

function InsightBox({ color, children }: { color: string; children: React.ReactNode }) {
  const styles: Record<string, string> = {
    gold:  'border-gold-500/20 bg-gold-500/5 text-gold-200',
    red:   'border-red-500/20 bg-red-500/5 text-red-200',
    blue:  'border-blue-500/20 bg-blue-500/5 text-blue-200',
    green: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200',
  }
  return (
    <div className={`mt-4 rounded-lg border p-3 ${styles[color] ?? styles.blue}`}>
      <p className="text-xs leading-relaxed">{children}</p>
    </div>
  )
}

const StackedTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0)
  return (
    <div className="rounded-xl border border-navy-600/60 bg-navy-800/95 p-4 shadow-xl backdrop-blur-md">
      <p className="mb-2 font-semibold text-white">{label}</p>
      {['High', 'Medium', 'Low'].map(lvl => {
        const entry = payload.find((p: any) => p.name === lvl)
        if (!entry) return null
        return (
          <div key={lvl} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2 text-slate-400">
              <span className="h-2 w-2 rounded-full" style={{ background: RISK_COLORS[lvl as keyof typeof RISK_COLORS] }} />
              {lvl}
            </span>
            <span className="font-mono font-bold" style={{ color: RISK_COLORS[lvl as keyof typeof RISK_COLORS] }}>
              {entry.value} ({total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        )
      })}
      <div className="mt-2 border-t border-navy-600/40 pt-2 text-xs text-slate-500">
        Total: {total}
      </div>
    </div>
  )
}

function StackedBar({ data, xKey, title, sub, insight, insightColor = 'blue' }: {
  data: RiskGroup[]
  xKey?: string
  title: string
  sub: string
  insight: string
  insightColor?: string
}) {
  const sorted = [...data].sort((a, b) => b.highPct - a.highPct)
  return (
    <div className="glass-card p-6">
      <SectionTitle sub={sub}>{title}</SectionTitle>
      <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 40)}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
          barSize={20}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,110,0.3)" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#cbd5e1', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={140}
          />
          <Tooltip content={<StackedTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '11px', color: '#94a3b8' }} />
          {(['High', 'Medium', 'Low'] as const).map(lvl => (
            <Bar key={lvl} dataKey={lvl} name={lvl} stackId="a"
              fill={RISK_COLORS[lvl]} radius={lvl === 'Low' ? [0, 4, 4, 0] : [0, 0, 0, 0]}>
              {lvl === 'High' && (
                <LabelList
                  dataKey="highPct"
                  position="right"
                  formatter={(v: number) => `${v}%`}
                  style={{ fill: '#ef4444', fontSize: 10, fontWeight: 600 }}
                />
              )}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      <InsightBox color={insightColor}>{insight}</InsightBox>
    </div>
  )
}

export default function AuditIntelligence({ data }: { data: AuditIntelligenceData }) {
  const {
    departmentRisk, findingTypeRisk, controlTypeRisk, rootCauseRisk,
    repeatFinding, statusBreakdown, avgMetricsByRisk, overdueByDept,
  } = data

  const fmtCurrency = (n: number) =>
    n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`

  return (
    <div className="space-y-6">

      {/* Intro banner */}
      <div className="rounded-xl border border-navy-700/40 bg-navy-800/40 p-5">
        <h2 className="text-xl font-bold text-white">Audit Intelligence</h2>
        <p className="mt-1 text-sm text-slate-400">
          Operational analytics derived from audit finding records across departments, control types, root causes,
          and remediation status. These views directly support audit scoping, risk-based audit planning,
          and continuous monitoring programs.
        </p>
      </div>

      {/* KRI Summary row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Repeat Finding Rate',
            value: `${((repeatFinding.repeatCount / (repeatFinding.repeatCount + repeatFinding.newCount)) * 100).toFixed(1)}%`,
            sub: `${repeatFinding.repeatCount.toLocaleString()} of ${(repeatFinding.repeatCount + repeatFinding.newCount).toLocaleString()} findings`,
            color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5',
          },
          {
            label: 'High Risk Rate: Repeat Findings',
            value: `${repeatFinding.repeatHighPct}%`,
            sub: `vs ${repeatFinding.newHighPct}% for new findings`,
            color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5',
          },
          {
            label: 'Overdue Findings',
            value: `${statusBreakdown.find(s => s.status === 'Overdue')?.pct ?? 0}%`,
            sub: `${statusBreakdown.find(s => s.status === 'Overdue')?.count ?? 0} findings past deadline`,
            color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5',
          },
          {
            label: 'Closure Rate',
            value: `${statusBreakdown.find(s => s.status === 'Closed')?.pct ?? 0}%`,
            sub: `${statusBreakdown.find(s => s.status === 'Closed')?.count ?? 0} findings remediated`,
            color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5',
          },
        ].map(k => (
          <div key={k.label}
            className={`rounded-xl border ${k.border} ${k.bg} p-4`}>
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Department risk + Overdue by dept */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <StackedBar
          data={departmentRisk}
          title="Risk Profile by Department"
          sub="Which business units carry the highest concentration of High-risk findings (red % label)"
          insight="Finance and Operations show the highest High-risk rates. These departments warrant more frequent audit cycles and should be prioritised in the annual audit universe. High financial impact in these areas amplifies the urgency."
          insightColor="red"
        />

        {/* Overdue by department */}
        <div className="glass-card p-6">
          <SectionTitle sub="Percentage of findings past their remediation deadline by business unit">
            Overdue Finding Rate by Department
          </SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={overdueByDept.slice(0, 8)}
              layout="vertical"
              margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
              barSize={18}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,110,0.3)" horizontal={false} />
              <XAxis type="number" tickFormatter={v => `${v}%`}
                tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="department"
                tick={{ fill: '#cbd5e1', fontSize: 11 }} axisLine={false} tickLine={false} width={140} />
              <Tooltip
                formatter={(v: number) => [`${v}%`, 'Overdue Rate']}
                contentStyle={{ background: '#0f1f3d', border: '1px solid #1e3a6e', borderRadius: '8px', color: '#e2e8f0' }}
              />
              <Bar dataKey="overdueRate" name="Overdue Rate" radius={[0, 6, 6, 0]}>
                {overdueByDept.slice(0, 8).map((d, i) => (
                  <Cell key={d.department}
                    fill={d.overdueRate > 12 ? '#ef4444' : d.overdueRate > 8 ? '#f59e0b' : '#10b981'}
                  />
                ))}
                <LabelList
                  dataKey="overdueRate"
                  position="right"
                  formatter={(v: number) => `${v}%`}
                  style={{ fill: '#94a3b8', fontSize: 10 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <InsightBox color="gold">
            <span className="font-semibold text-gold-400">KRI Alert:</span> Overdue rate exceeding 10% signals a control
            environment weakness. Departments with both high risk concentration and high overdue rates should
            be escalated to the Audit Committee as a systemic remediation concern.
          </InsightBox>
        </div>
      </div>

      {/* Control type + Root cause */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <StackedBar
          data={controlTypeRisk}
          title="Risk Level by Control Type"
          sub="Preventive controls failing = higher inherent risk than detective or corrective gaps"
          insight="Corrective controls showing High-risk findings indicates problems are only being caught after the fact. A bank aiming for a strong control environment needs to shift investments toward Preventive controls to reduce inherent risk at the source."
          insightColor="gold"
        />
        <StackedBar
          data={rootCauseRisk}
          title="Root Cause Analysis"
          sub="People, Process, Technology, or External factors driving High-risk findings"
          insight="Root cause data drives audit recommendations. People-related root causes point to training gaps and governance issues. Technology root causes justify IT audit expansion. This breakdown helps the analytics team frame actionable management letters with targeted remediation guidance."
          insightColor="blue"
        />
      </div>

      {/* Finding type */}
      <StackedBar
        data={findingTypeRisk}
        title="Finding Type Risk Breakdown"
        sub="Which categories of audit findings produce the highest proportion of High-risk outcomes"
        insight="Fraud Risk and Compliance Breach finding types consistently produce the highest High-risk rates. These categories carry regulatory and reputational exposure beyond financial impact and should drive the continuous auditing program priorities and real-time monitoring alert thresholds."
        insightColor="red"
      />

      {/* Repeat findings */}
      <div className="glass-card p-6">
        <SectionTitle sub="Repeat findings are previously identified issues that have not been sustainably remediated">
          Repeat Finding Analysis
        </SectionTitle>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Side-by-side comparison */}
          <div className="space-y-4">
            {[
              { label: 'Repeat Findings', count: repeatFinding.repeatCount, highPct: repeatFinding.repeatHighPct, color: '#ef4444' },
              { label: 'New Findings', count: repeatFinding.newCount, highPct: repeatFinding.newHighPct, color: '#60a5fa' },
            ].map(item => (
              <div key={item.label}
                className="rounded-xl border border-navy-600/40 bg-navy-800/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-300">{item.label}</p>
                  <span className="font-mono text-sm text-slate-500">{item.count.toLocaleString()} findings</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 overflow-hidden rounded-full bg-navy-700/40" style={{ height: '10px' }}>
                    <div className="h-full rounded-full" style={{ width: `${item.highPct}%`, background: item.color }} />
                  </div>
                  <span className="w-14 text-right font-mono text-lg font-bold" style={{ color: item.color }}>
                    {item.highPct}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">are High risk</p>
              </div>
            ))}

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-sm font-semibold text-amber-400">
                Repeat findings are {(repeatFinding.repeatHighPct / Math.max(repeatFinding.newHighPct, 1)).toFixed(1)}x
                more likely to be High risk
              </p>
              <p className="mt-1 text-xs text-slate-400">
                This confirms that unresolved findings escalate in severity over time, a core argument
                for increasing audit follow-up frequency on outstanding items.
              </p>
            </div>
          </div>

          {/* Status breakdown */}
          <div>
            <p className="mb-3 text-sm font-medium text-slate-300">Remediation Status Breakdown</p>
            <div className="space-y-2">
              {statusBreakdown.map(s => (
                <div key={s.status} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-slate-400">{s.status}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-navy-700/40" style={{ height: '8px' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${s.pct}%`, background: STATUS_COLORS[s.status] ?? '#94a3b8' }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono text-sm text-slate-400">{s.pct}%</span>
                  <span className="w-16 text-right text-xs text-slate-600">{s.count.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <InsightBox color="blue">
              <span className="font-semibold text-blue-400">Audit follow-up signal:</span> The combination
              of open and in-progress findings represents ongoing audit exposure. The overdue bucket is a
              direct input to the KRI dashboard reported to senior management and the Audit Committee.
            </InsightBox>
          </div>
        </div>
      </div>

      {/* Average metrics by risk level */}
      {avgMetricsByRisk && avgMetricsByRisk.length > 0 && (
        <div className="glass-card p-6">
          <SectionTitle sub="How key numeric indicators differ across risk levels, confirming the model is learning real patterns">
            Average Profile by Risk Level
          </SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-700/40">
                  {['Risk Level', 'Avg Severity Score', 'Avg Financial Impact', 'Avg Days Open', 'Avg Mgmt Response (days)'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/30">
                {(['High', 'Medium', 'Low'] as const).map(lvl => {
                  const row = avgMetricsByRisk.find(r => r.riskLevel === lvl)
                  if (!row) return null
                  return (
                    <tr key={lvl} className="hover:bg-navy-800/30">
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          lvl === 'High' ? 'badge-high' : lvl === 'Medium' ? 'badge-medium' : 'badge-low'
                        }`}>{lvl}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm" style={{ color: RISK_COLORS[lvl] }}>
                        {row.severityscore?.toFixed(1) ?? 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm" style={{ color: RISK_COLORS[lvl] }}>
                        {row.financialimpactusd ? fmtCurrency(row.financialimpactusd) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-300">
                        {row.daysopen?.toFixed(0) ?? 'N/A'} days
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-300">
                        {row.mgmtresponsedays?.toFixed(0) ?? 'N/A'} days
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <InsightBox color="green">
            <span className="font-semibold text-emerald-400">Pattern confirmation:</span> High-risk findings
            show consistently elevated severity scores, larger financial exposure, more days open, and slower
            management response. This structured separation between risk classes is what gives the ML model
            its high predictive accuracy.
          </InsightBox>
        </div>
      )}
    </div>
  )
}
