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

Banks run internal audits to check whether their business units are following rules, managing risk properly, and operating with strong internal controls. Each time an auditor identifies a problem, it gets recorded as an audit finding and assigned a risk level: High, Medium, or Low.

This project applies advanced analytics and machine learning to that audit finding data. It learns the patterns that distinguish a High-risk finding from a Low-risk one, surfaces those patterns in an interactive visual analytics dashboard, and gives the audit team a data-driven foundation for risk management and mitigation decisions.

The result is a three-tab web platform covering a full analytics dashboard, audit-specific business intelligence, and a plain-language methodology walkthrough. All outputs are designed to support the full audit life cycle, from scope definition through findings delivery and continuous monitoring.

---

## Why Was This Built?

Internal audit functions at major financial institutions are under increasing pressure to deliver more with the same headcount. Regulators expect data-driven assurance. Audit committees expect KPI and KRI dashboards. Leadership expects proactive analysis of trending and emerging risks rather than backward-looking reports delivered weeks after the fact.

This project addresses three specific problems that data analytics can solve for any audit management team:

**Problem 1: Prioritisation at scale.** When hundreds of findings are open at the same time, deciding which ones need immediate action requires analytical thinking, not just experience. A model that reliably ranks findings by predicted risk level gives the team a consistent, defensible triage tool.

**Problem 2: Inconsistent risk judgments across audit engagements.** Without a shared quantitative framework, two auditors reviewing similar findings in different business units may reach different conclusions. A model trained on historical patterns brings consistency across integrated audits that span multiple departments.

**Problem 3: No structured view of the control environment.** Audit teams often lack a consolidated view of which departments, control types, and root causes are driving the most risk. This project builds that view using data profiles and aggregation, giving leadership the context needed to define scope for future audit engagements and strengthen the overall control environment.

---

## How Was It Built?

### Part 1: The Data Pipeline (Python)

The pipeline runs in seven phases. No technical knowledge is needed to understand what each one does or why.

**Phase 1: Data cleaning.**
The raw data was inspected for missing values, duplicates, and unusual entries. Missing numbers were replaced with the median value of that column rather than the average, because financial and audit data tends to be skewed by a small number of very large findings. Duplicates were removed. Extreme values were capped rather than deleted, because the most extreme findings are often the most important ones for the model to learn from.

**Phase 2: Exploratory analysis.**
Statistical tests were run across every column to understand the distribution of the data. The split between High, Medium, and Low risk findings was measured. This step revealed that High-risk findings are the minority class, which is realistic for any audit portfolio. Handling that imbalance correctly is important: a model that ignores it would learn to predict Low risk almost every time and still achieve a misleadingly high accuracy score.

**Phase 3: Feature engineering and selection.**
Two new calculated columns were created to capture patterns the raw data does not express directly. The first combines severity score and financial impact into a composite risk score, reflecting how audit committees assess risk on two dimensions simultaneously. The second amplifies the severity of repeat findings, because a control failure that has already been identified and left unresolved is a more serious signal than a new one.

Three independent statistical methods were then used to identify which columns are genuinely predictive of risk level. Only those columns were passed to the models, removing noise and improving reliability.

**Phase 4: Training and comparing six models.**
Six machine learning and artificial intelligence algorithms were trained on the same data using the same train-test split. This fair comparison is the only way to know which approach works best for a given dataset. Algorithms tested: Logistic Regression, Decision Tree, Random Forest, XGBoost (gradient boosting), Support Vector Machine, and K-Nearest Neighbours. Each model was evaluated on accuracy, precision, recall, F1 score, and ROC-AUC.

**Phase 5: Hyperparameter tuning.**
The top two models were tuned using a systematic search across configuration options, validated with five-fold cross-validation. This means each model was trained and evaluated five times on different data subsets before the final test set was ever touched, giving a reliable performance estimate.

**Phase 6: Explainability.**
The final model's decisions were decomposed to show which factors contribute most to classifying a finding as High risk. This step is not optional in a banking context. Any analytical output used to inform audit decisions must be explainable to model risk management teams, regulators, and audit committee members.

**Phase 7: Export.**
All results were exported as structured data files, which the dashboard reads directly. This means the dashboard has no database dependency and deploys as a static site to the cloud with zero infrastructure overhead.

### Part 2: The Dashboard (Next.js, deployed to Vercel)

The platform has three tabs:

