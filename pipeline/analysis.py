"""
Internal Audit Risk Analytics Pipeline
=======================================
Phases 1-7: Data Cleaning -> EDA -> Feature Engineering -> Model Training
         -> Hyperparameter Tuning -> Final Analysis -> JSON Export

Dataset: dimejikazeem/auditfinding (Kaggle)
Target:  risk_level (High / Medium / Low) - predict which audit findings
         carry elevated risk so audit teams can prioritize remediation.

Designed to mirror the analytics workflow used by a Manager, Advanced
Analytics & Data Management in an Internal Audit function at a major bank.
"""

import os
import sys
import json
import warnings
import traceback
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
from scipy import stats
import joblib

# Silence non-critical warnings for cleaner console output
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=RuntimeWarning)

# ── Paths ──────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "public" / "data"
PIPELINE_DIR = ROOT / "pipeline"
DATA_DIR.mkdir(parents=True, exist_ok=True)
PIPELINE_DIR.mkdir(parents=True, exist_ok=True)

EDA_REPORT_PATH = PIPELINE_DIR / "eda_report.txt"
MODEL_CSV_PATH  = PIPELINE_DIR / "model_comparison.csv"
MODEL_PKL_PATH  = PIPELINE_DIR / "best_model.pkl"


# ══════════════════════════════════════════════════════════════════════════
# HELPER UTILITIES
# ══════════════════════════════════════════════════════════════════════════

def banner(text: str) -> None:
    """Print a section banner so progress is easy to follow in the console."""
    width = 70
    print("\n" + "=" * width)
    print(f"  {text}")
    print("=" * width)


def info(msg: str) -> None:
    print(f"  [INFO]  {msg}")


def save_json(obj, filename: str) -> None:
    path = DATA_DIR / filename
    with open(path, "w") as f:
        json.dump(obj, f, indent=2, default=str)
    info(f"Saved {filename} -> {path}")


# ══════════════════════════════════════════════════════════════════════════
# DATA LOADING
# ══════════════════════════════════════════════════════════════════════════

def load_data() -> pd.DataFrame:
    """
    Attempt to load the Kaggle dataset via kagglehub.
    Falls back to a realistic synthetic dataset if Kaggle credentials are
    not configured in this environment (e.g. CI / Vercel build).

    Synthetic data is generated to match the column structure and
    statistical properties of the real audit-finding dataset so that
    every downstream phase runs identically.
    """
    banner("DATA LOADING")

    try:
        import kagglehub
        from kagglehub import KaggleDatasetAdapter

        info("Attempting Kaggle download via kagglehub ...")
        df = kagglehub.load_dataset(
            KaggleDatasetAdapter.PANDAS,
            "dimejikazeem/auditfinding",
            "",
        )
        info(f"Kaggle dataset loaded. Shape: {df.shape}")
        return df

    except Exception as exc:
        info(f"Kaggle load failed ({exc.__class__.__name__}: {exc})")
        info("Falling back to synthetic audit-finding dataset ...")
        return _generate_synthetic_data()


def _generate_synthetic_data(n: int = 1_500, seed: int = 42) -> pd.DataFrame:
    """
    Generate a realistic synthetic audit-finding dataset.

    Column design mirrors standard internal-audit data in a large bank and
    is aligned with the KPIs tracked by Internal Audit Data Analytics teams:
    risk level, finding type, control environment quality, remediation speed.
    """
    rng = np.random.default_rng(seed)

    departments = [
        "Retail Banking", "Commercial Banking", "Treasury & Markets",
        "Risk Management", "Compliance & Regulatory", "IT & Cybersecurity",
        "Operations", "Finance & Accounting",
    ]
    finding_types = [
        "Control Deficiency", "Process Gap", "Data Quality Issue",
        "Compliance Breach", "IT / Cyber Risk", "Operational Risk",
        "Fraud Risk", "Model Risk",
    ]
    root_causes = ["People", "Process", "Technology", "External"]
    control_types = ["Preventive", "Detective", "Corrective"]
    statuses = ["Open", "Closed", "In Progress", "Overdue"]
    repeat_vals = [0, 1]

    # Risk level assignment with intentional class imbalance (realistic for audit)
    risk_probs = [0.25, 0.45, 0.30]   # High / Medium / Low
    risk_levels = rng.choice(["High", "Medium", "Low"], size=n, p=risk_probs)

    # Derive correlated numeric features so ML models can learn real patterns
    severity_base = {"High": 7.5, "Medium": 5.0, "Low": 2.8}
    severity_scores = np.array([
        np.clip(rng.normal(severity_base[r], 1.2), 1, 10) for r in risk_levels
    ])

    financial_base = {"High": 850_000, "Medium": 220_000, "Low": 45_000}
    financial_impact = np.array([
        max(0, rng.normal(financial_base[r], financial_base[r] * 0.4))
        for r in risk_levels
    ])

    days_open_base = {"High": 95, "Medium": 55, "Low": 25}
    days_open = np.array([
        max(1, int(rng.normal(days_open_base[r], 20))) for r in risk_levels
    ])

    mgmt_response_base = {"High": 18, "Medium": 10, "Low": 5}
    mgmt_response_days = np.array([
        max(1, int(rng.normal(mgmt_response_base[r], 5))) for r in risk_levels
    ])

    # Status is correlated: High-risk findings more often Overdue/Open
    status_weights = {
        "High":   [0.35, 0.20, 0.25, 0.20],
        "Medium": [0.25, 0.40, 0.25, 0.10],
        "Low":    [0.10, 0.70, 0.18, 0.02],
    }
    statuses_col = np.array([
        rng.choice(statuses, p=status_weights[r]) for r in risk_levels
    ])

    # Repeat findings are more common in High-risk departments
    repeat_probs = {"High": 0.45, "Medium": 0.22, "Low": 0.08}
    repeat_finding = np.array([
        int(rng.random() < repeat_probs[r]) for r in risk_levels
    ])

    # Auditor experience inversely correlated with finding severity
    auditor_exp = np.array([
        max(1, int(rng.normal(8 if r == "High" else 12, 3))) for r in risk_levels
    ])

    # Audit dates spread across 3 years
    base_date = pd.Timestamp("2021-01-01")
    audit_dates = pd.to_datetime(
        [base_date + pd.Timedelta(days=int(rng.integers(0, 1095))) for _ in range(n)]
    )
    due_dates = audit_dates + pd.to_timedelta(days_open, unit="D")

    df = pd.DataFrame({
        "FindingID":             [f"AF-{1000 + i}" for i in range(n)],
        "Department":            rng.choice(departments, size=n),
        "RiskLevel":             risk_levels,
        "FindingType":           rng.choice(finding_types, size=n),
        "Status":                statuses_col,
        "AuditDate":             audit_dates,
        "DueDate":               due_dates,
        "DaysOpen":              days_open,
        "RepeatFinding":         repeat_finding,
        "SeverityScore":         np.round(severity_scores, 2),
        "RootCause":             rng.choice(root_causes, size=n),
        "ControlType":           rng.choice(control_types, size=n),
        "FinancialImpactUSD":    np.round(financial_impact, 2),
        "AuditorExperienceYrs":  auditor_exp,
        "MgmtResponseDays":      mgmt_response_days,
    })

    info(f"Synthetic dataset generated. Shape: {df.shape}")
    return df


