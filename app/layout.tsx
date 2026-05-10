import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Internal Audit Risk Intelligence Dashboard',
  description:
    'Advanced analytics and ML-powered audit risk classification dashboard. ' +
    'Built with Python, scikit-learn, XGBoost, and Next.js.',
  keywords: ['internal audit', 'risk analytics', 'machine learning', 'data management'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-navy-950 text-slate-200 antialiased">
        {children}
      </body>
    </html>
  )
}
