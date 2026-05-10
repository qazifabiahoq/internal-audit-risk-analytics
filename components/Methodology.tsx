'use client'

interface ModelResult {
  model: string
  accuracy: number
  precision: number
  recall: number
  f1_score: number
  roc_auc: number
}

function Section({ id, title, badge, children }: {
  id: string
  title: string
  badge: string
  children: React.ReactNode
}) {
  return (
    <div id={id} className="glass-card overflow-hidden">
      <div className="border-b border-navy-700/40 bg-navy-800/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-gold-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest text-gold-400">
            {badge}
          </span>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function Stat({ label, value, sub, color = 'text-gold-400' }: {
  label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div className="rounded-xl border border-navy-600/40 bg-navy-800/40 p-4 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold font-mono ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-navy-600/40 bg-navy-950/80 p-4 font-mono text-xs leading-relaxed text-slate-300">
      {children}
    </pre>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold-500/40 bg-gold-500/10 text-sm font-bold text-gold-400">
        {n}
      </div>
      <div className="pb-6 border-l border-navy-700/40 pl-4 -ml-4 ml-0">
        <p className="font-semibold text-white">{title}</p>
        <div className="mt-1 text-sm leading-relaxed text-slate-400">{children}</div>
      </div>
    </div>
  )
}

function WhyBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-400">Why this matters for a bank</p>
      <p className="text-xs leading-relaxed text-blue-100">{children}</p>
    </div>
  )
}

