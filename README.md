# Internal Audit Risk Intelligence Dashboard

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.3-orange?logo=scikitlearn&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-2.0-red)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)

A production-grade analytics platform that applies machine learning to internal audit finding classification, risk prioritisation, and continuous monitoring. Built to demonstrate the full advanced analytics workflow used by data analytics teams within Internal Audit at a major financial institution.

---

## What This Project Does

The platform ingests raw audit finding records, cleans and enriches the data through a 7-phase Python pipeline, trains and compares 6 machine learning classifiers, selects the best model via cross-validated hyperparameter tuning, and surfaces all results in an interactive dashboard deployed on Vercel.

**Core analytical questions answered:**
- Which audit findings carry the highest risk and why?
- Which model most accurately classifies risk level (High / Medium / Low)?
- What are the primary risk drivers (feature importance / SHAP values)?
- How does the audit finding portfolio trend over time by risk category?
- Which findings require immediate escalation?

---

## Project Structure

```
internal-audit-risk-analytics/
├── pipeline/
│   └── analysis.py          # 7-phase ML pipeline (run locally)
├── public/
│   └── data/                # Pre-generated JSON for Next.js static build
│       ├── kpis.json
│       ├── model_comparison.json
│       ├── roc_curve.json
│       ├── risk_distribution.json
│       ├── feature_importance.json
│       ├── correlation.json
│       ├── findings_table.json
│       └── trend.json
├── app/                     # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/              # Dashboard sections
│   ├── Header.tsx
│   ├── KPICards.tsx
│   ├── ModelComparisonChart.tsx
│   ├── ROCCurveChart.tsx
│   ├── RiskDistributionChart.tsx
│   ├── FeatureImportanceChart.tsx
│   ├── CorrelationHeatmap.tsx
│   ├── TrendChart.tsx
│   ├── FindingsTable.tsx
│   └── Footer.tsx
├── lib/
│   └── utils.ts
├── requirements.txt
├── package.json
└── next.config.js
```

---

## Python Pipeline (Phases 1 to 7)

| Phase | Description |
|-------|-------------|
| 1 | Data Cleaning: null imputation (median/mode), duplicate removal, IQR + Z-score outlier capping, dtype standardisation |
| 2 | EDA: descriptive stats, Shapiro-Wilk normality, value counts, class imbalance analysis |
| 3 | Feature Engineering: ordinal/one-hot encoding, StandardScaler, multicollinearity filter, MI + Chi2 + RFE feature selection |
| 4 | Model Training: Logistic Regression, Decision Tree, Random Forest, XGBoost, SVM, KNN on 80/20 stratified split |
| 5 | Hyperparameter Tuning: GridSearchCV + RandomizedSearchCV with 5-fold cross-validation on top 2 models |
| 6 | Final Analysis: SHAP values / feature importances, ROC curve, confusion matrix |
| 7 | JSON Export: all outputs exported to public/data/ for the static Next.js frontend |

---

## Dashboard Sections

1. **Header** - Navigation with section anchors and live status indicator
2. **KPI Cards** - Animated counters: total findings, high-risk %, best model accuracy, flagged count
3. **Model Comparison Chart** - Grouped bar chart comparing all 6 models on Accuracy, F1, ROC-AUC
4. **ROC Curve** - One-vs-Rest curves per risk class with AUC annotations
5. **Risk Distribution** - Stacked portfolio bar + horizontal bar chart by severity
6. **Feature Importance** - Top 10 risk drivers with SHAP scores and audit insight callouts
7. **Correlation Heatmap** - Interactive grid heatmap with hover tooltip
8. **Trend Chart** - Quarterly area chart stratified by risk level for continuous monitoring
9. **Findings Table** - Sortable, filterable, paginated with risk badge pills and search
10. **Footer** - Stack attribution

---

## How to Run Locally

### Step 1 - Run the Python Pipeline

```bash
pip install -r requirements.txt
python pipeline/analysis.py
```

This generates all JSON files in `public/data/`. Requires Kaggle credentials configured via `~/.kaggle/kaggle.json` to pull the real dataset. The pipeline falls back to a realistic synthetic dataset automatically if credentials are not available.

### Step 2 - Run the Next.js App

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

---

## Deploy to Vercel

The app is fully static (no server-side runtime). Deploy directly from this repo:

1. Connect the GitHub repository to Vercel
2. Set the framework to **Next.js**
3. No environment variables required
4. The pre-generated JSON files in `public/data/` are served as static assets

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Data ingestion | kagglehub, pandas |
| Statistical analysis | scipy (Shapiro-Wilk, IQR, Z-score) |
| Feature selection | scikit-learn (MI, Chi2, RFE) |
| Machine learning | scikit-learn, XGBoost |
| Explainability | SHAP (TreeExplainer) |
| Model serialisation | joblib |
| Frontend framework | Next.js 14 App Router |
| Charting | Recharts |
| Styling | Tailwind CSS |
| Deployment | Vercel (static export) |

---

## Dataset

Source: [Audit Finding Dataset](https://www.kaggle.com/datasets/dimejikazeem/auditfinding) (Kaggle, dimejikazeem)

Target variable: Risk Level (High / Medium / Low) - multi-class classification predicting which audit findings require escalation.

---

## Screenshot

![Dashboard Screenshot](./screenshot-placeholder.png)

*Replace with an actual screenshot after first deployment.*