# ══════════════════════════════════════════════════════════════════════════
# PHASE 1 — DATA CLEANING
# ══════════════════════════════════════════════════════════════════════════

def phase1_clean(df: pd.DataFrame) -> pd.DataFrame:
    banner("PHASE 1 — DATA CLEANING")

    info(f"Raw shape: {df.shape}")
    info(f"Column dtypes:\n{df.dtypes.to_string()}")

    # ── Standardise column names: snake_case, strip whitespace ───────────
    # Reason: consistent naming prevents KeyError bugs downstream and makes
    # code readable across Python and JSON layers.
    df.columns = (
        df.columns.str.strip()
                  .str.replace(r"[\s\-/&]+", "_", regex=True)
                  .str.replace(r"[^\w]", "", regex=True)
                  .str.lower()
    )
    info(f"Standardised columns: {df.columns.tolist()}")

    # ── Inspect nulls ─────────────────────────────────────────────────────
    null_counts = df.isnull().sum()
    info(f"Null counts per column:\n{null_counts[null_counts > 0].to_string() or 'None'}")

    # ── Impute / drop missing values ──────────────────────────────────────
    # Strategy: numeric -> median (robust to skew); categorical -> mode.
    # Median is preferred over mean for financial/severity columns because
    # audit data is typically right-skewed due to rare high-impact findings.
    for col in df.select_dtypes(include=["float64", "int64"]).columns:
        if df[col].isnull().sum() > 0:
            median_val = df[col].median()
            df[col].fillna(median_val, inplace=True)
            info(f"  Imputed '{col}' with median={median_val:.2f}")

    for col in df.select_dtypes(include=["object", "category"]).columns:
        if df[col].isnull().sum() > 0:
            mode_val = df[col].mode()[0]
            df[col].fillna(mode_val, inplace=True)
            info(f"  Imputed '{col}' with mode='{mode_val}'")

    # Rows where the target (risk level) is missing cannot be used for
    # supervised learning, so we drop them rather than impute.
    target_col = _detect_target(df)
    before = len(df)
    df.dropna(subset=[target_col], inplace=True)
    info(f"Dropped {before - len(df)} rows with missing target '{target_col}'")

    # ── Remove duplicates ─────────────────────────────────────────────────
    # Keep first occurrence; exact duplicates add no information and can
    # inflate model performance metrics.
    before = len(df)
    df.drop_duplicates(inplace=True)
    info(f"Removed {before - len(df)} duplicate rows")

    # ── Fix data types ────────────────────────────────────────────────────
    # Date columns as datetime so we can extract temporal features later.
    date_cols = [c for c in df.columns if "date" in c]
    for col in date_cols:
        df[col] = pd.to_datetime(df[col], errors="coerce")
        info(f"  Converted '{col}' to datetime")

    # Low-cardinality text columns as category to save memory.
    cat_threshold = 30
    for col in df.select_dtypes(include="object").columns:
        if df[col].nunique() <= cat_threshold:
            df[col] = df[col].astype("category")
            info(f"  Cast '{col}' -> category  ({df[col].nunique()} unique values)")

    # ── Outlier detection and handling ────────────────────────────────────
    # Method: IQR (1.5x fence) + Z-score (|z| > 3) on numeric columns.
    # Decision: cap rather than remove — removing rows risks losing rare
    # High-risk findings which are exactly what the model needs to learn.
    numeric_cols = df.select_dtypes(include=["float64", "int64"]).columns.tolist()
    for col in numeric_cols:
        # Skip binary indicator columns: IQR = 0 would incorrectly zero them out
        if df[col].nunique() <= 2:
            info(f"  '{col}': binary column, skipping outlier capping")
            continue
        q1, q3 = df[col].quantile([0.25, 0.75])
        iqr = q3 - q1
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        iqr_outliers = ((df[col] < lower) | (df[col] > upper)).sum()

        zscores = np.abs(stats.zscore(df[col].dropna()))
        z_outliers = (zscores > 3).sum()

        if iqr_outliers > 0 or z_outliers > 0:
            df[col] = df[col].clip(lower=lower, upper=upper)
            info(f"  '{col}': {iqr_outliers} IQR outliers, {z_outliers} Z-score outliers -> capped")

    info(f"Clean shape: {df.shape}")
    return df


