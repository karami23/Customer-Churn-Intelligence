from pathlib import Path
import pandas as pd
import joblib


MODEL_PATH = (
    Path(__file__).resolve().parents[2]
    / "Artifacts"
    / "churn_model.joblib"
)

model = joblib.load(MODEL_PATH)


def predict_churn(customer_data: dict) -> dict:
    probability = model.predict_proba(
        pd.DataFrame([customer_data])
    )[0]

    classes = list(model.classes_)
    yes_index = classes.index("Yes")

    churn_probability = float(probability[yes_index])
    prediction = "Yes" if churn_probability >= 0.5 else "No"

    return {
        "prediction": prediction,
        "churn_probability": round(churn_probability, 4),
        "risk_level": (
            "High" if churn_probability >= 0.7
            else "Medium" if churn_probability >= 0.4
            else "Low"
        ),
    }