from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import Integer, func, cast
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


@router.get("/")
def get_predictions(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    prediction: str | None = Query(default=None, pattern="^(Yes|No)$"),
    risk_level: str | None = Query(
        default=None,
        pattern="^(Low|Medium|High)$",
    ),
    db: Session = Depends(get_db),
):
    query = db.query(PredictionRecord)

    if prediction is not None:
        query = query.filter(
            PredictionRecord.prediction == prediction
        )

    if risk_level is not None:
        query = query.filter(
            PredictionRecord.risk_level == risk_level
        )

    records = (
        query.order_by(PredictionRecord.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": record.id,
            "prediction": record.prediction,
            "churn_probability": record.churn_probability,
            "risk_level": record.risk_level,
            "created_at": record.created_at,
        }
        for record in records
    ]


@router.get("/{prediction_id}")
def get_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
):
    record = db.get(PredictionRecord, prediction_id)

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Prediction not found.",
        )

    return {
        "id": record.id,
        "customer_data": record.customer_data,
        "prediction": record.prediction,
        "churn_probability": record.churn_probability,
        "risk_level": record.risk_level,
        "created_at": record.created_at,
    }



@router.delete("/{prediction_id}")
def delete_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
):
    record = db.get(PredictionRecord, prediction_id)

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Prediction not found.",
        )

    try:
        db.delete(record)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to delete prediction.",
        )

    return {
        "message": "Prediction deleted successfully.",
        "id": prediction_id,
    }



@router.get("/stats/summary")
def get_summary_stats(
    db: Session = Depends(get_db),
):
    total = db.query(func.count(PredictionRecord.id)).scalar() or 0

    churn_count = (
        db.query(func.count(PredictionRecord.id))
        .filter(PredictionRecord.prediction == "Yes")
        .scalar()
        or 0
    )

    no_churn_count = total - churn_count

    average_probability = (
        db.query(func.avg(PredictionRecord.churn_probability))
        .scalar()
    )

    return {
        "total_predictions": total,
        "predicted_churn": churn_count,
        "predicted_no_churn": no_churn_count,
        "predicted_churn_percentage": (
            round(churn_count / total * 100, 2)
            if total else 0
        ),
        "average_churn_probability": (
            round(float(average_probability), 4)
            if average_probability is not None else None
        ),
    }


@router.get("/stats/risks")
def get_risk_stats(
    db: Session = Depends(get_db),
):
    counts = dict(
        db.query(
            PredictionRecord.risk_level,
            func.count(PredictionRecord.id),
        )
        .group_by(PredictionRecord.risk_level)
        .all()
    )

    return {
        "Low": counts.get("Low", 0),
        "Medium": counts.get("Medium", 0),
        "High": counts.get("High", 0),
    }


@router.get("/stats/trend")
def get_prediction_trend(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    rows = (
        db.query(
            func.date(PredictionRecord.created_at).label("date"),
            func.count(PredictionRecord.id).label("total"),
            func.sum(
                cast(
                    PredictionRecord.prediction == "Yes",
                    Integer,
                )
            ).label("predicted_churn")
        )
        .filter(PredictionRecord.created_at >= start_date)
        .group_by(func.date(PredictionRecord.created_at))
        .order_by(func.date(PredictionRecord.created_at))
        .all()
    )

    return {
        "period_days": days,
        "data": [
            {
                "date": str(row.date),
                "total_predictions": row.total,
                "predicted_churn": int(row.predicted_churn or 0),
            }
            for row in rows
        ],
    }