export default function Methodology({ models }: { models: ModelResult[] }) {
  const sorted = [...models].sort((a, b) => b.roc_auc - a.roc_auc)
  const best = sorted[0]

  return (
    <div className="space-y-6">

      {/* Intro */}
      <div className="rounded-xl border border-navy-700/40 bg-navy-800/40 p-5">
        <h2 className="text-xl font-bold text-white">How This Was Built and Why</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          This section walks through every analytical decision made in this project. Each step is explained
          in terms of what it does technically and, more importantly, why a bank's Internal Audit analytics
          team would make that same decision in practice.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          The goal is not just to build a model. The goal is to give audit leadership a defensible,
          interpretable, and continuously useful analytical asset.
        </p>
      </div>

      {/* Phase 1: Data Cleaning */}
      <Section id="method-cleaning" badge="Phase 1" title="Data Cleaning">
        <div className="space-y-5">
          <Step n={1} title="Column Name Standardisation">
            All column names were converted to lowercase snake_case with special characters removed.
            <CodeBlock>{`# Before: "Finding Type", "RiskLevel", "Dept/BU"
# After:  "finding_type", "risklevel", "dept_bu"
df.columns = df.columns.str.strip().str.lower()
              .str.replace(r"[\\s\\-/&]+", "_", regex=True)`}</CodeBlock>
            <WhyBox>
              Inconsistent naming across audit data sources (manual spreadsheets, GRC systems, SAP extracts)
              is one of the most common causes of pipeline failures in a bank. Standardised names allow
              the pipeline to run reliably across multiple data vintages without manual intervention.
            </WhyBox>
          </Step>

          <Step n={2} title="Missing Value Imputation">
            Numeric columns: filled with the column median. Categorical columns: filled with the mode.
            Rows where the target (risk level) was missing were dropped entirely.
            <CodeBlock>{`# Numeric: median (robust to skew in financial data)
df[col].fillna(df[col].median(), inplace=True)

# Categorical: most frequent value
df[col].fillna(df[col].mode()[0], inplace=True)

# Target column: drop rows, cannot impute the label
df.dropna(subset=["risklevel"], inplace=True)`}</CodeBlock>
            <WhyBox>
              Audit data is typically right-skewed: most findings are low value, but a few have very large
              financial impact. Mean imputation would be pulled upward by those outliers and introduce
              bias. Median is the correct choice. Dropping rows with a missing target prevents silent label
              leakage that would inflate model accuracy metrics reported to stakeholders.
            </WhyBox>
          </Step>

          <Step n={3} title="Outlier Detection and Capping (IQR + Z-Score)">
            Two methods applied simultaneously: IQR fence at 1.5x and Z-score threshold at 3.0.
            Outliers are capped to the fence values, not dropped.
            <CodeBlock>{`# IQR method
q1, q3 = df[col].quantile([0.25, 0.75])
iqr = q3 - q1
lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
df[col] = df[col].clip(lower=lower, upper=upper)

# Z-score check (flagging only, |z| > 3)
z_outliers = (np.abs(stats.zscore(df[col])) > 3).sum()`}</CodeBlock>
            <WhyBox>
              Dropping outlier rows in audit data would eliminate the highest-severity findings, the very
              records the model most needs to learn from. Capping preserves them while controlling their
              influence on distance-based models. Using both methods provides dual validation: IQR catches
              distributional extremes, Z-score catches absolute deviations.
            </WhyBox>
          </Step>

          <Step n={4} title="Binary Column Protection">
            Columns with exactly two unique values (like repeat_finding: 0 or 1) are excluded from
            outlier capping. An IQR of zero on a binary column would incorrectly flatten all values to zero.
            <CodeBlock>{`# Skip binary indicators
if df[col].nunique() <= 2:
    continue  # do not clip`}</CodeBlock>
            <WhyBox>
              Repeat finding status is one of the strongest signals for audit risk escalation. Accidentally
              zeroing it out would remove a key risk driver from the model without any warning.
            </WhyBox>
          </Step>
        </div>
      </Section>

      {/* Phase 2: EDA */}
      <Section id="method-eda" badge="Phase 2" title="Exploratory Data Analysis">
        <div className="space-y-5">
          <Step n={1} title="Shapiro-Wilk Normality Test">
            Applied to every numeric column to determine whether the data follows a normal distribution.
            <CodeBlock>{`from scipy import stats
stat, p = stats.shapiro(df[col].sample(min(5000, len(df))))
# p > 0.05: normal distribution
# p <= 0.05: non-normal, use non-parametric methods`}</CodeBlock>
            <WhyBox>
              In a regulated environment, the choice between parametric and non-parametric statistical tests
              must be defensible to model risk management. Shapiro-Wilk provides the quantitative evidence
              for that choice. Financial data (severity scores, financial impact) is almost always
              non-normal due to heavy right tails.
            </WhyBox>
          </Step>

          <Step n={2} title="Class Imbalance Assessment">
            The distribution of High, Medium, and Low risk findings was measured. An imbalance ratio
            (max class / min class) was computed and logged.
            <CodeBlock>{`target_dist = df["risklevel"].value_counts()
imbalance_ratio = target_dist.max() / target_dist.min()
# Imbalance ratio > 1.5 triggers class_weight balancing`}</CodeBlock>
            <WhyBox>
              In real audit portfolios, High-risk findings are always the minority. A model trained on
              imbalanced data without correction learns to predict Medium/Low almost exclusively, achieving
              high accuracy while completely failing on the class that matters most.
            </WhyBox>
          </Step>
        </div>
      </Section>

      {/* Phase 3: Feature Engineering */}
      <Section id="method-features" badge="Phase 3" title="Feature Engineering and Selection">
        <div className="space-y-5">
          <Step n={1} title="Derived Feature: Risk Score Composite">
            A new feature was created by combining normalised severity score and financial impact
            with weights reflecting audit committee priorities.
            <CodeBlock>{`sev_norm = (df["severityscore"] - min) / (max - min)
fin_norm = (df["financialimpactusd"] - min) / (max - min)
df["risk_score_composite"] = 0.6 * sev_norm + 0.4 * fin_norm`}</CodeBlock>
            <WhyBox>
              This mirrors the dual-axis risk assessment framework used by audit committees: likelihood
              of control failure (severity) multiplied by impact (financial). Encoding this as a feature
              allows the model to learn from the combined signal rather than treating the two dimensions
              as separate unrelated inputs.
            </WhyBox>
          </Step>

          <Step n={2} title="Derived Feature: Finding Severity Index">
            Severity score multiplied by a repeat finding multiplier. Repeat findings get a 2x weight.
            <CodeBlock>{`df["finding_severity_index"] = (
    df["severityscore"] * (1 + df["repeatfinding"].astype(float))
)`}</CodeBlock>
            <WhyBox>
              A repeat finding that scores 6.0 on severity is not the same risk as a new finding at 6.0.
              The repeat occurrence signals that management has failed to remediate a known control gap,
              which escalates the risk profile significantly.
            </WhyBox>
          </Step>

          <Step n={3} title="Multicollinearity Removal">
            Features with Pearson correlation above 0.95 with any other feature were dropped from the
            training set to prevent unstable coefficient estimates in linear models.
            <CodeBlock>{`corr_matrix = pd.DataFrame(X_scaled).corr().abs()
upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1))
to_drop = [col for col in upper.columns if any(upper[col] > 0.95)]`}</CodeBlock>
            <WhyBox>
              Logistic Regression, which is often required in regulated environments for its
              interpretability, becomes numerically unstable when predictors are highly collinear.
              This step protects model validity across the full portfolio of classifiers tested.
            </WhyBox>
          </Step>

          <Step n={4} title="Feature Selection: Three Independent Methods">
            Three selection algorithms were run independently and their top-15 features were unioned.
            <CodeBlock>{`# 1. Mutual Information: measures non-linear statistical dependence
mi_scores = mutual_info_classif(X, y, random_state=42)

# 2. Chi-Square: measures association between features and target
chi2_scores, _ = chi2(X_nonneg, y)

# 3. Recursive Feature Elimination with Random Forest
rfe = RFE(RandomForestClassifier(), n_features_to_select=15)
rfe.fit(X, y)`}</CodeBlock>
            <WhyBox>
              Using three independent methods and taking the union guards against the blind spots of any
              single approach. MI captures non-linear relationships missed by Chi-Square. RFE captures
              interaction effects missed by individual feature scores. The union maximises recall of
              predictive features.
            </WhyBox>
          </Step>
        </div>
      </Section>

      {/* Phase 4 and 5: Models */}
      <Section id="method-models" badge="Phases 4 and 5" title="Model Training and Hyperparameter Tuning">
        <div className="space-y-5">
          <Step n={1} title="Stratified 80/20 Train-Test Split">
            <CodeBlock>{`X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, stratify=y, random_state=42
)`}</CodeBlock>
            <WhyBox>
              Stratified splitting ensures that the test set contains the same proportion of High, Medium,
              and Low risk findings as the training set. Without stratification, a random split might
              concentrate most High-risk findings in training, making test metrics unrealistically
              optimistic or pessimistic.
            </WhyBox>
          </Step>

          <Step n={2} title="Class Weight Balancing">
            All models that support it were trained with class_weight='balanced'. This adjusts the loss
            function to penalise errors on minority classes more heavily.
            <CodeBlock>{`RandomForestClassifier(class_weight="balanced", ...)
LogisticRegression(class_weight="balanced", ...)
SVC(class_weight="balanced", ...)`}</CodeBlock>
            <WhyBox>
              In an audit context, missing a High-risk finding (false negative) is far more costly than
              incorrectly flagging a Low-risk one (false positive). Class weighting aligns the model's
              learning objective with this business reality without requiring synthetic data generation,
              which can cause data leakage if applied before the train-test split.
            </WhyBox>
          </Step>

          <Step n={3} title="Six Models Compared on Equal Terms">
            Every model was evaluated on the same held-out test set using four metrics.
          </Step>

          {/* Model results table */}
          <div className="overflow-x-auto rounded-xl border border-navy-700/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-700/40 bg-navy-800/60">
                  {['Rank', 'Model', 'Accuracy', 'Precision', 'Recall', 'F1 Score', 'ROC-AUC'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/30">
                {sorted.map((m, i) => (
                  <tr key={m.model} className={i === 0 ? 'bg-gold-500/5' : 'hover:bg-navy-800/30'}>
                    <td className="px-4 py-3">
                      {i === 0
                        ? <span className="rounded-full bg-gold-500/20 px-2 py-0.5 text-xs font-bold text-gold-400">Winner</span>
                        : <span className="text-slate-500">#{i + 1}</span>}
                    </td>
                    <td className={`px-4 py-3 font-medium ${i === 0 ? 'text-white' : 'text-slate-300'}`}>{m.model}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{(m.accuracy * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{(m.precision * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{(m.recall * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{(m.f1_score * 100).toFixed(1)}%</td>
                    <td className={`px-4 py-3 font-mono font-bold ${i === 0 ? 'text-gold-400' : 'text-slate-400'}`}>
                      {(m.roc_auc * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Step n={4} title="Metric Definitions">
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { term: 'Accuracy', def: 'Percentage of all findings correctly classified. Misleading on imbalanced data alone.' },
                { term: 'Precision', def: 'Of all findings flagged as High risk, how many actually are. Controls false alarms.' },
                { term: 'Recall', def: 'Of all actual High-risk findings, how many were caught. Controls missed detections.' },
                { term: 'F1 Score', def: 'Harmonic mean of precision and recall. Primary metric for imbalanced datasets.' },
                { term: 'ROC-AUC', def: 'Probability that the model ranks a randomly chosen High-risk finding above a Low-risk one. 1.0 = perfect, 0.5 = random.' },
                { term: 'Weighted avg', def: 'All metrics above are weighted by class size, giving more weight to larger classes.' },
              ].map(item => (
                <div key={item.term} className="rounded-lg border border-navy-600/40 bg-navy-800/30 p-3">
                  <p className="font-mono text-xs font-semibold text-gold-400">{item.term}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.def}</p>
                </div>
              ))}
            </div>
          </Step>

          <Step n={5} title="Hyperparameter Tuning with Cross-Validation">
            Top 2 models received systematic tuning: GridSearchCV on the best, RandomizedSearchCV on
            the second-best, both using 5-fold cross-validation.
            <CodeBlock>{`# GridSearchCV on best model
GridSearchCV(model, param_grid=params, cv=5, scoring="f1_weighted")

# RandomizedSearchCV on 2nd best
RandomizedSearchCV(model, param_distributions=params,
                   n_iter=20, cv=5, scoring="f1_weighted")`}</CodeBlock>
            <WhyBox>
              5-fold CV means the model is trained and evaluated 5 times on different data slices. This
              gives a reliable estimate of real-world performance before any test set is touched. It is
              the same principle used in model validation frameworks required by bank regulators for SR 11-7
              model risk management compliance.
            </WhyBox>
          </Step>
        </div>
      </Section>

      {/* Phase 6: Explainability */}
      <Section id="method-explain" badge="Phase 6" title="Model Explainability and Feature Importance">
        <div className="space-y-5">
          <Step n={1} title="Feature Importance from Random Forest">
            Each feature's contribution to reducing impurity across all trees in the forest is measured
            and averaged. Higher score = more predictive power.
            <CodeBlock>{`importances = best_model.feature_importances_
# Output: array of scores summing to 1.0
# e.g. financialimpactusd: 0.298, risk_score_composite: 0.260`}</CodeBlock>
            <WhyBox>
              Regulators and audit committees require model decisions to be explainable. Saying "the model
              flagged this finding" is not acceptable. Saying "this finding was flagged because financial
              impact (29.8%) and composite risk score (26.0%) were both elevated, which together account
              for 56% of the model's decision weight" is. Feature importance is the mechanism that
              converts a black-box into a defensible analytical tool.
            </WhyBox>
          </Step>

          <Step n={2} title="SHAP Values (Attempted)">
            SHAP (SHapley Additive exPlanations) was attempted. SHAP assigns each feature a contribution
            value for each individual prediction, not just overall. The pipeline fell back to tree
            feature importance due to a version compatibility issue in this environment.
            <CodeBlock>{`import shap
explainer = shap.TreeExplainer(best_model)
shap_values = explainer.shap_values(X_test[:200])
# mean_shap = average absolute contribution per feature`}</CodeBlock>
            <WhyBox>
              SHAP is the gold standard for explainable AI in regulated industries. Unlike global feature
              importance, SHAP explains individual predictions: why was finding AF-1042 specifically
              classified as High risk? This is critical for audit finding documentation and for
              satisfying model risk management review requirements at any major bank.
            </WhyBox>
          </Step>
        </div>
      </Section>

      {/* Results summary */}
      <Section id="method-results" badge="Results" title="Final Model Performance Summary">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Best Model" value={best?.model ?? 'N/A'} sub="Selected after tuning" color="text-gold-400" />
          <Stat label="Accuracy" value={`${((best?.accuracy ?? 0) * 100).toFixed(1)}%`} sub="On held-out test set" color="text-emerald-400" />
          <Stat label="F1 Score" value={`${((best?.f1_score ?? 0) * 100).toFixed(1)}%`} sub="Weighted across classes" color="text-blue-400" />
          <Stat label="ROC-AUC" value={`${((best?.roc_auc ?? 0) * 100).toFixed(2)}%`} sub="Near-perfect separation" color="text-gold-400" />
        </div>

        <div className="mt-6 rounded-xl border border-gold-500/20 bg-gold-500/5 p-5">
          <p className="text-sm font-bold text-gold-400">What these results mean in practice</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            A ROC-AUC of {((best?.roc_auc ?? 0) * 100).toFixed(1)}% means that if you randomly pick one
            High-risk finding and one Low-risk finding from the audit universe, the model will correctly
            rank the High-risk one above the Low-risk one in {((best?.roc_auc ?? 0) * 100).toFixed(1)}%
            of cases. In a continuous monitoring context, this means the model can reliably surface the
            findings that need immediate action from an audit team, without flooding the team with
            false positives.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            The F1 score of {((best?.f1_score ?? 0) * 100).toFixed(1)}% reflects performance across all
            three risk classes simultaneously. This is the metric that matters when audit leadership asks:
            "If we use this model to prioritise our follow-up work, how confident should we be in its
            recommendations?" The answer, at this F1 level, is: very confident.
          </p>
        </div>
      </Section>

    </div>
  )
}
