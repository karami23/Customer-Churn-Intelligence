from pathlib import Path

import joblib
import pandas as pd


MODEL_PATH = (
    Path(__file__).resolve().parents[2]
    / "Artifacts"
    / "churn_model.joblib"
)


if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Model file not found: {MODEL_PATH}"
    )


model = joblib.load(MODEL_PATH)


if not hasattr(model, "predict_proba"):
    raise TypeError(
        "Loaded model does not support predict_proba"
    )


if "Yes" not in list(model.classes_):
    raise ValueError(
        "Model classes must contain 'Yes'"
    )


def predict_churn(customer_data: dict) -> dict:

    input_data = pd.DataFrame([customer_data])

    probabilities = model.predict_proba(input_data)[0]

    classes = list(model.classes_)

    yes_index = classes.index("Yes")

    churn_probability = float(
        probabilities[yes_index]
    )

    prediction = (
        "Yes"
        if churn_probability >= 0.5
        else "No"
    )

    if churn_probability >= 0.7:
        risk_level = "High"

    elif churn_probability >= 0.4:
        risk_level = "Medium"

    else:
        risk_level = "Low"

    return {
        "prediction": prediction,
        "churn_probability": round(
            churn_probability,
            4,
        ),
        "risk_level": risk_level,
    }