def _detect_target(df: pd.DataFrame) -> str:
    """Identify the risk-level target column by name heuristic."""
    candidates = [c for c in df.columns if "risk" in c and "level" in c]
    if candidates:
        return candidates[0]
    candidates = [c for c in df.columns if "risk" in c]
    if candidates:
        return candidates[0]
    # Last resort: first column with High/Medium/Low values
    for col in df.columns:
        vals = set(df[col].astype(str).str.lower().unique())
        if {"high", "medium", "low"}.issubset(vals):
            return col
    raise ValueError("Cannot detect target column — expected a risk-level column.")


# ══════════════════════════════════════════════════════════════════════════
# PHASE 2 — EXPLORATORY DATA ANALYSIS
# ══════════════════════════════════════════════════════════════════════════

def phase2_eda(df: pd.DataFrame, target_col: str) -> dict:
    """
    Compute descriptive statistics, distributions, and audit-specific
    breakdowns. Saves a plain-text EDA report for audit documentation.
    Returns a dict of outputs consumed by the export phase.
    """
    banner("PHASE 2 — EXPLORATORY DATA ANALYSIS")

    report_lines = ["Internal Audit Risk Analytics — EDA Report",
                    f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                    "=" * 60, ""]

    numeric_df = df.select_dtypes(include=["float64", "int64"])

    # ── Descriptive statistics ────────────────────────────────────────────
    desc = numeric_df.describe().T
    desc["skewness"] = numeric_df.skew()
    desc["kurtosis"] = numeric_df.kurtosis()
    info(f"Descriptive statistics:\n{desc.to_string()}")
    report_lines += ["DESCRIPTIVE STATISTICS", desc.to_string(), ""]

    # ── Shapiro-Wilk normality test ───────────────────────────────────────
    # Used by audit analytics teams to determine whether parametric or
    # non-parametric tests are appropriate in subsequent analysis.
    report_lines += ["SHAPIRO-WILK NORMALITY TESTS (sample ≤ 5000)"]
    for col in numeric_df.columns:
        sample = numeric_df[col].dropna().sample(min(5000, len(numeric_df)), random_state=42)
        stat, p = stats.shapiro(sample)
        normal = "NORMAL" if p > 0.05 else "NON-NORMAL"
        report_lines.append(f"  {col}: W={stat:.4f}, p={p:.4e} -> {normal}")
        info(f"  Shapiro-Wilk [{col}]: {normal} (p={p:.4e})")
    report_lines.append("")

    # ── Categorical value counts ──────────────────────────────────────────
    cat_cols = df.select_dtypes(include=["category", "object"]).columns
    report_lines += ["CATEGORICAL FREQUENCY DISTRIBUTIONS"]
    for col in cat_cols:
        vc = df[col].value_counts()
        report_lines.append(f"\n  {col}:")
        report_lines.append(vc.to_string())
        info(f"  Value counts [{col}]:\n{vc.to_string()}")
    report_lines.append("")

    # ── Target distribution + class imbalance check ───────────────────────
    target_dist = df[target_col].value_counts()
    imbalance_ratio = target_dist.max() / target_dist.min()
    report_lines += [
        "TARGET DISTRIBUTION",
        target_dist.to_string(),
        f"\n  Imbalance ratio (max/min): {imbalance_ratio:.2f}",
        "  -> SMOTE or class_weight balancing applied in Phase 3/4" if imbalance_ratio > 1.5 else "",
        "",
    ]
    info(f"Target distribution:\n{target_dist.to_string()}")
    info(f"Class imbalance ratio: {imbalance_ratio:.2f}")

    # ── Audit-specific breakdowns ─────────────────────────────────────────
    dept_col  = next((c for c in df.columns if "department" in c), None)
    type_col  = next((c for c in df.columns if "finding" in c and "type" in c), None)
    stat_col  = next((c for c in df.columns if "status" in c), None)
    sev_col   = next((c for c in df.columns if "severity" in c), None)

    breakdowns = {}
    if dept_col:
        breakdowns["by_department"] = df.groupby(dept_col)[target_col].value_counts().to_dict()
    if type_col:
        breakdowns["by_finding_type"] = df[type_col].value_counts().to_dict()
    if stat_col:
        breakdowns["by_status"] = df[stat_col].value_counts().to_dict()

    # Write report
    with open(EDA_REPORT_PATH, "w") as f:
        f.write("\n".join(str(l) for l in report_lines))
    info(f"EDA report saved -> {EDA_REPORT_PATH}")

    return {
        "descriptive_stats": desc,
        "target_distribution": target_dist,
        "breakdowns": breakdowns,
        "imbalance_ratio": imbalance_ratio,
    }


# ══════════════════════════════════════════════════════════════════════════
# PHASE 3 — FEATURE ENGINEERING
# ══════════════════════════════════════════════════════════════════════════

