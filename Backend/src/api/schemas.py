from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    field_validator,
)


# ==================================================
# Customer Schemas
# ==================================================

class CustomerData(BaseModel):

    customer_code: str | None = Field(
        default=None,
        max_length=100,
    )

    gender: Literal["Female", "Male"]

    SeniorCitizen: Literal[0, 1]

    Partner: Literal["Yes", "No"]

    Dependents: Literal["Yes", "No"]

    tenure: int = Field(
        ge=0,
        le=100,
    )

    PhoneService: Literal["Yes", "No"]

    MultipleLines: Literal[
        "Yes",
        "No",
        "No phone service",
    ]

    InternetService: Literal[
        "DSL",
        "Fiber optic",
        "No",
    ]

    OnlineSecurity: Literal[
        "Yes",
        "No",
        "No internet service",
    ]

    OnlineBackup: Literal[
        "Yes",
        "No",
        "No internet service",
    ]

    DeviceProtection: Literal[
        "Yes",
        "No",
        "No internet service",
    ]

    TechSupport: Literal[
        "Yes",
        "No",
        "No internet service",
    ]

    StreamingTV: Literal[
        "Yes",
        "No",
        "No internet service",
    ]

    StreamingMovies: Literal[
        "Yes",
        "No",
        "No internet service",
    ]

    Contract: Literal[
        "Month-to-month",
        "One year",
        "Two year",
    ]

    PaperlessBilling: Literal[
        "Yes",
        "No",
    ]

    PaymentMethod: Literal[
        "Electronic check",
        "Mailed check",
        "Bank transfer (automatic)",
        "Credit card (automatic)",
    ]

    MonthlyCharges: float = Field(
        ge=0,
        allow_inf_nan=False,
    )

    TotalCharges: float = Field(
        ge=0,
        allow_inf_nan=False,
    )

    @field_validator("customer_code")
    @classmethod
    def normalize_customer_code(cls, value):

        if value is None:
            return None

        value = value.strip()

        return value or None


# ==================================================
# Prediction Schemas
# ==================================================

class PredictionResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int

    customer_id: int | None

    prediction: Literal["Yes", "No"]

    churn_probability: float

    risk_level: Literal[
        "Low",
        "Medium",
        "High",
    ]

    created_at: datetime


class PredictionHistoryItem(BaseModel):

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int

    customer_id: int | None

    prediction: Literal["Yes", "No"]

    churn_probability: float

    risk_level: Literal[
        "Low",
        "Medium",
        "High",
    ]

    created_at: datetime


class PredictionDetail(PredictionHistoryItem):

    customer_data: dict


class PredictionDeleteResponse(BaseModel):

    message: str

    prediction_id: int


# ==================================================
# Dashboard Schemas
# ==================================================

class DashboardSummary(BaseModel):

    total_predictions: int

    churn_predictions: int

    non_churn_predictions: int

    average_churn_probability: float


class RiskDistributionItem(BaseModel):

    risk_level: Literal[
        "Low",
        "Medium",
        "High",
    ]

    count: int


class PredictionTrendItem(BaseModel):

    date: str

    total: int

    churn: int

    non_churn: int


# ==================================================
# Customer Response Schemas
# ==================================================

class CustomerListItem(BaseModel):

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int

    customer_code: str | None

    customer_data: dict

    created_at: datetime

    updated_at: datetime


class CustomerDetail(CustomerListItem):

    prediction_count: int


class CustomerDeleteResponse(BaseModel):

    message: str

    customer_id: int