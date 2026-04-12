# Cognitive decline risk model (demo / research)

This folder contains a **minimal supervised learning pipeline** for stratifying **simulated** physiological risk into three ordinal classes **Normal / Mild Risk / High Risk** using features aligned with the Cognitive Care Assistant sensor stack:

| Feature | Operationalization (conceptual) |
|--------|---------------------------------|
| `emg_variability` | Coefficient-of-variation–like summary of surface EMG amplitude |
| `hr_trend_slope` | Short-window linear trend of heart rate (beats/min per window) |
| `temp_anomaly` | Deviation from individualized thermal baseline (°C) |

## Model

We use **multinomial logistic regression** with **feature standardization** (`StandardScaler` + `LogisticRegression`, `multi_class="multinomial"`). This is a common interpretable baseline in biomedical informatics: coefficients are directly related to log-odds of class membership under a linear decision boundary in the transformed feature space.

**Outputs:** For each inference, the fitted pipeline returns **class probabilities** \(\hat{p}_k\) for \(k \in \{0,1,2\}\) that sum to one (calibrated only in the sense of softmax outputs — **not** calibrated for clinical deployment).

## Reproducibility

```bash
cd ml
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements-ml.txt
python train_cognitive_decline_model.py
```

Artifacts are written to `ml/artifacts/`:

- `cognitive_decline_logreg.joblib` — serialized pipeline
- `metrics.json` — confusion matrix and sklearn report
- `coefficient_heatmap.png` — coefficient matrix across classes and features
- `decision_surface_emg_hr.png` — 2D slice of decision regions (EMG vs HR)

## Limitations (research)

Data are **synthetic**; no claims of generalization, calibration, or regulatory approval. This is **not** a medical device and must not be used for diagnosis or treatment decisions.
