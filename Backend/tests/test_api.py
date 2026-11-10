import pytest

@pytest.fixture

def test_root(client):
    response = client.get("/", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "/docs"


def test_health(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_prediction_rejects_invalid_input(client):
    response = client.post(
        "/api/v1/predictions/predict",
        json={},
    )

    assert response.status_code == 422


def test_create_prediction(created_prediction):
    assert created_prediction["prediction"] == "Yes"
    assert created_prediction["churn_probability"] == 0.85
    assert created_prediction["risk_level"] == "High"


def test_prediction_without_customer_code(
    client,
    monkeypatch,
    customer_data,
):
    from src.api.routes import predictions

    def mock_predict_churn(customer):
        return {
            "prediction": "No",
            "churn_probability": 0.15,
            "risk_level": "Low",
        }

    monkeypatch.setattr(
        predictions,
        "predict_churn",
        mock_predict_churn,
    )

    payload = customer_data.copy()
    payload.pop("customer_code")

    response = client.post(
        "/api/v1/predictions/predict",
        json=payload,
    )

    assert response.status_code == 201

    prediction_id = response.json()["id"]

    detail_response = client.get(
        f"/api/v1/predictions/{prediction_id}"
    )

    assert detail_response.status_code == 200
    assert detail_response.json()["customer_id"] is None


def test_prediction_with_unknown_customer_code(
    client,
    monkeypatch,
    customer_data,
):
    from src.api.routes import predictions

    def mock_predict_churn(customer):
        return {
            "prediction": "Yes",
            "churn_probability": 0.85,
            "risk_level": "High",
        }

    monkeypatch.setattr(
        predictions,
        "predict_churn",
        mock_predict_churn,
    )

    response = client.post(
        "/api/v1/predictions/predict",
        json=customer_data,
    )

    assert response.status_code == 201

    customer_response = client.get(
        "/api/v1/customers/",
        params={"search": "TEST-001"},
    )

    assert customer_response.status_code == 200

    customers = customer_response.json()

    assert len(customers) == 1
    assert customers[0]["customer_code"] == "TEST-001"
    assert customers[0]["name"] is None


def test_prediction_updates_existing_customer(
    client,
    monkeypatch,
    customer_data,
):
    from src.api.routes import predictions

    # Create a customer manually
    create_response = client.post(
        "/api/v1/customers/",
        json={"name": "John Smith"},
    )

    assert create_response.status_code == 201

    created_customer = create_response.json()
    customer_code = created_customer["customer_code"]
    customer_id = created_customer["id"]

    def mock_predict_churn(customer):
        return {
            "prediction": "Yes",
            "churn_probability": 0.85,
            "risk_level": "High",
        }

    monkeypatch.setattr(
        predictions,
        "predict_churn",
        mock_predict_churn,
    )

    payload = customer_data.copy()
    payload["customer_code"] = customer_code

    prediction_response = client.post(
        "/api/v1/predictions/predict",
        json=payload,
    )

    assert prediction_response.status_code == 201

    prediction_id = prediction_response.json()["id"]

    detail_response = client.get(
        f"/api/v1/predictions/{prediction_id}"
    )

    assert detail_response.status_code == 200
    assert detail_response.json()["customer_id"] == customer_id

    customer_detail = client.get(
        f"/api/v1/customers/{customer_id}"
    )

    assert customer_detail.status_code == 200
    assert customer_detail.json()["name"] == "John Smith"
    assert customer_detail.json()["prediction_count"] == 1

def test_get_prediction_history(client, created_prediction):
    response = client.get("/api/v1/predictions/")
    assert response.status_code == 200

def test_get_prediction_detail(client, created_prediction):
    prediction_id = created_prediction["id"]

    response = client.get(
        f"/api/v1/predictions/{prediction_id}"
    )

    assert response.status_code == 200
    assert response.json()["id"] == prediction_id


def test_get_prediction_not_found(client):
    response = client.get("/api/v1/predictions/99999")
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

def test_create_customer(client):
    response = client.post(
        "/api/v1/customers/",
        json={"name": "John Smith"},
    )

    assert response.status_code == 201

    data = response.json()

    assert data["id"] is not None
    assert data["name"] == "John Smith"
    assert data["customer_code"].startswith("CUS-")
    assert len(data["customer_code"]) == 16
    assert data["customer_data"] == {}


def test_create_customer_rejects_empty_name(client):
    response = client.post(
        "/api/v1/customers/",
        json={"name": "   "},
    )

    assert response.status_code == 422


def test_create_customer_rejects_missing_name(client):
    response = client.post(
        "/api/v1/customers/",
        json={},
    )

    assert response.status_code == 422


def test_customer_codes_are_unique(client):
    first_response = client.post(
        "/api/v1/customers/",
        json={"name": "John"},
    )

    second_response = client.post(
        "/api/v1/customers/",
        json={"name": "Jane"},
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201

    first_code = first_response.json()["customer_code"]
    second_code = second_response.json()["customer_code"]

    assert first_code != second_code


def test_get_customers(client):
    client.post(
        "/api/v1/customers/",
        json={"name": "John Smith"},
    )

    response = client.get("/api/v1/customers/")

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_search_customers_by_name(client):
    client.post(
        "/api/v1/customers/",
        json={"name": "John Smith"},
    )

    response = client.get(
        "/api/v1/customers/",
        params={"search": "John"},
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "John Smith"


def test_search_customers_by_code(client):
    create_response = client.post(
        "/api/v1/customers/",
        json={"name": "John Smith"},
    )

    customer_code = create_response.json()["customer_code"]

    response = client.get(
        "/api/v1/customers/",
        params={"search": customer_code},
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["customer_code"] == customer_code


def test_get_customer_detail(client):
    create_response = client.post(
        "/api/v1/customers/",
        json={"name": "John Smith"},
    )

    customer_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/customers/{customer_id}"
    )

    assert response.status_code == 200
    assert response.json()["id"] == customer_id
    assert response.json()["name"] == "John Smith"
    assert response.json()["prediction_count"] == 0


def test_get_customer_not_found(client):
    response = client.get("/api/v1/customers/99999")

    assert response.status_code == 404


def test_get_customer_predictions(
    client,
    created_prediction,
):
    customer_response = client.get(
        "/api/v1/customers/",
        params={"search": "TEST-001"},
    )

    assert customer_response.status_code == 200

    customer_id = customer_response.json()[0]["id"]

    response = client.get(
        f"/api/v1/customers/{customer_id}/predictions"
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_delete_customer_preserves_predictions(
    client,
    created_prediction,
):
    customer_response = client.get(
        "/api/v1/customers/",
        params={"search": "TEST-001"},
    )

    customer_id = customer_response.json()[0]["id"]
    prediction_id = created_prediction["id"]

    delete_response = client.delete(
        f"/api/v1/customers/{customer_id}"
    )

    assert delete_response.status_code == 200

    customer_detail = client.get(
        f"/api/v1/customers/{customer_id}"
    )

    assert customer_detail.status_code == 404

    prediction_detail = client.get(
        f"/api/v1/predictions/{prediction_id}"
    )

    assert prediction_detail.status_code == 200
    assert prediction_detail.json()["customer_id"] is None

def test_dashboard_summary(client, created_prediction):
    response = client.get(
        "/api/v1/predictions/stats/summary"
    )

    assert response.status_code == 200


def test_dashboard_risk_distribution(client, created_prediction):
    response = client.get(
        "/api/v1/predictions/stats/risks"
    )

    assert response.status_code == 200


def test_dashboard_trend(client, created_prediction):
    response = client.get(
        "/api/v1/predictions/stats/trend"
    )

    assert response.status_code == 200