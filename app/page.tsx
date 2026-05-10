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

async function loadJson<T>(filename: string): Promise<T> {
  const filePath = path.join(process.cwd(), 'public', 'data', filename)
  const raw = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

export default async function DashboardPage() {
  const [kpis, riskDist, models, features, correlation, findings, trend, roc] =
    await Promise.all([
      loadJson<any>('kpis.json'),
      loadJson<any[]>('risk_distribution.json'),
      loadJson<any[]>('model_comparison.json'),
      loadJson<any[]>('feature_importance.json'),
      loadJson<any>('correlation.json'),
      loadJson<any[]>('findings_table.json'),
      loadJson<any[]>('trend.json'),
      loadJson<any[]>('roc_curve.json'),
    ])

  return (
    <div className="flex min-h-screen flex-col">
      <Header lastUpdated={kpis.lastUpdated} />

      <main className="mx-auto w-full max-w-screen-2xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-10">

        {/* KPI Cards */}
        <KPICards data={kpis} />

        {/* Model Comparison - showstopper, full width */}
        <ModelComparisonChart data={models} />

        {/* ROC + Risk Distribution side by side */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ROCCurveChart data={roc} />
          <RiskDistributionChart data={riskDist} />
        </div>

        {/* Feature Importance + Trend side by side */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <FeatureImportanceChart data={features} />
          <TrendChart data={trend} />
        </div>

        {/* Correlation Heatmap - full width */}
        <CorrelationHeatmap data={correlation} />

        {/* Findings Table - full width */}
        <FindingsTable data={findings} />
      </main>

      <Footer />
    </div>
  )
}
