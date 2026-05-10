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

The pipeline runs in seven phases.

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

**Finding 1: XGBoost was the best model with 97.3% accuracy and 99.8% ROC-AUC.**
Six models were tested side by side. XGBoost came out on top. A ROC-AUC of 99.8% means that if you give the model one High-risk finding and one Low-risk finding at random, it will correctly identify which is riskier 99.8% of the time. Even the weakest model tested, K-Nearest Neighbours, still achieved 86.3% accuracy, which shows that the risk patterns in this dataset are strong and consistent across methods.

**Finding 2: Two features alone account for nearly 70% of what the model uses to make decisions.**
The composite risk score (a combination of severity and financial impact) accounts for 39.7% of the model's predictive weight. Financial impact on its own accounts for another 29.4%. Together they drive 69% of the classification. This tells audit teams something important: if a finding has a large financial exposure and a high severity score, the model will almost certainly flag it as High risk regardless of anything else.

**Finding 3: High-risk findings carry 17 times the financial exposure of Low-risk ones.**
The average financial impact of a High-risk finding is $744,000. For a Low-risk finding it is $44,000. That is a 17x difference. In a portfolio of 1,500 findings, the 389 High-risk ones represent a disproportionate share of the total financial exposure. This makes accurate classification directly valuable in dollar terms for the bank.

**Finding 4: High-risk findings stay open 3.5 times longer and get slower management responses.**
High-risk findings are open for an average of 96 days. Low-risk findings close in 27 days on average. That alone is a concern. But more striking is the management response time: High-risk findings wait an average of 18 days for management to respond, while Low-risk findings get a response in 5 days. The findings that pose the most risk to the bank are taking the longest to get attention.

**Finding 5: Repeat findings are 2.4 times more likely to be High risk than new ones.**
Out of 1,500 findings, 364 were repeat findings, meaning problems that had already been identified in a prior audit and were supposed to have been fixed. Their High-risk rate was 46.4%, compared to 19.4% for findings appearing for the first time. A control gap that keeps coming back is a much more serious signal than a new one, and this data confirms that quantitatively.

**Finding 6: Finance, Operations, and Treasury all exceed 29% High-risk rates.**
Three departments show nearly identical and elevated High-risk concentrations: Finance and Accounting at 29.2%, Operations at 29.2%, and Treasury and Markets at 29.0%. Operations also carries the highest overdue rate at 14.6%, meaning its findings are both high in risk and slow to be resolved. These three departments together represent the clearest case for increased audit frequency in the next planning cycle.

**Finding 7: Corrective controls produce more High-risk findings than preventive ones.**
Corrective controls fix problems after they have already happened. Preventive controls stop problems before they occur. The data shows corrective controls have a 28.1% High-risk rate versus 23.6% for preventive controls. The gap matters because it tells audit leadership that the control environment is catching failures too late. More investment in preventive controls would reduce the volume of findings at the source rather than just cleaning them up afterward.

**Finding 8: Fraud Risk findings have the highest High-risk rate of any finding type at 32.5%.**
Fraud Risk findings are classified as High risk 32.5% of the time, the highest of any category. Compliance Breach is second at 29.5% and Data Quality Issues third at 28.3%. Data quality is worth noting separately because quality problems in banking data can have systemic downstream effects on reporting, risk models, and regulatory submissions, making them more serious than the finding label alone might suggest.

**Finding 9: 10.3% of all findings are overdue, and 56% are not yet closed.**
Only 44% of the 1,500 findings have been fully remediated. 22.1% are open, 23.6% are in progress, and 10.3% are overdue. That means more than half the audit portfolio remains active. The overdue bucket is particularly important because those findings have missed their agreed deadline, which is a direct KRI that should be escalated to senior management and reported to the Audit Committee.

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
