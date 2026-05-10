# Internal Audit Risk Intelligence Dashboard

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.3-orange?logo=scikitlearn&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-2.0-red)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)

**Live Demo:** [https://internal-audit-risk-analytics.vercel.app/](https://internal-audit-risk-analytics.vercel.app/)

---

## What Is This Project?

Banks run internal audits to check whether their business units are following rules, managing risk properly, and operating with strong controls. Each time an auditor finds a problem, it gets recorded as an audit finding. These findings are rated by risk level: High, Medium, or Low.

The challenge is that audit teams deal with hundreds or thousands of findings at once. Without analytics, deciding which findings need urgent attention and which can wait is slow, inconsistent, and relies heavily on individual judgment.

This project builds a machine learning system that reads audit finding data, learns the patterns that make a finding High risk versus Low risk, and surfaces those insights in a clear interactive dashboard. The goal is to help audit teams work faster, prioritise better, and explain their decisions with data rather than gut feeling.

---

## Why Was This Built?

Internal Audit teams at major banks are increasingly expected to use data and analytics to support their work. Regulators expect it. Senior leadership expects it. And the volume of audit findings has grown to the point where manual review alone is no longer sufficient.

Specifically, this project addresses three practical problems:

**Problem 1: Too many findings, not enough time.** An audit team cannot give equal attention to every finding. They need a reliable way to sort findings by risk so they can focus resources where they matter most.

**Problem 2: Inconsistent risk judgments.** Different auditors may rate similar findings differently. A model trained on historical patterns brings consistency and removes that subjectivity.

**Problem 3: No visibility into patterns.** Without analytics, it is hard to answer questions like: Which departments keep producing the same findings? Which control types are failing most often? Are overdue findings getting worse over time? This dashboard answers all of those questions in one place.

---

## How Was It Built?

The project has two parts: a Python data pipeline that does all the analysis, and a web dashboard that displays the results.

### The Data Pipeline

**Step 1: Clean the data.**
The raw audit finding data was inspected for missing values, duplicate records, and extreme outliers. Missing numbers were filled using the median value of that column (chosen because audit data is skewed by a small number of very large findings). Duplicate rows were removed. Any extreme values were capped rather than deleted, because those extreme findings are often the most important ones.

**Step 2: Explore the data.**
Statistical tests were run to understand the shape of the data. The distribution of High, Medium, and Low risk findings was measured. This revealed that the dataset is imbalanced: fewer findings are classified as High risk, which is realistic but requires special handling so the model does not simply learn to ignore the High risk category.

**Step 3: Engineer features.**
Two new calculated columns were added to help the model learn better patterns. The first combines severity score and financial impact into a single composite risk score, mirroring how audit committees think about risk. The second amplifies the severity of repeat findings, because a problem that has already been identified and not fixed is inherently more serious than a new problem.

**Step 4: Select the most useful variables.**
Three independent statistical methods were used to identify which columns are most predictive of risk level. Only those columns were passed to the models. This removes noise and prevents the model from being confused by irrelevant information.

**Step 5: Train and compare six models.**
Six different machine learning algorithms were trained on the same data using the same rules. This allows a fair comparison so the best one can be selected based on evidence, not assumption. The models tested were: Logistic Regression, Decision Tree, Random Forest, XGBoost, Support Vector Machine, and K-Nearest Neighbours.

**Step 6: Tune the best models.**
The top two models were put through a systematic search for their best configuration settings, tested using five-fold cross-validation. This means each model was trained and evaluated five separate times on different slices of data, giving a reliable performance estimate before touching the final test set.

**Step 7: Explain the results.**
The final model's decisions were broken down to show which factors contributed most to classifying a finding as High risk. This step is critical in a banking environment where analytical outputs must be explainable and defensible to model risk management teams and regulators.

### The Dashboard

The results are displayed in a three-tab web application:

- **Dashboard tab:** Key performance indicators, a side-by-side comparison of all six models, the ROC curve showing how well the best model separates risk levels, a risk distribution chart, feature importance scores, a correlation heatmap, trend analysis over time, and a searchable findings table.

- **Audit Intelligence tab:** Operational analytics broken down by department, control type, root cause, finding type, repeat finding status, overdue rates, and average metrics by risk level. This tab is designed to support audit scoping and risk-based audit planning decisions.

- **Methodology tab:** A plain-language walkthrough of every analytical decision made in the project, including why each step was done and what it means for a bank.

---

## Key Findings

**Finding 1: A single model achieved 97% accuracy and 99.9% ROC-AUC.**
Random Forest was the best-performing model across all metrics. A ROC-AUC of 99.9% means that if the model is given one High-risk finding and one Low-risk finding at random, it will correctly identify which is which 99.9% of the time. This level of performance demonstrates that the risk patterns in audit findings are consistent and learnable.

**Finding 2: Financial impact and composite risk score are the two strongest predictors of High-risk findings.**
Together they account for over 55% of the model's predictive weight. This confirms that monetary exposure and overall severity are the primary signals audit teams should prioritise when triaging findings manually.

**Finding 3: Repeat findings are 2.4 times more likely to be High risk than new findings.**
Out of 1,500 audit findings, 364 were repeat findings. Their High-risk rate was 46.4% compared to 19.4% for new findings. This is a strong signal that unresolved findings escalate in severity over time, and that audit follow-up frequency should be increased for outstanding items.

**Finding 4: Finance and Operations departments show the highest concentration of High-risk findings.**
Both departments exceeded a 29% High-risk rate in their finding portfolios. These departments also carry the highest average financial impact per finding, meaning both the frequency and severity of risk are elevated.

**Finding 5: Corrective controls are failing more often than preventive controls.**
Corrective controls address problems after they occur. A high volume of findings linked to corrective control failures means the organisation is catching problems too late. Shifting investment toward preventive controls would reduce inherent risk at the source.

**Finding 6: The overdue finding rate signals a remediation discipline problem.**
Operations had the highest overdue rate among all departments. Overdue findings represent ongoing audit exposure and are a direct input to KRI dashboards reported to senior management and the Audit Committee.

**Finding 7: Fraud Risk and Compliance Breach finding types produce the highest High-risk rates.**
These categories carry regulatory and reputational exposure beyond financial impact and should drive continuous auditing program priorities.

---

## What Should Be Done Next?

**Connect to live data sources.**
This project runs on a static dataset. In a production environment, the pipeline would connect directly to the bank's GRC (Governance, Risk and Compliance) system, pulling new findings automatically and refreshing the dashboard on a scheduled basis.

**Build individual finding explainability.**
The current model explains which features matter overall. The next step is to explain each individual finding: why was this specific finding rated High risk? SHAP values at the individual level would provide that answer and make the model output usable in audit working papers.

**Add anomaly detection.**
Beyond classifying known risk levels, the system could flag findings that do not match any historical pattern. These anomalies may represent emerging risks that have not yet been seen before and deserve immediate investigation.

**Expand to continuous monitoring.**
The trend analysis in the dashboard is currently backward-looking. A continuous monitoring layer would send real-time alerts when a department's High-risk rate crosses a threshold or when overdue findings accumulate beyond an acceptable level.

**Incorporate natural language processing.**
Audit findings are often described in free-text fields. NLP could extract additional risk signals from the written descriptions that are not captured by structured fields alone.

**Validate the model under SR 11-7.**
Any model used for decision support in a regulated bank must go through model risk management validation. The next step would be preparing the model documentation package required for that process.

---

## How to Run This Locally

**Step 1: Run the data pipeline**

```bash
pip install -r requirements.txt
python pipeline/analysis.py
```

This generates all the data files the dashboard needs. You will need Kaggle credentials to pull the real dataset. The pipeline automatically falls back to a realistic synthetic dataset if credentials are not available.

**Step 2: Run the dashboard**

```bash
npm install
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## Tech Stack

| Purpose | Technology |
|---------|-----------|
| Data loading and cleaning | Python, pandas, kagglehub |
| Statistical analysis | scipy (Shapiro-Wilk, IQR, Z-score) |
| Feature selection | scikit-learn (Mutual Information, Chi-Square, RFE) |
| Machine learning | scikit-learn, XGBoost |
| Model explainability | SHAP, tree feature importances |
| Model persistence | joblib |
| Web dashboard | Next.js 14, React |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Deployment | Vercel (fully static, no server required) |

---

## Dataset

Source: [Audit Finding Dataset on Kaggle](https://www.kaggle.com/datasets/dimejikazeem/auditfinding)

The dataset contains audit findings with risk levels, department labels, finding types, control classifications, root causes, financial impact, severity scores, remediation status, and timing information. The target variable is risk level: High, Medium, or Low.

---

*Built for portfolio purposes using public audit data.*