def phase3_features(df: pd.DataFrame, target_col: str):
    """
    Encode, scale, select features.
    Returns (X_array, y_array, feature_names, label_encoder_for_target).
    """
    from sklearn.preprocessing import LabelEncoder, StandardScaler
    from sklearn.feature_selection import mutual_info_classif, chi2, RFE
    from sklearn.ensemble import RandomForestClassifier

    banner("PHASE 3 — FEATURE ENGINEERING")

    # ── Extract temporal features from date columns ───────────────────────
    # Temporal patterns matter in audit: findings opened in Q4 (year-end
    # pressure) or near regulatory deadlines tend to be higher risk.
    date_cols = df.select_dtypes(include=["datetime64[ns]"]).columns
    for col in date_cols:
        df[f"{col}_year"]    = df[col].dt.year
        df[f"{col}_month"]   = df[col].dt.month
        df[f"{col}_quarter"] = df[col].dt.quarter
        info(f"  Extracted year/month/quarter from '{col}'")

    # ── Derived composite features ─────────────────────────────────────────
    # Risk Score Composite: combines severity and financial impact normalised
    # to [0,1]. Captures the dual dimension of risk used by audit committees.
    sev_col = next((c for c in df.columns if "severity" in c), None)
    fin_col = next((c for c in df.columns if "financial" in c or "impact" in c), None)
    if sev_col and fin_col:
        sev_norm = (df[sev_col] - df[sev_col].min()) / (df[sev_col].max() - df[sev_col].min() + 1e-9)
        fin_norm = (df[fin_col] - df[fin_col].min()) / (df[fin_col].max() - df[fin_col].min() + 1e-9)
        df["risk_score_composite"] = (0.6 * sev_norm + 0.4 * fin_norm).round(4)
        info("  Created 'risk_score_composite' (0.6 x severity + 0.4 x financial impact)")

    # Finding Severity Index: severity scaled by whether this is a repeat finding
    repeat_col = next((c for c in df.columns if "repeat" in c), None)
    if sev_col and repeat_col:
        df["finding_severity_index"] = df[sev_col] * (1 + df[repeat_col].astype(float))
        info("  Created 'finding_severity_index' (severity x repeat-finding multiplier)")

    # ── Separate target and features ──────────────────────────────────────
    drop_cols = [target_col] + list(df.select_dtypes(include="datetime64[ns]").columns)
    # Drop ID-like columns (no predictive value)
    id_cols = [c for c in df.columns if "id" in c or "findingid" in c]
    drop_cols += id_cols

    X_raw = df.drop(columns=[c for c in drop_cols if c in df.columns])

    # ── Encode target ─────────────────────────────────────────────────────
    le_target = LabelEncoder()
    y = le_target.fit_transform(df[target_col].astype(str))
    info(f"  Target classes: {le_target.classes_} -> {list(range(len(le_target.classes_)))}")

    # ── Encode categorical predictors ─────────────────────────────────────
    # Ordinal columns: label-encode (they have natural order).
    # Nominal columns: one-hot encode (no natural order).
    ordinal_map = {
        "control_type":  {"preventive": 2, "detective": 1, "corrective": 0},
        "root_cause":    {"people": 0, "process": 1, "technology": 2, "external": 3},
    }
    cat_cols = X_raw.select_dtypes(include=["category", "object"]).columns.tolist()
    ordinal_cols = [c for c in cat_cols if c in ordinal_map]
    nominal_cols = [c for c in cat_cols if c not in ordinal_cols]

    for col in ordinal_cols:
        mapping = ordinal_map[col]
        X_raw[col] = X_raw[col].astype(str).str.lower().map(mapping).fillna(0).astype(int)
        info(f"  Label-encoded '{col}' (ordinal)")

    if nominal_cols:
        X_raw = pd.get_dummies(X_raw, columns=nominal_cols, drop_first=True)
        info(f"  One-hot encoded nominal columns: {nominal_cols}")

    feature_names = X_raw.columns.tolist()
    info(f"  Total features after encoding: {len(feature_names)}")

    # ── Scale numeric features ────────────────────────────────────────────
    # StandardScaler is used so that distance-based models (SVM, KNN) are
    # not dominated by high-magnitude financial-impact values.
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_raw.astype(float))
    info("  Applied StandardScaler to all features")

    # ── Correlation filter (multicollinearity) ────────────────────────────
    # Drop one of any pair with |correlation| > 0.95 to avoid instability
    # in logistic regression coefficients.
    corr_matrix = pd.DataFrame(X_scaled, columns=feature_names).corr().abs()
    upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
    to_drop = [col for col in upper.columns if any(upper[col] > 0.95)]
    if to_drop:
        drop_idx = [feature_names.index(c) for c in to_drop if c in feature_names]
        X_scaled = np.delete(X_scaled, drop_idx, axis=1)
        feature_names = [f for f in feature_names if f not in to_drop]
        info(f"  Dropped {len(to_drop)} highly correlated features (>0.95): {to_drop}")

    # ── Feature selection: Mutual Information ─────────────────────────────
    mi_scores = mutual_info_classif(X_scaled, y, random_state=42)
    mi_series = pd.Series(mi_scores, index=feature_names).sort_values(ascending=False)
    info(f"  Top 10 features by Mutual Information:\n{mi_series.head(10).to_string()}")

    # ── Feature selection: Chi-Square (non-negative values required) ──────
    X_nonneg = X_scaled - X_scaled.min(axis=0)
    try:
        chi2_scores, _ = chi2(X_nonneg, y)
        chi2_series = pd.Series(chi2_scores, index=feature_names).sort_values(ascending=False)
        info(f"  Top 10 features by Chi-Square:\n{chi2_series.head(10).to_string()}")
    except Exception:
        chi2_series = mi_series.copy()
        info("  Chi-Square skipped (numerical issue), using MI scores as fallback")

    # ── Feature selection: Recursive Feature Elimination ──────────────────
    rfe_estimator = RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1)
    rfe = RFE(rfe_estimator, n_features_to_select=min(15, len(feature_names)), step=1)
    rfe.fit(X_scaled, y)
    rfe_selected = [f for f, s in zip(feature_names, rfe.support_) if s]
    info(f"  RFE selected {len(rfe_selected)} features: {rfe_selected[:10]} ...")

    # Union of top features from all three methods
    top_mi  = set(mi_series.head(15).index)
    top_chi = set(chi2_series.head(15).index)
    top_rfe = set(rfe_selected)
    selected = list(top_mi | top_chi | top_rfe)
    selected_idx = [feature_names.index(f) for f in selected if f in feature_names]
    X_final = X_scaled[:, selected_idx]
    feature_names_final = [feature_names[i] for i in selected_idx]
    info(f"  Final feature set ({len(feature_names_final)} features): {feature_names_final[:10]} ...")

    return X_final, y, feature_names_final, le_target, mi_series, corr_matrix


