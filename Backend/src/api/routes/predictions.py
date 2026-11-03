from datetime import date, timedelta
from typing import Literal

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.api.database import get_db
from src.api.predictor import predict_churn
from src.api.schemas import (
    CustomerData,
    PredictionResponse,
    PredictionHistoryItem,
    PredictionDetail,
    PredictionDeleteResponse,
    DashboardSummary,
    RiskDistributionItem,
    PredictionTrendItem,
)
from src.models import Customer, PredictionRecord


router = APIRouter(
    prefix="/api/v1/predictions",
    tags=["Predictions"],
)


# ==================================================
# POST: Predict Customer Churn
# ==================================================

@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_201_CREATED,
)
def predict_customer(
    customer: CustomerData,
    db: Session = Depends(get_db),
):

    customer_code = customer.customer_code

    customer_data = customer.model_dump(
        exclude={"customer_code"}
    )

    result = predict_churn(customer_data)

    try:

        db_customer = None

        if customer_code:

            db_customer = (
                db.query(Customer)
                .filter(
                    Customer.customer_code == customer_code
                )
                .first()
            )

        if db_customer:

            db_customer.customer_data = customer_data

        else:

            db_customer = Customer(
                customer_code=customer_code,
                customer_data=customer_data,
            )

            db.add(db_customer)

            db.flush()

        prediction_record = PredictionRecord(
            customer_id=db_customer.id,
            customer_data=customer_data,
            prediction=result["prediction"],
            churn_probability=result["churn_probability"],
            risk_level=result["risk_level"],
        )

        db.add(prediction_record)

        db.commit()

        db.refresh(prediction_record)

        return prediction_record

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Customer code already exists.",
        )

    except Exception:

        db.rollback()

        raise


# ==================================================
# GET: Prediction History
# ==================================================

@router.get(
    "/",
    response_model=list[PredictionHistoryItem],
)
def get_predictions(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),

    prediction: Literal["Yes", "No"] | None = None,

    risk_level: Literal[
        "Low",
        "Medium",
        "High",
    ] | None = None,

    db: Session = Depends(get_db),
):

    query = db.query(PredictionRecord)

    if prediction:

        query = query.filter(
            PredictionRecord.prediction == prediction
        )

    if risk_level:

        query = query.filter(
            PredictionRecord.risk_level == risk_level
        )

    return (
        query
        .order_by(
            PredictionRecord.created_at.desc(),
            PredictionRecord.id.desc(),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


# ==================================================
# GET: Prediction Details
# ==================================================

@router.get(
    "/{prediction_id}",
    response_model=PredictionDetail,
)
def get_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
):

    record = (
        db.query(PredictionRecord)
        .filter(
            PredictionRecord.id == prediction_id
        )
        .first()
    )

    if not record:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found.",
        )

    return record


# ==================================================
# DELETE: Prediction
# ==================================================

@router.delete(
    "/{prediction_id}",
    response_model=PredictionDeleteResponse,
)
def delete_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
):

    record = (
        db.query(PredictionRecord)
        .filter(
            PredictionRecord.id == prediction_id
        )
        .first()
    )

    if not record:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found.",
        )

    try:

        db.delete(record)

        db.commit()

        return {
            "message": "Prediction deleted successfully.",
            "prediction_id": prediction_id,
        }

    except Exception:

        db.rollback()

        raise


# ==================================================
# GET: Dashboard Summary
# ==================================================

@router.get(
    "/stats/summary",
    response_model=DashboardSummary,
)
def get_dashboard_summary(
    db: Session = Depends(get_db),
):

    total_predictions = (
        db.query(
            func.count(PredictionRecord.id)
        )
        .scalar()
    ) or 0

    churn_predictions = (
        db.query(
            func.count(PredictionRecord.id)
        )
        .filter(
            PredictionRecord.prediction == "Yes"
        )
        .scalar()
    ) or 0

    non_churn_predictions = (
        db.query(
            func.count(PredictionRecord.id)
        )
        .filter(
            PredictionRecord.prediction == "No"
        )
        .scalar()
    ) or 0

    average_probability = (
        db.query(
            func.avg(
                PredictionRecord.churn_probability
            )
        )
        .scalar()
    ) or 0.0

    return {
        "total_predictions": total_predictions,
        "churn_predictions": churn_predictions,
        "non_churn_predictions": non_churn_predictions,
        "average_churn_probability": round(
            float(average_probability),
            4,
        ),
    }


# ==================================================
# GET: Risk Distribution
# ==================================================

@router.get(
    "/stats/risks",
    response_model=list[RiskDistributionItem],
)
def get_risk_distribution(
    db: Session = Depends(get_db),
):

    results = (
        db.query(
            PredictionRecord.risk_level,
            func.count(PredictionRecord.id),
        )
        .group_by(
            PredictionRecord.risk_level
        )
        .all()
    )

    counts = {
        level: count
        for level, count in results
    }

    return [
        {
            "risk_level": level,
            "count": counts.get(level, 0),
        }
        for level in ["Low", "Medium", "High"]
    ]


# ==================================================
# GET: Prediction Trend
# ==================================================

@router.get(
    "/stats/trend",
    response_model=list[PredictionTrendItem],
)
def get_prediction_trend(
    days: int = Query(
        default=7,
        ge=1,
        le=365,
    ),
    db: Session = Depends(get_db),
):

    today = date.today()

    start_date = today - timedelta(
        days=days - 1
    )

    end_date = today + timedelta(days=1)

    records = (
        db.query(
            func.date(PredictionRecord.created_at),
            PredictionRecord.prediction,
            func.count(PredictionRecord.id),
        )
        .filter(
            PredictionRecord.created_at >= start_date,
            PredictionRecord.created_at < end_date,
        )
        .group_by(
            func.date(PredictionRecord.created_at),
            PredictionRecord.prediction,
        )
        .all()
    )

    daily_data = {}

    for record_date, prediction, count in records:

        if record_date is None:
            continue

        if hasattr(record_date, "date"):
            record_date = record_date.date()

        if record_date not in daily_data:

            daily_data[record_date] = {
                "total": 0,
                "churn": 0,
                "non_churn": 0,
            }

        daily_data[record_date]["total"] += count

        if prediction == "Yes":

            daily_data[record_date]["churn"] += count

        else:

            daily_data[record_date]["non_churn"] += count

    trend = []

    for offset in range(days):

        current_date = start_date + timedelta(
            days=offset
        )

        values = daily_data.get(
            current_date,
            {
                "total": 0,
                "churn": 0,
                "non_churn": 0,
            },
        )

        trend.append({
            "date": current_date.isoformat(),
            "total": values["total"],
            "churn": values["churn"],
            "non_churn": values["non_churn"],
        })

    return trend