/** Humanize snake_case feature names for dashboard display */
export function humanizeFeature(name: string): string {
  const map: Record<string, string> = {
    financialimpactusd:       'Financial Impact (USD)',
    risk_score_composite:     'Risk Score Composite',
    severityscore:            'Severity Score',
    daysopen:                 'Days Open',
    mgmtresponsedays:         'Mgmt Response Days',
    auditorexperienceyrs:     'Auditor Experience (Yrs)',
    status_overdue:           'Status: Overdue',
    status_open:              'Status: Open',
    duedate_month:            'Due Date Month',
    auditdate_month:          'Audit Date Month',
    repeatfinding:            'Repeat Finding',
    finding_severity_index:   'Finding Severity Index',
    auditdate_quarter:        'Audit Quarter',
    duedate_quarter:          'Due Date Quarter',
    auditdate_year:           'Audit Year',
    duedate_year:             'Due Date Year',
  }
  const lower = name.toLowerCase()
  if (map[lower]) return map[lower]
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase())
}

/** Format a number with commas */
export function fmtNumber(n: number): string {
  return n.toLocaleString('en-CA')
}

/** Format as percentage string */
export function fmtPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`
}

/** Format currency */
export function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

/** Return Tailwind badge class based on risk level */
export function riskBadgeClass(level: string): string {
  const l = level?.toLowerCase() ?? ''
  if (l === 'high') return 'badge-high'
  if (l === 'medium') return 'badge-medium'
  return 'badge-low'
}

/** Map risk level string to display colour */
export function riskColor(level: string): string {
  const l = level?.toLowerCase() ?? ''
  if (l === 'high') return '#ef4444'
  if (l === 'medium') return '#f59e0b'
  return '#10b981'
}
