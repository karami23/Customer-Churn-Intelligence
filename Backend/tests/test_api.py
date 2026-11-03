import pytest


# --------------------------------------------------
# Shared Test Data
# --------------------------------------------------

@pytest.fixture
def customer_data():
    return {
        "customer_code": "TEST-001",
        "gender": "Female",
        "SeniorCitizen": 0,
        "Partner": "Yes",
        "Dependents": "No",
        "tenure": 12,
        "PhoneService": "Yes",
        "MultipleLines": "No",
        "InternetService": "Fiber optic",
        "OnlineSecurity": "No",
        "OnlineBackup": "Yes",
        "DeviceProtection": "No",
        "TechSupport": "No",
        "StreamingTV": "Yes",
        "StreamingMovies": "Yes",
        "Contract": "Month-to-month",
        "PaperlessBilling": "Yes",
        "PaymentMethod": "Electronic check",
        "MonthlyCharges": 85.5,
        "TotalCharges": 1026.0,
    }


@pytest.fixture
def created_prediction(client, monkeypatch, customer_data):
    from src.api.routes import predictions

    def fake_predict_churn(data):
        return {
            "prediction": "Yes",
            "churn_probability": 0.85,
            "risk_level": "High",
        }

    monkeypatch.setattr(
        predictions,
        "predict_churn",
        fake_predict_churn,
    )

    response = client.post(
        "/api/v1/predictions/predict",
        json=customer_data,
    )

    assert response.status_code in (200, 201)

    return response.json()


# --------------------------------------------------
# General API Tests
# --------------------------------------------------

def test_root(client):
    response = client.get("/", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "/docs"


def test_health(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


# --------------------------------------------------
# Prediction Tests
# --------------------------------------------------

def test_prediction_rejects_invalid_input(client):
    response = client.post(
        "/api/v1/predictions/predict",
        json={},
    )

    assert response.status_code == 422


def test_create_prediction(client, created_prediction):
    assert created_prediction["prediction"] == "Yes"
    assert created_prediction["churn_probability"] == 0.85
    assert created_prediction["risk_level"] == "High"
    assert created_prediction["customer_id"] is not None


def test_get_predictions_history(client, created_prediction):
    response = client.get("/api/v1/predictions/")

    assert response.status_code == 200

    data = response.json()

    assert len(data) >= 1
    assert any(
        item["id"] == created_prediction["id"]
        for item in data
    )


def test_get_prediction_by_id(client, created_prediction):
    prediction_id = created_prediction["id"]

    response = client.get(
        f"/api/v1/predictions/{prediction_id}"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == prediction_id
    assert data["prediction"] == "Yes"
    assert data["churn_probability"] == 0.85
    assert data["risk_level"] == "High"
    assert data["customer_data"]["gender"] == "Female"


def test_get_prediction_not_found(client):
    response = client.get(
        "/api/v1/predictions/999999"
    )

    assert response.status_code == 404


def test_delete_prediction(client, created_prediction):
    prediction_id = created_prediction["id"]

    response = client.delete(
        f"/api/v1/predictions/{prediction_id}"
    )

    assert response.status_code == 200

    detail_response = client.get(
        f"/api/v1/predictions/{prediction_id}"
    )

    assert detail_response.status_code == 404


# --------------------------------------------------
# Customer Tests
# --------------------------------------------------

def test_create_customer(client, customer_data):
    response = client.post(
        "/api/v1/customers/",
        json=customer_data,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["customer_code"] == "TEST-001"
    assert data["id"] is not None


def test_create_customer_duplicate_code(client, customer_data):
    first_response = client.post(
        "/api/v1/customers/",
        json=customer_data,
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/api/v1/customers/",
        json=customer_data,
    )

    assert second_response.status_code == 409


def test_get_customers(client, customer_data):
    client.post(
        "/api/v1/customers/",
        json=customer_data,
    )

    response = client.get("/api/v1/customers/")

    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_get_customer_by_id(client, customer_data):
    create_response = client.post(
        "/api/v1/customers/",
        json=customer_data,
    )

    customer_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/customers/{customer_id}"
    )

    assert response.status_code == 200
    assert response.json()["id"] == customer_id


def test_get_customer_not_found(client):
    response = client.get(
        "/api/v1/customers/999999"
    )

    assert response.status_code == 404


def test_get_customer_predictions(
    client,
    created_prediction,
):
    customer_id = created_prediction["customer_id"]

    response = client.get(
        f"/api/v1/customers/{customer_id}/predictions"
    )

    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_delete_customer(client, created_prediction):
    customer_id = created_prediction["customer_id"]

    response = client.delete(
        f"/api/v1/customers/{customer_id}"
    )

    assert response.status_code == 200

    # Prediction should remain after deleting its customer.
    prediction_response = client.get(
        f"/api/v1/predictions/{created_prediction['id']}"
    )

    assert prediction_response.status_code == 200
    assert prediction_response.json()["customer_id"] is None
def test_prediction_summary(client, created_prediction):
    response = client.get(
        "/api/v1/predictions/stats/summary"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total_predictions"] == 1
    assert data["churn_predictions"] == 1
    assert data["non_churn_predictions"] == 0
    assert data["average_churn_probability"] == 0.85


def test_prediction_risk_distribution(client, created_prediction):
    response = client.get(
        "/api/v1/predictions/stats/risks"
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)

    high_risk = next(
        (item for item in data if item["risk_level"] == "High"),
        None,
    )

    assert high_risk is not None
    assert high_risk["count"] == 1


def test_prediction_trend(client, created_prediction):
    response = client.get(
        "/api/v1/predictions/stats/trend"
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)