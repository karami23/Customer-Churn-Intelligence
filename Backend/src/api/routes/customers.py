
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.api.database import get_db
from src.api.schemas import (
    CustomerCreate,
    CustomerListItem,
    CustomerDetail,
    CustomerDeleteResponse,
    PredictionHistoryItem,
)
from src.models import Customer, PredictionRecord


router = APIRouter(
    prefix="/api/v1/customers",
    tags=["Customers"],
)


# ==================================================
# POST: Create Customer
# ==================================================

@router.post(
    "/",
    response_model=CustomerListItem,
    status_code=status.HTTP_201_CREATED,
)
def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
):

    customer = Customer(
        name=customer_data.name,
        customer_code=f"CUS-{uuid4().hex[:12].upper()}",
        customer_data={},
    )

    try:

        db.add(customer)
        db.commit()
        db.refresh(customer)

        return customer

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not generate a unique customer code. Please try again.",
        )

    except Exception:

        db.rollback()
        raise


# ==================================================
# GET: Customers List
# ==================================================

@router.get(
    "/",
    response_model=list[CustomerListItem],
)
def get_customers(
    search: str | None = Query(
        default=None,
        min_length=1,
    ),
    skip: int = Query(
        default=0,
        ge=0,
    ),
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
):

    query = db.query(Customer)

    if search:

        search_term = f"%{search.strip()}%"

        query = query.filter(
            or_(
                Customer.customer_code.ilike(search_term),
                Customer.name.ilike(search_term),
            )
        )

    return (
        query
        .order_by(
            Customer.created_at.desc(),
            Customer.id.desc(),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


# ==================================================
# GET: Customer Details
# ==================================================

@router.get(
    "/{customer_id}",
    response_model=CustomerDetail,
)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
):

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id
        )
        .first()
    )

    if not customer:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    prediction_count = (
        db.query(
            func.count(PredictionRecord.id)
        )
        .filter(
            PredictionRecord.customer_id == customer_id
        )
        .scalar()
    ) or 0

    return {
        "id": customer.id,
        "name": customer.name,
        "customer_code": customer.customer_code,
        "customer_data": customer.customer_data,
        "created_at": customer.created_at,
        "updated_at": customer.updated_at,
        "prediction_count": prediction_count,
    }


# ==================================================
# GET: Customer Prediction History
# ==================================================

@router.get(
    "/{customer_id}/predictions",
    response_model=list[PredictionHistoryItem],
)
def get_customer_predictions(
    customer_id: int,

    skip: int = Query(
        default=0,
        ge=0,
    ),

    limit: int = Query(
        default=20,
        ge=1,
        le=100,
    ),

    db: Session = Depends(get_db),
):

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id
        )
        .first()
    )

    if not customer:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    return (
        db.query(PredictionRecord)
        .filter(
            PredictionRecord.customer_id == customer_id
        )
        .order_by(
            PredictionRecord.created_at.desc(),
            PredictionRecord.id.desc(),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


# ==================================================
# DELETE: Customer
# ==================================================

@router.delete(
    "/{customer_id}",
    response_model=CustomerDeleteResponse,
)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
):

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id
        )
        .first()
    )

    if not customer:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    try:

        # Preserve prediction history
        # but remove the customer relationship.

        db.query(PredictionRecord).filter(
            PredictionRecord.customer_id == customer_id
        ).update(
            {
                PredictionRecord.customer_id: None
            },
            synchronize_session=False,
        )

        db.delete(customer)

        db.commit()

        return {
            "message": "Customer deleted successfully.",
            "customer_id": customer_id,
        }

    except Exception:

        db.rollback()
        raise