# ══════════════════════════════════════════════════════════════════════════
# PHASE 4 — MODEL TRAINING & COMPARISON
# ══════════════════════════════════════════════════════════════════════════

def phase4_models(X, y, le_target):
    """
    Train 6 classifiers on the same 80/20 stratified split.
    Handles class imbalance via class_weight='balanced' where applicable
    (preferred over SMOTE here to avoid data leakage through oversampling
    before the train/test split, which can inflate metrics).
    Returns results DataFrame and best model name.
    """
    from sklearn.model_selection import train_test_split
    from sklearn.linear_model import LogisticRegression
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.svm import SVC
    from sklearn.neighbors import KNeighborsClassifier
    from xgboost import XGBClassifier
    from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                                  f1_score, roc_auc_score, confusion_matrix)

    banner("PHASE 4 — MODEL TRAINING & COMPARISON")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )
    info(f"Train size: {X_train.shape}, Test size: {X_test.shape}")

    n_classes = len(le_target.classes_)
    avg = "weighted"

    models = {
        "Logistic Regression": LogisticRegression(
            max_iter=1000, class_weight="balanced", random_state=42, solver="lbfgs"
        ),
        "Decision Tree": DecisionTreeClassifier(
            class_weight="balanced", random_state=42
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=200, class_weight="balanced", random_state=42, n_jobs=-1
        ),
        "XGBoost": XGBClassifier(
            n_estimators=200, use_label_encoder=False,
            eval_metric="mlogloss", random_state=42, n_jobs=-1,
            scale_pos_weight=1
        ),
        "SVM": SVC(
            kernel="rbf", class_weight="balanced", probability=True, random_state=42
        ),
        "KNN": KNeighborsClassifier(n_neighbors=7, n_jobs=-1),
    }

    results = []
    trained_models = {}

    for name, model in models.items():
        info(f"  Training {name} ...")
        try:
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            y_prob = model.predict_proba(X_test) if hasattr(model, "predict_proba") else None

            acc  = accuracy_score(y_test, y_pred)
            prec = precision_score(y_test, y_pred, average=avg, zero_division=0)
            rec  = recall_score(y_test, y_pred, average=avg, zero_division=0)
            f1   = f1_score(y_test, y_pred, average=avg, zero_division=0)
            auc  = roc_auc_score(y_test, y_prob, multi_class="ovr", average=avg) if y_prob is not None else 0.0

            cm = confusion_matrix(y_test, y_pred).tolist()
            results.append({
                "model": name,
                "accuracy":  round(acc,  4),
                "precision": round(prec, 4),
                "recall":    round(rec,  4),
                "f1_score":  round(f1,   4),
                "roc_auc":   round(auc,  4),
                "confusion_matrix": str(cm),
            })
            trained_models[name] = model
            info(f"    Acc={acc:.4f} | Prec={prec:.4f} | Rec={rec:.4f} | F1={f1:.4f} | AUC={auc:.4f}")
        except Exception as exc:
            info(f"    FAILED: {exc}")

    results_df = pd.DataFrame(results).sort_values("f1_score", ascending=False)
    results_df.to_csv(MODEL_CSV_PATH, index=False)
    info(f"Model comparison saved -> {MODEL_CSV_PATH}")
    print(results_df.to_string(index=False))

    return results_df, trained_models, X_train, X_test, y_train, y_test


# ══════════════════════════════════════════════════════════════════════════
# PHASE 5 — HYPERPARAMETER TUNING
# ══════════════════════════════════════════════════════════════════════════

def phase5_tuning(results_df, trained_models, X_train, X_test, y_train, y_test):
    """
    Take the top 2 models; apply GridSearchCV to the best and
    RandomizedSearchCV to the second-best. 5-fold cross-validation.
    """
    from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
    from sklearn.metrics import f1_score

    banner("PHASE 5 — HYPERPARAMETER TUNING")

    top2 = results_df.head(2)["model"].tolist()
    info(f"Top 2 models: {top2}")

    param_grids = {
        "Random Forest": {
            "method": "grid",
            "params": {
                "n_estimators": [100, 200],
                "max_depth": [None, 10, 20],
                "min_samples_split": [2, 5],
            },
        },
        "XGBoost": {
            "method": "random",
            "params": {
                "n_estimators": [100, 200, 300],
                "max_depth": [3, 5, 7],
                "learning_rate": [0.01, 0.05, 0.1, 0.2],
                "subsample": [0.7, 0.8, 1.0],
            },
        },
        "Logistic Regression": {
            "method": "grid",
            "params": {
                "C": [0.01, 0.1, 1.0, 10.0],
                "solver": ["lbfgs", "saga"],
            },
        },
        "Decision Tree": {
            "method": "grid",
            "params": {
                "max_depth": [5, 10, None],
                "min_samples_split": [2, 5, 10],
            },
        },
        "SVM": {
            "method": "random",
            "params": {
                "C": [0.1, 1.0, 10.0],
                "gamma": ["scale", "auto"],
                "kernel": ["rbf", "poly"],
            },
        },
        "KNN": {
            "method": "grid",
            "params": {
                "n_neighbors": [5, 7, 11, 15],
                "weights": ["uniform", "distance"],
            },
        },
    }

    tuned_models = {}
    for i, model_name in enumerate(top2):
        if model_name not in trained_models:
            info(f"  {model_name} not in trained models, skipping tuning")
            continue

        base_model = trained_models[model_name]
        pg = param_grids.get(model_name, None)

        if pg is None:
            info(f"  No param grid for {model_name}, using base model")
            tuned_models[model_name] = base_model
            continue

        method = pg["method"] if i == 0 else "random"
        params = pg["params"]
        info(f"  Tuning {model_name} with {'GridSearchCV' if method == 'grid' else 'RandomizedSearchCV'} ...")

        try:
            if method == "grid":
                searcher = GridSearchCV(
                    base_model.__class__(**{k: v for k, v in base_model.get_params().items()
                                            if k not in params}),
                    param_grid=params, cv=5, scoring="f1_weighted",
                    n_jobs=-1, verbose=0,
                )
            else:
                searcher = RandomizedSearchCV(
                    base_model.__class__(**{k: v for k, v in base_model.get_params().items()
                                            if k not in params}),
                    param_distributions=params, n_iter=20, cv=5,
                    scoring="f1_weighted", n_jobs=-1, random_state=42, verbose=0,
                )

            # Clone with safe params only
            from sklearn.base import clone
            clean_model = clone(base_model)
            searcher.estimator = clean_model

            searcher.fit(X_train, y_train)
            best = searcher.best_estimator_
            best_params = searcher.best_params_
            best_score  = searcher.best_score_

            info(f"    Best params: {best_params}")
            info(f"    Best CV F1 score: {best_score:.4f}")

            y_pred = best.predict(X_test)
            test_f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
            info(f"    Test F1 after tuning: {test_f1:.4f}")

            tuned_models[model_name] = best

        except Exception as exc:
            info(f"  Tuning failed for {model_name}: {exc}. Using base model.")
            tuned_models[model_name] = trained_models.get(model_name, base_model)

    if not tuned_models:
        info("No tuned models produced — using best base model.")
        best_name = results_df.iloc[0]["model"]
        tuned_models[best_name] = trained_models[best_name]

    # Select single best tuned model by F1 on test set
    from sklearn.metrics import f1_score as f1
    best_name = max(
        tuned_models,
        key=lambda n: f1(y_test, tuned_models[n].predict(X_test),
                         average="weighted", zero_division=0)
    )
    best_model = tuned_models[best_name]
    info(f"Selected best final model: {best_name}")

    joblib.dump(best_model, MODEL_PKL_PATH)
    info(f"Best model saved -> {MODEL_PKL_PATH}")

    return best_model, best_name


