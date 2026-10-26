from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.api.database import get_db
from src.models import PredictionRecord
from src.api.predictor import predict_churn
from src.api.schemas import CustomerData, PredictionResponse


router = APIRouter(
    prefix="/api/v1/predictions",
    tags=["Predictions"],
)


@router.post("/predict", response_model=PredictionResponse)
def predict(
    customer: CustomerData,
    db: Session = Depends(get_db),
):
    customer_data = customer.model_dump()

    result = predict_churn(customer_data)

    record = PredictionRecord(
        customer_data=customer_data,
        prediction=result["prediction"],
        churn_probability=result["churn_probability"],
        risk_level=result["risk_level"],
    )

    try:
        db.add(record)
        db.commit()
        db.refresh(record)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to save prediction to database.",
        )

    return result