**Dashboard tab.** Four animated KPI cards at the top summarise the portfolio at a glance. Below them, a grouped bar chart compares all six models side by side on every metric. The ROC curve shows how well the best model separates risk classes, with a ranked leaderboard so it is immediately clear which model won and by how much. Additional charts cover risk distribution, feature importance and SHAP-based risk drivers, a correlation heatmap for quantitative relationships between variables, a quarterly trend area chart for continuous monitoring, and a searchable filterable findings table with colour-coded risk badges.

**Audit Intelligence tab.** This tab provides the business intelligence layer that supports audit management decisions. It includes department risk profiles, control environment analysis by control type, root cause breakdowns, repeat finding analysis, overdue rates by business unit, remediation status, and a table showing how key metrics differ across risk levels. Every chart includes an audit-specific interpretation note.

**Methodology tab.** A step-by-step explanation of every decision made in the project, including code snippets and a plain-language explanation of why each step matters in a banking and regulatory context. This section is designed to demonstrate the depth of thinking behind the outputs, not just the outputs themselves.

---

## Key Findings

**Finding 1: Random Forest achieved 97% accuracy and 99.9% ROC-AUC.**
All six models performed well, but Random Forest was the clear winner. A ROC-AUC of 99.9% means the model correctly ranks a High-risk finding above a Low-risk one in 99.9% of cases. This level of performance makes the model suitable as a prioritisation tool in a real audit engagement workflow.

**Finding 2: Financial impact and composite risk score drive over 55% of the model's predictions.**
These two features carry the most weight in every tree in the Random Forest. This confirms that monetary exposure and overall severity are the primary signals for High-risk classification. Audit teams that currently focus on severity scores alone are likely underweighting financial impact in their manual risk assessments.

**Finding 3: Repeat findings are 2.4 times more likely to be High risk.**
Out of 1,500 findings, 364 were repeat findings (previously identified issues that management had not sustainably resolved). Their High-risk rate was 46.4%, compared to 19.4% for new findings. This is one of the strongest actionable insights in the entire dataset and is a direct input for audit management decisions about follow-up frequency and escalation.

**Finding 4: Finance and Operations carry the highest risk concentration.**
Both departments exceeded a 29% High-risk rate in their finding portfolios and had the highest average financial impact per finding. These two factors together make them the clearest candidates for increased audit frequency and tighter scope in the next audit planning cycle.

**Finding 5: Corrective controls are failing at a higher rate than preventive controls.**
Corrective controls are ones that fix a problem after it has occurred. A high volume of High-risk findings linked to corrective control failures indicates the control environment is catching problems too late. Shifting investment toward preventive controls would reduce inherent risk at the source rather than managing it after the fact.

**Finding 6: Overdue findings are concentrated in specific departments.**
Operations had the highest overdue rate of any department. Overdue findings represent ongoing and growing audit exposure. They are also a direct KRI that should be reported to senior management and the Audit Committee. The longer a finding stays open, the more likely it is to escalate in risk level.

**Finding 7: Fraud Risk and Compliance Breach finding types produce the highest High-risk rates.**
These categories carry regulatory and reputational exposure that goes beyond financial impact. They should anchor the continuous monitoring and auditing program and drive the threshold settings for real-time risk alerts.

---

## What Should Be Done Next?

**Connect to live data.**
The pipeline currently runs on a static file. In a production environment, it would connect directly to the bank's GRC system or data warehouse using SQL or a cloud data platform, pulling new findings automatically and refreshing the dashboard on a scheduled basis. This moves the tool from a one-time analysis to a continuous auditing capability.

**Explain individual findings.**
The current model explains which features matter overall. The next step is generating finding-level explanations: why was this specific finding flagged as High risk, not just which features matter in general. This would make the model output usable directly in audit working papers and management letters.

**Add anomaly detection.**
Beyond classifying known risk levels, the system could use unsupervised learning to flag findings that do not match any historical pattern. These anomalies may represent emerging risks that have not been seen before and require an ad-hoc analytical response.

**Build a continuous monitoring layer.**
The trend analysis in the dashboard is currently backward-looking. A continuous monitoring extension would generate alerts when a department's High-risk rate crosses a threshold or when the overdue finding count accumulates beyond an agreed KRI limit.

**Apply natural language processing.**
Audit findings contain free-text descriptions that hold additional risk signals not captured in structured fields. NLP models trained on finding narratives would extract those signals and improve classification accuracy, particularly for complex findings that span multiple risk categories.

