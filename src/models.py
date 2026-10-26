from datetime import datetime

from sqlalchemy import (
    Integer,
    String,
    Float,
    DateTime,
    JSON,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.api.database import Base


class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    customer_data: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
    )

    prediction: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
    )

    churn_probability: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    risk_level: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )