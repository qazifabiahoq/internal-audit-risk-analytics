import { promises as fs } from 'fs'
import path from 'path'

import Header from '@/components/Header'
import KPICards from '@/components/KPICards'
import ModelComparisonChart from '@/components/ModelComparisonChart'
import ROCCurveChart from '@/components/ROCCurveChart'
import RiskDistributionChart from '@/components/RiskDistributionChart'
import FeatureImportanceChart from '@/components/FeatureImportanceChart'
import CorrelationHeatmap from '@/components/CorrelationHeatmap'
import TrendChart from '@/components/TrendChart'
import FindingsTable from '@/components/FindingsTable'
import Footer from '@/components/Footer'
import TabContainer from '@/components/TabContainer'
import AuditIntelligence from '@/components/AuditIntelligence'
import Methodology from '@/components/Methodology'

async function loadJson<T>(filename: string): Promise<T> {
  const filePath = path.join(process.cwd(), 'public', 'data', filename)
  const raw = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

const TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    badge: '',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    id: 'audit',
    label: 'Audit Intelligence',
    badge: '',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    id: 'methodology',
    label: 'Methodology',
    badge: '',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
  },
]

export default async function DashboardPage() {
  const [kpis, riskDist, models, features, correlation, findings, trend, roc, auditIntel] =
    await Promise.all([
      loadJson<any>('kpis.json'),
      loadJson<any[]>('risk_distribution.json'),
      loadJson<any[]>('model_comparison.json'),
      loadJson<any[]>('feature_importance.json'),
      loadJson<any>('correlation.json'),
      loadJson<any[]>('findings_table.json'),
      loadJson<any[]>('trend.json'),
      loadJson<any[]>('roc_curve.json'),
      loadJson<any>('audit_intelligence.json'),
    ])

  return (
    <div className="flex min-h-screen flex-col">
      <Header lastUpdated={kpis.lastUpdated} />

      <main className="flex-1">
        <TabContainer tabs={TABS}>
          {/* Tab 1: Dashboard */}
          <div className="space-y-6">
            <KPICards data={kpis} />
            <ModelComparisonChart data={models} />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ROCCurveChart data={roc} models={models} bestModelName={kpis.bestModelName} />
              <RiskDistributionChart data={riskDist} />
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <FeatureImportanceChart data={features} />
              <TrendChart data={trend} />
            </div>
            <CorrelationHeatmap data={correlation} />
            <FindingsTable data={findings} />
          </div>

          {/* Tab 2: Audit Intelligence */}
          <AuditIntelligence data={auditIntel} />

          {/* Tab 3: Methodology */}
          <Methodology models={models} />
        </TabContainer>
      </main>

      <Footer />
    </div>
  )
}