**Prepare for model risk management validation.**
Any quantitative model used to support decisions in a regulated bank must pass model risk management review under frameworks like SR 11-7. The next step would be preparing the model documentation package required for that validation, including out-of-time testing, sensitivity analysis, and challenger model benchmarking.

**Automate the pipeline using process automation.**
The data pipeline currently runs manually. Wrapping it in a workflow automation tool and deploying it to a cloud environment would make it a fully automated, scheduled analytical product rather than a one-time portfolio exercise.

---

## Tools and Technologies Used

Every tool listed here was actively used in this project. This section explains what each one did, not just that it was included.

**Python 3.11**
The entire data pipeline is written in Python. Python was chosen because it has the most mature ecosystem for data engineering, statistical analysis, and machine learning of any language available for this type of work.

**pandas**
Used for loading, cleaning, and transforming the audit finding dataset. Specific operations included column name standardisation, missing value imputation by column type, duplicate removal, dtype casting, datetime feature extraction, and all aggregation work that powers the Audit Intelligence tab.

**NumPy**
Used for array operations, mathematical transformations, and the normalisation calculations in the composite risk score feature. Also used for finite value checks when exporting correlation matrices to JSON.

**scipy**
Used for the Shapiro-Wilk normality test (from scipy.stats) run on every numeric column in phase 2. This test determines whether parametric or non-parametric statistical methods are appropriate for a given column, which is a required step in any rigorous quantitative modeling workflow.

**scikit-learn**
The core machine learning library. Used for:
- LabelEncoder and StandardScaler (preprocessing)
- mutual_info_classif and chi2 (feature selection by statistical association)
- RFE with RandomForestClassifier (recursive feature elimination)
- train_test_split with stratification
- LogisticRegression, DecisionTreeClassifier, RandomForestClassifier, SVC, KNeighborsClassifier (model training)
- GridSearchCV and RandomizedSearchCV (hyperparameter tuning)
- accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, roc_curve (evaluation)
- label_binarize (for one-vs-rest ROC curve computation across all three risk classes)

**XGBoost**
Used as the gradient boosting classifier in the six-model comparison. XGBoost is one of the strongest algorithms for tabular data in production machine learning workflows and is widely used in financial services risk analytics.

**SHAP (SHapley Additive exPlanations)**
Attempted for individual-level model explainability via TreeExplainer. SHAP assigns each feature a contribution value for every individual prediction, which is the standard for explainable artificial intelligence in regulated industries. The pipeline fell back to tree feature importances due to a version compatibility issue in the build environment, but the SHAP integration remains in the codebase for production use.

**joblib**
Used to serialise and save the final tuned model to disk as a .pkl file, enabling the model to be loaded and applied to new findings without retraining.

**kagglehub**
Used to load the audit finding dataset directly from Kaggle using the PANDAS adapter. The pipeline falls back to a synthetic dataset automatically when credentials are not available, so the full analytics workflow runs in any environment.

**Next.js 14 (App Router)**
The web dashboard framework. The App Router enables server-side data loading at build time, so all JSON files are read once during the static build and the deployed site requires no server, no database, and no runtime API calls. This architecture makes cloud deployment to Vercel trivially simple and eliminates infrastructure cost entirely.

**React**
Component model for all dashboard UI. Client components handle interactive state (tab switching, table filtering, sorting, pagination, heatmap hover). Server components handle data loading.

**Recharts**
The charting library used for all visualisations: grouped bar charts (model comparison), line charts (ROC curves), horizontal bar charts (risk distribution, feature importance, audit intelligence breakdowns), area charts (trend over time), and the custom correlation heatmap grid.

**Tailwind CSS**
Utility-first CSS framework used for all styling. The dark navy and gold design system, glass card effects, animated KPI cards, risk badge pills, and responsive grid layouts are all built in Tailwind.

**Vercel**
Cloud deployment platform. The Next.js static export is deployed to Vercel's global edge network. Zero server configuration, zero infrastructure management, and automatic HTTPS. The full site loads from pre-built static files, making it extremely fast and completely free to host.

---

## Dataset

Source: [Audit Finding Dataset on Kaggle](https://www.kaggle.com/datasets/dimejikazeem/auditfinding)

The dataset contains audit findings with risk levels, department labels, finding types, control classifications, root causes, financial impact, severity scores, remediation status, and timing information. The target variable for the machine learning models is risk level: High, Medium, or Low.

---

*Built for portfolio purposes using public audit data.*
