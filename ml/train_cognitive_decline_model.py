"""
Simulated physiological dataset + multinomial logistic regression for
cognitive-decline risk stratification (research / demo — not for clinical use).

Features:
  - emg_variability: normalized EMG coefficient of variation
  - hr_trend_slope: heart-rate trend (beats/min per observation window)
  - temp_anomaly: absolute deviation from expected thermal baseline (°C)

Output classes:
  0 = Normal
  1 = Mild Risk
  2 = High Risk
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

RNG = np.random.default_rng(42)
N_SAMPLES = 600
HERE = Path(__file__).resolve().parent


def simulate_dataset(n: int) -> tuple[np.ndarray, np.ndarray]:
    """Generate synthetic but plausible correlations with class labels."""
    n_per = n // 3
    # Normal: low EMG variability, stable HR, small thermal deviation
    normal = np.column_stack(
        [
            RNG.normal(0.35, 0.08, n_per),
            RNG.normal(0.02, 0.15, n_per),
            RNG.normal(0.15, 0.06, n_per),
        ]
    )
    mild = np.column_stack(
        [
            RNG.normal(0.55, 0.1, n_per),
            RNG.normal(0.35, 0.22, n_per),
            RNG.normal(0.35, 0.1, n_per),
        ]
    )
    high = np.column_stack(
        [
            RNG.normal(0.82, 0.12, n_per),
            RNG.normal(0.72, 0.28, n_per),
            RNG.normal(0.62, 0.14, n_per),
        ]
    )
    X = np.vstack([normal, mild, high])
    y = np.array([0] * n_per + [1] * n_per + [2] * n_per)
    # Add noise & shuffle
    X += RNG.normal(0, 0.05, X.shape)
    idx = RNG.permutation(len(X))
    return X[idx], y[idx]


def main() -> None:
    X, y = simulate_dataset(N_SAMPLES)
    feature_names = ["emg_variability", "hr_trend_slope", "temp_anomaly"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, stratify=y, random_state=42
    )

    model = Pipeline(
        [
            ("scaler", StandardScaler()),
            (
                "clf",
                LogisticRegression(
                    max_iter=1000,
                    solver="lbfgs",
                ),
            ),
        ]
    )
    model.fit(X_train, y_train)

    proba = model.predict_proba(X_test)
    pred = model.predict(X_test)

    report = classification_report(
        y_test, pred, target_names=["Normal", "Mild Risk", "High Risk"], digits=3
    )
    cm = confusion_matrix(y_test, pred)

    out_dir = HERE / "artifacts"
    out_dir.mkdir(exist_ok=True)
    joblib.dump(model, out_dir / "cognitive_decline_logreg.joblib")

    metrics = {
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "classification_report": report,
        "confusion_matrix": cm.tolist(),
        "feature_names": feature_names,
    }
    (out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))

    print(report)
    print("Confusion matrix:\n", cm)

    # --- Visualization: coefficient heatmap (multiclass one-vs-rest not stored; use clf.coef_)
    clf: LogisticRegression = model.named_steps["clf"]
    coef = clf.coef_
    fig, ax = plt.subplots(figsize=(7, 3.2))
    im = ax.imshow(coef, aspect="auto", cmap="RdBu_r", vmin=-2, vmax=2)
    ax.set_xticks(range(3))
    ax.set_xticklabels(feature_names, rotation=15, ha="right")
    ax.set_yticks(range(3))
    ax.set_yticklabels(["Normal", "Mild Risk", "High Risk"])
    ax.set_title(
        "Logistic regression coefficients (standardized features)\n"
        "direction of association with each class vs. others (multinomial)"
    )
    plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    plt.tight_layout()
    fig_path = out_dir / "coefficient_heatmap.png"
    plt.savefig(fig_path, dpi=150)
    plt.close()
    print(f"Saved {fig_path}")

    # Decision surface: EMG vs HR (fix temp at median)
    fig, ax = plt.subplots(figsize=(6.5, 5))
    temp_fix = float(np.median(X[:, 2]))
    grid = 80
    emg = np.linspace(X[:, 0].min() - 0.1, X[:, 0].max() + 0.1, grid)
    hr = np.linspace(X[:, 1].min() - 0.2, X[:, 1].max() + 0.2, grid)
    EMG, HR = np.meshgrid(emg, hr)
    X_grid = np.column_stack(
        [EMG.ravel(), HR.ravel(), np.full(EMG.size, temp_fix)]
    )
    Z = model.predict(X_grid).reshape(EMG.shape)
    try:
        cmap = plt.colormaps["viridis"].resampled(3)
    except AttributeError:
        from matplotlib import cm

        cmap = cm.get_cmap("viridis", 3)
    cf = ax.contourf(EMG, HR, Z, levels=[-0.5, 0.5, 1.5, 2.5], cmap=cmap, alpha=0.85)
    ax.scatter(
        X_test[:, 0],
        X_test[:, 1],
        c=y_test,
        cmap=cmap,
        edgecolors="white",
        linewidths=0.3,
        s=22,
        alpha=0.9,
    )
    ax.set_xlabel("EMG variability (normalized)")
    ax.set_ylabel("HR trend slope")
    ax.set_title(f"Decision regions (temp_anomaly fixed at {temp_fix:.2f})")
    cbar = plt.colorbar(cf, ax=ax, ticks=[0, 1, 2])
    cbar.ax.set_yticklabels(["Normal", "Mild", "High"])
    plt.tight_layout()
    surf_path = out_dir / "decision_surface_emg_hr.png"
    plt.savefig(surf_path, dpi=150)
    plt.close()
    print(f"Saved {surf_path}")

    # Example probability row
    sample = np.array([[0.5, 0.4, 0.3]])
    probs = model.predict_proba(sample)[0]
    print("Example probabilities (EMG=0.5, HR_trend=0.4, temp=0.3):", probs)


if __name__ == "__main__":
    main()
