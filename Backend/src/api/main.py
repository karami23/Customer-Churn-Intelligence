from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from src.api.routes import customers as customers_router
from src.api.routes import predictions as predictions_router


app = FastAPI(
    title="Customer Churn Intelligence API",
    description=(
        "Customer Churn Prediction "
        "and Analytics API"
    ),
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    predictions_router.router
)

app.include_router(
    customers_router.router
)


@app.get(
    "/",
    include_in_schema=False,
)
def root():

    return RedirectResponse(
        url="/docs"
    )


@app.get("/health")
def health():

    return {
        "status": "healthy"
    }