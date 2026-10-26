from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.api.database import Base, engine
from src import models
from src.api.routes.predictions import router as predictions_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Customer Churn Intelligence API",
    lifespan=lifespan,
)

app.include_router(predictions_router)


from fastapi.responses import RedirectResponse

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")
@app.get("/health")
def health():
    return {"status": "healthy"}