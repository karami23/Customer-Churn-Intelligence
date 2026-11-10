
from datetime import date, timedelta

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import func, case
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
                    name=None,
                    customer_code=customer_code,
                    customer_data=customer_data,
                )

                db.add(db_customer)
                db.flush()

        prediction_record = PredictionRecord(
            customer_id=(
                db_customer.id
                if db_customer
                else None
            ),
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
def get_prediction_history(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    prediction: str | None = Query(
        default=None,
        pattern="^(Yes|No)$",
    ),
    risk_level: str | None = Query(
        default=None,
        pattern="^(Low|Medium|High)$",
    ),
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
        query.order_by(PredictionRecord.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# ==================================================
# GET: Prediction Detail
# ==================================================

@router.get(
    "/{prediction_id}",
    response_model=PredictionDetail,
)
def get_prediction_detail(
    prediction_id: int,
    db: Session = Depends(get_db),
):
    prediction_record = (
        db.query(PredictionRecord)
        .filter(PredictionRecord.id == prediction_id)
        .first()
    )

    if not prediction_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found.",
        )

    return prediction_record


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
    prediction_record = (
        db.query(PredictionRecord)
        .filter(PredictionRecord.id == prediction_id)
        .first()
    )

    if not prediction_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found.",
        )

    db.delete(prediction_record)
    db.commit()

    return PredictionDeleteResponse(
        message="Prediction deleted successfully.",
        prediction_id=prediction_id,
    )


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
    result = db.query(
        func.count(PredictionRecord.id),
        func.sum(
            case(
                (PredictionRecord.prediction == "Yes", 1),
                else_=0,

            )
        ),
        func.avg(PredictionRecord.churn_probability),
    ).one()

    total_predictions = result[0] or 0
    churn_predictions = result[1] or 0
    average_probability = result[2] or 0.0

    return DashboardSummary(
        total_predictions=total_predictions,
        churn_predictions=churn_predictions,
        non_churn_predictions=(
            total_predictions - churn_predictions
        ),
        average_churn_probability=round(
            float(average_probability),
            4,
        ),
    )


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
        .group_by(PredictionRecord.risk_level)
        .all()
    )

    counts = {
        risk: count
        for risk, count in results
    }

    return [
        RiskDistributionItem(
            risk_level=risk,
            count=counts.get(risk, 0),
        )
        for risk in ["Low", "Medium", "High"]
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
    start_date = date.today() - timedelta(days=days - 1)

    results = (
        db.query(
            func.date(PredictionRecord.created_at).label(
                "prediction_date"
            ),
            func.count(PredictionRecord.id).label("total"),
            func.sum(
                func.cast(
                    PredictionRecord.prediction == "Yes",
                    __import__("sqlalchemy").Integer(),
                )
            ).label("churn"),
        )
        .filter(
            PredictionRecord.created_at >= start_date
        )
        .group_by(
            func.date(PredictionRecord.created_at)
        )
        .order_by(
            func.date(PredictionRecord.created_at)
        )
        .all()
    )

    trend_data = {
        row.prediction_date: (
            row.total,
            row.churn or 0,
        )
        for row in results
    }

    trend = []

    for day_offset in range(days):
        current_date = start_date + timedelta(days=day_offset)

        total, churn = trend_data.get(
            current_date,
            (0, 0),
        )

        trend.append(
            PredictionTrendItem(
                date=current_date.isoformat(),
                total=total,
                churn=churn,
                non_churn=total - churn,
            )
        )

    return trend