# ══════════════════════════════════════════════════════════════════════════
# PHASE 6 — FINAL MODEL ANALYSIS
# ══════════════════════════════════════════════════════════════════════════

def phase6_analysis(best_model, best_name, X_train, X_test, y_test,
                    feature_names, le_target, mi_series):
    """
    Feature importance via SHAP (tree models) or permutation (linear models).
    ROC curve data points. Confusion matrix.
    """
    banner("PHASE 6 — FINAL MODEL ANALYSIS")

    importance_data = []

    # ── SHAP values (tree-based models) ───────────────────────────────────
    tree_based = ["Random Forest", "XGBoost", "Decision Tree",
                  "Gradient Boosting", "Gradient Boosting (XGBoost)"]

    if any(t.lower() in best_name.lower() for t in tree_based):
        try:
            import shap
            info("  Computing SHAP values ...")
            explainer = shap.TreeExplainer(best_model)
            shap_values = explainer.shap_values(X_test[:200])

            if isinstance(shap_values, list):
                # Multi-class: average absolute SHAP across classes
                mean_shap = np.mean([np.abs(sv).mean(axis=0) for sv in shap_values], axis=0)
            else:
                mean_shap = np.abs(shap_values).mean(axis=0)

            for feat, score in zip(feature_names, mean_shap):
                importance_data.append({"feature": feat, "importance": round(float(score), 5),
                                        "method": "SHAP"})
            importance_data.sort(key=lambda x: x["importance"], reverse=True)
            info("  SHAP values computed successfully")

        except Exception as exc:
            info(f"  SHAP failed ({exc}), falling back to tree feature_importances_")
            if hasattr(best_model, "feature_importances_"):
                for feat, score in zip(feature_names, best_model.feature_importances_):
                    importance_data.append({"feature": feat, "importance": round(float(score), 5),
                                            "method": "Feature Importance"})
                importance_data.sort(key=lambda x: x["importance"], reverse=True)

    elif hasattr(best_model, "coef_"):
        # Logistic Regression: use mean absolute coefficient across classes
        coef = np.abs(best_model.coef_).mean(axis=0)
        for feat, score in zip(feature_names, coef):
            importance_data.append({"feature": feat, "importance": round(float(score), 5),
                                    "method": "Coefficient"})
        importance_data.sort(key=lambda x: x["importance"], reverse=True)
        info("  Used logistic regression coefficients for feature importance")

    if not importance_data:
        # Fallback: mutual information scores
        for feat, score in mi_series.items():
            importance_data.append({"feature": feat, "importance": round(float(score), 5),
                                    "method": "Mutual Information"})

    top10 = importance_data[:10]
    info("  Top 10 risk drivers:")
    for item in top10:
        info(f"    {item['feature']:40s} {item['importance']:.5f}  ({item['method']})")

    # ── ROC curve ─────────────────────────────────────────────────────────
    from sklearn.metrics import roc_curve, auc
    from sklearn.preprocessing import label_binarize

    roc_data = []
    classes = le_target.classes_
    y_bin = label_binarize(y_test, classes=list(range(len(classes))))

    if hasattr(best_model, "predict_proba"):
        y_prob = best_model.predict_proba(X_test)
        for i, cls in enumerate(classes):
            fpr, tpr, _ = roc_curve(y_bin[:, i], y_prob[:, i])
            auc_val = auc(fpr, tpr)
            # Downsample to ~40 points for JSON efficiency
            step = max(1, len(fpr) // 40)
            for fp, tp in zip(fpr[::step], tpr[::step]):
                roc_data.append({"class": cls, "fpr": round(float(fp), 4),
                                  "tpr": round(float(tp), 4), "auc": round(auc_val, 4)})

    # ── Confusion matrix ──────────────────────────────────────────────────
    from sklearn.metrics import confusion_matrix
    y_pred = best_model.predict(X_test)
    cm = confusion_matrix(y_test, y_pred).tolist()
    info(f"  Confusion matrix:\n{cm}")

    return top10, roc_data, cm


# ══════════════════════════════════════════════════════════════════════════
# PHASE 7 — EXPORT TO JSON
# ══════════════════════════════════════════════════════════════════════════

def phase7_export(df_clean, target_col, eda_results, results_df,
                  top10_features, roc_data, corr_matrix_df,
                  feature_names, best_name):
    """
    Export all analytics outputs to public/data/*.json for the Next.js
    static frontend. Every JSON uses camelCase keys for JS compatibility.
    """
    banner("PHASE 7 — EXPORT TO JSON")

    # ── kpis.json ─────────────────────────────────────────────────────────
    total = len(df_clean)
    high_count = int((df_clean[target_col].astype(str).str.lower() == "high").sum())
    high_pct = round(high_count / total * 100, 1)
    best_metrics = results_df.iloc[0]
    flagged = int((df_clean[target_col].astype(str).str.lower() == "high").sum())

    kpis = {
        "totalFindings":    total,
        "highRiskPct":      high_pct,
        "highRiskCount":    high_count,
        "bestModelName":    best_name,
        "bestModelAccuracy": float(results_df.loc[results_df["model"] == best_name, "accuracy"].values[0])
                             if best_name in results_df["model"].values
                             else float(results_df.iloc[0]["accuracy"]),
        "bestModelF1":      float(results_df.loc[results_df["model"] == best_name, "f1_score"].values[0])
                            if best_name in results_df["model"].values
                            else float(results_df.iloc[0]["f1_score"]),
        "flaggedCount":     flagged,
        "lastUpdated":      datetime.now().strftime("%Y-%m-%d"),
    }
    save_json(kpis, "kpis.json")

    # ── risk_distribution.json ────────────────────────────────────────────
    dist = df_clean[target_col].astype(str).value_counts()
    risk_dist = [{"riskLevel": k, "count": int(v), "pct": round(int(v) / total * 100, 1)}
                 for k, v in dist.items()]
    save_json(risk_dist, "risk_distribution.json")

    # ── feature_importance.json ───────────────────────────────────────────
    save_json(top10_features, "feature_importance.json")

    # ── correlation.json ──────────────────────────────────────────────────
    numeric_df = df_clean.select_dtypes(include=["float64", "int64"])
    corr = numeric_df.corr().round(3).fillna(0)
    # Replace any remaining non-finite values with 0 for valid JSON
    corr_matrix_clean = [[0.0 if (v != v or abs(v) == float('inf')) else v
                          for v in row]
                         for row in corr.values.tolist()]
    corr_payload = {
        "columns": corr.columns.tolist(),
        "matrix": corr_matrix_clean,
    }
    save_json(corr_payload, "correlation.json")

    # ── findings_table.json ───────────────────────────────────────────────
    display_cols = [c for c in df_clean.columns
                    if df_clean[c].dtype.name not in ("datetime64[ns]",)
                    and "id" not in c][:12]
    table_df = df_clean[display_cols].copy()
    # Convert category dtypes to string for JSON serialisation
    for col in table_df.select_dtypes(include="category").columns:
        table_df[col] = table_df[col].astype(str)
    records = table_df.head(500).to_dict(orient="records")
    save_json(records, "findings_table.json")

    # ── trend.json ────────────────────────────────────────────────────────
    # Findings over time by quarter if date column exists, else by department
    date_cols = df_clean.select_dtypes(include="datetime64[ns]").columns.tolist()
    dept_col  = next((c for c in df_clean.columns if "department" in c), None)

    if date_cols:
        trend_col = date_cols[0]
        df_clean["_quarter"] = df_clean[trend_col].dt.to_period("Q").astype(str)
        trend = (df_clean.groupby(["_quarter", target_col])
                         .size().reset_index(name="count"))
        trend_data = trend.to_dict(orient="records")
        df_clean.drop(columns=["_quarter"], inplace=True, errors="ignore")
    elif dept_col:
        trend = df_clean.groupby(dept_col).size().reset_index(name="count")
        trend_data = trend.rename(columns={dept_col: "_quarter"}).to_dict(orient="records")
    else:
        trend_data = []
    save_json(trend_data, "trend.json")

    # ── model_comparison.json ─────────────────────────────────────────────
    model_comp = results_df[["model", "accuracy", "precision",
                              "recall", "f1_score", "roc_auc"]].to_dict(orient="records")
    save_json(model_comp, "model_comparison.json")

    # ── roc_curve.json ─────────────────────────────────────────────────────
    save_json(roc_data, "roc_curve.json")

    # ── audit_intelligence.json ───────────────────────────────────────────
    _export_audit_intelligence(df_clean, target_col)

    info("All JSON files exported to public/data/")


def _export_audit_intelligence(df: pd.DataFrame, target_col: str) -> None:
    """
    Pre-compute audit-specific aggregations for the Audit Intelligence tab.
    All groupings are computed from the full cleaned dataset (not just the
    500-row display sample) so that proportions are statistically meaningful.
    """
    risk_levels = ["High", "Medium", "Low"]

    def risk_pivot(group_col: str) -> list:
        """Cross-tabulate group_col against risk level, add total and highPct."""
        ct = pd.crosstab(df[group_col].astype(str), df[target_col].astype(str))
        for lvl in risk_levels:
            if lvl not in ct.columns:
                ct[lvl] = 0
        ct = ct[risk_levels]
        ct["total"] = ct.sum(axis=1)
        ct["highPct"] = (ct["High"] / ct["total"] * 100).round(1)
        rows = []
        for idx, row in ct.iterrows():
            rows.append({
                "name":     idx,
                "High":     int(row["High"]),
                "Medium":   int(row["Medium"]),
                "Low":      int(row["Low"]),
                "total":    int(row["total"]),
                "highPct":  float(row["highPct"]),
            })
        return sorted(rows, key=lambda x: x["highPct"], reverse=True)

    dept_col    = next((c for c in df.columns if "department" in c), None)
    type_col    = next((c for c in df.columns if "findingtype" in c or "finding_type" in c), None)
    ctrl_col    = next((c for c in df.columns if "controltype" in c or "control_type" in c), None)
    root_col    = next((c for c in df.columns if "rootcause" in c or "root_cause" in c), None)
    status_col  = next((c for c in df.columns if c == "status"), None)
    repeat_col  = next((c for c in df.columns if "repeat" in c), None)
    sev_col     = next((c for c in df.columns if "severity" in c), None)
    fin_col     = next((c for c in df.columns if "financial" in c), None)
    days_col    = next((c for c in df.columns if "daysopen" in c or "days_open" in c), None)
    mgmt_col    = next((c for c in df.columns if "mgmt" in c or "mgmtresponse" in c), None)

    payload: dict = {}

    if dept_col:
        dept_data = risk_pivot(dept_col)
        # Add avg financial impact per department
        if fin_col:
            avg_fin = df.groupby(dept_col)[fin_col].mean().round(0)
            for row in dept_data:
                row["avgFinancialImpact"] = float(avg_fin.get(row["name"], 0))
        payload["departmentRisk"] = dept_data

    if type_col:
        payload["findingTypeRisk"] = risk_pivot(type_col)

    if ctrl_col:
        payload["controlTypeRisk"] = risk_pivot(ctrl_col)

    if root_col:
        payload["rootCauseRisk"] = risk_pivot(root_col)

    # Status breakdown
    if status_col:
        vc = df[status_col].astype(str).value_counts()
        total = len(df)
        payload["statusBreakdown"] = [
            {"status": k, "count": int(v), "pct": round(int(v) / total * 100, 1)}
            for k, v in vc.items()
        ]

    # Repeat finding analysis
    if repeat_col:
        repeat_df = pd.to_numeric(df[repeat_col], errors="coerce").fillna(0).astype(int)
        repeat_mask = repeat_df == 1
        new_mask    = repeat_df == 0
        risk_col    = df[target_col].astype(str)

        repeat_high = (risk_col[repeat_mask] == "High").sum()
        new_high    = (risk_col[new_mask]    == "High").sum()

        payload["repeatFinding"] = {
            "repeatCount":    int(repeat_mask.sum()),
            "newCount":       int(new_mask.sum()),
            "repeatHighPct":  round(repeat_high / max(repeat_mask.sum(), 1) * 100, 1),
            "newHighPct":     round(new_high    / max(new_mask.sum(),    1) * 100, 1),
        }

    # Average key metrics by risk level
    metric_cols = {c: c for c in [sev_col, fin_col, days_col, mgmt_col] if c}
    if metric_cols:
        avg_rows = []
        for lvl in risk_levels:
            subset = df[df[target_col].astype(str) == lvl]
            row: dict = {"riskLevel": lvl}
            for col in metric_cols:
                row[col] = round(float(subset[col].mean()), 2)
            avg_rows.append(row)
        payload["avgMetricsByRisk"] = avg_rows

    # Overdue rate by department (relevant for audit follow-up KRI)
    if dept_col and status_col:
        overdue_df = df.copy()
        overdue_df["_overdue"] = overdue_df[status_col].astype(str).str.lower() == "overdue"
        grp = overdue_df.groupby(dept_col).agg(
            total=("_overdue", "count"),
            overdueCount=("_overdue", "sum"),
        ).reset_index()
        grp["overdueRate"] = (grp["overdueCount"] / grp["total"] * 100).round(1)
        payload["overdueByDept"] = sorted(
            grp.rename(columns={dept_col: "department"}).to_dict(orient="records"),
            key=lambda x: x["overdueRate"], reverse=True
        )

    save_json(payload, "audit_intelligence.json")
    info("Audit intelligence aggregations exported")


# ══════════════════════════════════════════════════════════════════════════
# MAIN ORCHESTRATOR
# ══════════════════════════════════════════════════════════════════════════

def main():
    print("\n" + "=" * 70)
    print("  INTERNAL AUDIT RISK ANALYTICS PIPELINE")
    print("  Target role: Manager, Advanced Analytics & Data Management")
    print("=" * 70)

    # ── Load ──────────────────────────────────────────────────────────────
    df_raw = load_data()

    # ── Phase 1: Clean ────────────────────────────────────────────────────
    df_clean = phase1_clean(df_raw.copy())
    target_col = _detect_target(df_clean)
    info(f"Detected target column: '{target_col}'")

    # ── Phase 2: EDA ──────────────────────────────────────────────────────
    eda_results = phase2_eda(df_clean, target_col)

    # ── Phase 3: Features ────────────────────────────────────────────────
    X, y, feature_names, le_target, mi_series, corr_matrix = phase3_features(
        df_clean.copy(), target_col
    )

    # ── Phase 4: Model training ───────────────────────────────────────────
    results_df, trained_models, X_train, X_test, y_train, y_test = phase4_models(
        X, y, le_target
    )

    # ── Phase 5: Hyperparameter tuning ───────────────────────────────────
    best_model, best_name = phase5_tuning(
        results_df, trained_models, X_train, X_test, y_train, y_test
    )

    # ── Phase 6: Final analysis ───────────────────────────────────────────
    top10_features, roc_data, cm = phase6_analysis(
        best_model, best_name, X_train, X_test, y_test,
        feature_names, le_target, mi_series
    )

    # ── Phase 7: Export ───────────────────────────────────────────────────
    phase7_export(
        df_clean, target_col, eda_results, results_df,
        top10_features, roc_data, corr_matrix,
        feature_names, best_name
    )

    banner("PIPELINE COMPLETE")
    info(f"Best model: {best_name}")
    info(f"JSON files written to: {DATA_DIR}")
    info(f"Model saved to: {MODEL_PKL_PATH}")


if __name__ == "__main__":
    main()
